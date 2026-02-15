"""Recipe management tools for the ADK agents.

Docstrings are used as tool descriptions by ADK.
All tools that need user context receive it from tool_context.state["user:id"].
"""

import json
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

_db: firestore.Client | None = None


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _recipes_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("recipes")


def save_recipe(recipe_json: str, tool_context: ToolContext) -> dict:
    """Save a generated recipe to the user's Firestore recipes collection.

    Args:
        recipe_json: A JSON string of the recipe object to save.
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")
        recipe = json.loads(recipe_json)

        # --- Unwrap nested structure ---
        # The alchemist prompt specifies {"recipe": {...}, "used_items": [...], ...}
        # Extract the inner recipe object if present
        if "recipe" in recipe and isinstance(recipe["recipe"], dict):
            inner = recipe["recipe"]
            # Preserve used_items / validation at top level for reference
            if "used_items" in recipe:
                inner["used_items"] = recipe["used_items"]
            recipe = inner

        # --- Normalize field names to match BFF expectations (snake_case) ---
        # Alchemist outputs "title" but BFF/frontend expects "recipe_name"
        if "title" in recipe and "recipe_name" not in recipe:
            recipe["recipe_name"] = recipe.pop("title")

        # Ensure required fields have defaults
        recipe.setdefault("recipe_name", "メイクレシピ")
        recipe.setdefault("user_request", "")
        recipe.setdefault("is_favorite", False)
        recipe.setdefault("pro_tips", [])
        recipe.setdefault("thinking_process", [])

        # Use snake_case timestamps to match BFF orderBy('created_at')
        recipe["created_at"] = firestore.SERVER_TIMESTAMP
        recipe["updated_at"] = firestore.SERVER_TIMESTAMP
        # Remove camelCase variants if present
        recipe.pop("createdAt", None)
        recipe.pop("updatedAt", None)

        doc_ref = _recipes_ref(user_id).document()
        doc_ref.set(recipe)
        return {"status": "success", "recipe_id": doc_ref.id}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_recent_recipes(tool_context: ToolContext, limit: int = 5) -> dict:
    """Get the user's most recent recipes.

    Args:
        limit: Maximum number of recipes to return (default 5).
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")
        docs = (
            _recipes_ref(user_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        recipes = [doc.to_dict() | {"id": doc.id} for doc in docs]
        return {"status": "success", "recipes": recipes}
    except Exception as e:
        return {"status": "error", "message": str(e)}
