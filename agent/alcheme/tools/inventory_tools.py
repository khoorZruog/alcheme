"""Inventory management tools for the ADK agents.

These tool functions are called by ADK agents. Docstrings are used as tool
descriptions by ADK, so they are written in English.

All tools that need user context receive it from `tool_context.state["user:id"]`.
"""

import json
import uuid
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

_db: firestore.Client | None = None


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _inventory_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("inventory")


def _resolve_user_id(tool_context: ToolContext) -> str:
    return tool_context.state.get("user:id", "test-user-001")


# Fields to exclude from tool responses to avoid sending huge data (base64 images) to the LLM
_LARGE_FIELDS = {"image_url", "rakuten_image_url", "product_url", "candidates"}


def _slim_item(raw: dict) -> dict:
    """Return item dict without large fields that would bloat the LLM context."""
    return {k: v for k, v in raw.items() if k not in _LARGE_FIELDS}


def generate_item_id() -> str:
    """Generate a unique item ID for a new inventory item.

    Returns:
        A unique item ID string prefixed with 'item_'.
    """
    return f"item_{uuid.uuid4().hex[:8]}"


def get_inventory_summary(tool_context: ToolContext) -> dict:
    """Get a summary of the user's cosmetics inventory including category counts and total items."""
    try:
        user_id = _resolve_user_id(tool_context)
        docs = _inventory_ref(user_id).stream()
        items = [doc.to_dict() | {"id": doc.id} for doc in docs]

        categories: dict[str, int] = {}
        item_summaries: list[str] = []
        for item in items:
            cat = item.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + 1
            brand = item.get("brand", "?")
            name = item.get("product_name", "?")
            remaining = item.get("estimated_remaining", "?")
            item_summaries.append(f"{brand} {name} (残量{remaining})")

        # Persist summary in session state for Concierge context
        tool_context.state["session:current_inventory_summary"] = {
            "total": len(items),
            "categories": categories,
        }

        return {
            "status": "success",
            "total_items": len(items),
            "category_counts": categories,
            "items": item_summaries,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def search_inventory(query: str, tool_context: ToolContext) -> dict:
    """Search inventory items by brand name, product name, or color keyword.

    Args:
        query: Search keyword to match against brand, product_name, or color_description.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        docs = _inventory_ref(user_id).stream()
        results = []
        q_lower = query.lower()
        for doc in docs:
            item = doc.to_dict() | {"id": doc.id}
            brand = (item.get("brand") or "").lower()
            name = (item.get("product_name") or "").lower()
            color = (item.get("color_description") or "").lower()
            if q_lower in brand or q_lower in name or q_lower in color:
                results.append(_slim_item(item))
        return {"status": "success", "items": results, "count": len(results)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def filter_inventory_by_category(category: str, tool_context: ToolContext) -> dict:
    """Filter inventory items by cosmetics category.

    Args:
        category: Category to filter by — one of Lip, Eye, Cheek, Base, Other.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        docs = (
            _inventory_ref(user_id)
            .where(filter=firestore.FieldFilter("category", "==", category))
            .stream()
        )
        items = [_slim_item(doc.to_dict() | {"id": doc.id}) for doc in docs]
        return {"status": "success", "items": items, "count": len(items)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def add_items_to_inventory(items_json: str, tool_context: ToolContext) -> dict:
    """Add one or more cosmetic items to the user's inventory in Firestore.

    Args:
        items_json: A JSON string representing a list of inventory item dicts.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        items = json.loads(items_json)
        if not isinstance(items, list):
            items = [items]

        added_ids = []
        ref = _inventory_ref(user_id)
        for item in items:
            item_id = item.pop("id", None) or generate_item_id()
            item["createdAt"] = firestore.SERVER_TIMESTAMP
            item["updatedAt"] = firestore.SERVER_TIMESTAMP
            ref.document(item_id).set(item)
            added_ids.append(item_id)

        return {"status": "success", "added_ids": added_ids}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_inventory(tool_context: ToolContext) -> dict:
    """Get the full inventory for the current user as a list of items."""
    try:
        user_id = _resolve_user_id(tool_context)
        docs = _inventory_ref(user_id).stream()
        items = [_slim_item(doc.to_dict() | {"id": doc.id}) for doc in docs]
        return {"status": "success", "items": items}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def validate_recipe_items(item_ids_json: str, tool_context: ToolContext) -> dict:
    """Validate that all item IDs in a recipe exist in the user's inventory.

    Args:
        item_ids_json: A JSON string representing a list of item ID strings to validate.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        item_ids = json.loads(item_ids_json)
        if not isinstance(item_ids, list):
            return {"status": "error", "message": "item_ids_json must be a JSON array of strings"}

        ref = _inventory_ref(user_id)
        missing = []
        for item_id in item_ids:
            doc = ref.document(item_id).get()
            if not doc.exists:
                missing.append(item_id)

        return {
            "status": "success",
            "all_valid": len(missing) == 0,
            "missing_items": missing,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
