"""Suggestion tools for saving buy-more item recommendations.

When the alchemist suggests a plus-one item, this tool persists it to
the user's suggested_items collection in Firestore with deduplication.
"""

import json
import logging
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

logger = logging.getLogger(__name__)

_db: firestore.Client | None = None


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _suggestions_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("suggested_items")


def _dedupe_key(brand: str, product_name: str, color_code: str | None = None) -> str:
    return f"{(brand or '').lower()}::{(product_name or '').lower()}::{(color_code or '').lower()}"


def save_suggestion(suggestion_json: str, tool_context: ToolContext) -> dict:
    """Save a buy-more item suggestion to the user's suggestion list.

    Call this when you make a plus-one (プラスワン) suggestion — an item
    the user does not own but would improve a recipe.

    Args:
        suggestion_json: JSON string with the suggestion. Required fields:
            brand (str), product_name (str), reason (str).
            Optional: color_code, color_name, category, item_type,
            recipe_id, recipe_name.

    Returns:
        Dict with status and the suggestion document id.
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")
        data = json.loads(suggestion_json)

        brand = data.get("brand", "")
        product_name = data.get("product_name", "")
        if not brand or not product_name:
            return {"status": "error", "message": "brand and product_name are required"}

        color_code = data.get("color_code")
        reason = data.get("reason", "")

        col_ref = _suggestions_ref(user_id)
        key = _dedupe_key(brand, product_name, color_code)

        # Check for duplicates
        existing_doc = None
        for doc in col_ref.stream():
            d = doc.to_dict()
            if _dedupe_key(d.get("brand", ""), d.get("product_name", ""), d.get("color_code")) == key:
                existing_doc = doc
                break

        history_entry = {
            "recipe_id": data.get("recipe_id"),
            "recipe_name": data.get("recipe_name"),
            "suggested_at": firestore.SERVER_TIMESTAMP,
            "context": reason,
        }

        if existing_doc:
            # Increment recommendation count
            existing_data = existing_doc.to_dict()
            history = existing_data.get("history", [])
            existing_doc.reference.update({
                "recommendation_count": (existing_data.get("recommendation_count", 1)) + 1,
                "history": history + [history_entry],
                "reason": reason or existing_data.get("reason", ""),
                "updated_at": firestore.SERVER_TIMESTAMP,
            })
            logger.info("Updated existing suggestion %s for user %s", existing_doc.id, user_id)
            return {"status": "success", "suggestion_id": existing_doc.id, "incremented": True}

        # Create new suggestion
        doc_ref = col_ref.document()
        doc_ref.set({
            "brand": brand,
            "product_name": product_name,
            "color_code": color_code,
            "color_name": data.get("color_name"),
            "category": data.get("category"),
            "item_type": data.get("item_type"),
            "reason": reason,
            "recommendation_count": 1,
            "history": [history_entry],
            "status": "候補",
            "source": "ai",
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        logger.info("Created new suggestion %s for user %s", doc_ref.id, user_id)
        return {"status": "success", "suggestion_id": doc_ref.id, "incremented": False}

    except Exception as e:
        logger.error("save_suggestion error: %s", e, exc_info=True)
        return {"status": "error", "message": str(e)}
