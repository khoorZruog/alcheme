"""Inventory management tools for the ADK agents.

These tool functions are called by ADK agents. Docstrings are used as tool
descriptions by ADK, so they are written in English.

All tools that need user context receive it from `tool_context.state["user:id"]`.

Data model:
  - users/{userId}/products/{productId}   — 商品マスタ (SKU)
  - users/{userId}/inventory/{itemId}     — 在庫個体 (physical item)
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


def _user_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id)


def _inventory_ref(user_id: str) -> Any:
    return _user_ref(user_id).collection("inventory")


def _products_ref(user_id: str) -> Any:
    return _user_ref(user_id).collection("products")


def _resolve_user_id(tool_context: ToolContext) -> str:
    return tool_context.state.get("user:id", "test-user-001")


# Fields to exclude from tool responses to avoid sending huge data to the LLM
_LARGE_FIELDS = {"image_url", "rakuten_image_url", "product_url", "candidates", "images"}

# Product fields (stored in products collection)
_PRODUCT_FIELDS = {
    "brand", "product_name", "category", "item_type", "color_code", "color_name",
    "color_description", "texture", "stats", "rarity", "pao_months", "price",
    "product_url", "image_url", "rakuten_image_url", "source", "confidence", "images",
}


def _slim_item(raw: dict) -> dict:
    """Return item dict without large fields that would bloat the LLM context."""
    return {k: v for k, v in raw.items() if k not in _LARGE_FIELDS}


def _dedupe_key(brand: str, product_name: str, color_code: str | None = None) -> str:
    return f"{(brand or '').lower()}::{(product_name or '').lower()}::{(color_code or '').lower()}"


def _get_enriched_items(user_id: str) -> list[dict]:
    """Fetch all inventory items joined with product data."""
    # Fetch products and inventory in parallel-ish
    products_docs = list(_products_ref(user_id).stream())
    inventory_docs = list(_inventory_ref(user_id).stream())

    product_map: dict[str, dict] = {}
    for doc in products_docs:
        product_map[doc.id] = doc.to_dict() | {"id": doc.id}

    items = []
    for doc in inventory_docs:
        data = doc.to_dict()
        if data.get("product_id") and data["product_id"] in product_map:
            product = product_map[data["product_id"]]
            enriched = {
                "id": doc.id,
                "product_id": data["product_id"],
                **{k: v for k, v in product.items() if k != "id"},
                "estimated_remaining": data.get("estimated_remaining", "100%"),
                "purchase_date": data.get("purchase_date"),
                "open_date": data.get("open_date"),
                "memo": data.get("memo"),
            }
            items.append(enriched)
        else:
            # Legacy item (not yet migrated)
            items.append(data | {"id": doc.id})

    return items


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
        items = _get_enriched_items(user_id)

        categories: dict[str, int] = {}
        item_summaries: list[str] = []
        for item in items:
            cat = item.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + 1
            brand = item.get("brand", "?")
            name = item.get("product_name", "?")
            remaining = item.get("estimated_remaining", "?")
            color = item.get("color_name", "")
            color_code = item.get("color_code", "")
            color_info = f" #{color_code} {color}" if color_code else (f" {color}" if color else "")
            item_summaries.append(f"{brand} {name}{color_info} (残量{remaining})")

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
    """Search inventory items by brand name, product name, color code, or color name.

    Args:
        query: Search keyword to match against brand, product_name, color_code, color_name, or color_description.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        items = _get_enriched_items(user_id)
        results = []
        q_lower = query.lower()
        for item in items:
            brand = (item.get("brand") or "").lower()
            name = (item.get("product_name") or "").lower()
            color = (item.get("color_description") or "").lower()
            color_code = (item.get("color_code") or "").lower()
            color_name = (item.get("color_name") or "").lower()
            if q_lower in brand or q_lower in name or q_lower in color or q_lower in color_code or q_lower in color_name:
                results.append(_slim_item(item))
        return {"status": "success", "items": results, "count": len(results)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def filter_inventory_by_category(category: str, tool_context: ToolContext) -> dict:
    """Filter inventory items by cosmetics category.

    Args:
        category: Category to filter by — one of ベースメイク, アイメイク, リップ, スキンケア, その他.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        items = _get_enriched_items(user_id)
        filtered = [_slim_item(item) for item in items if item.get("category") == category]
        return {"status": "success", "items": filtered, "count": len(filtered)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def add_items_to_inventory(items_json: str, tool_context: ToolContext) -> dict:
    """Add one or more cosmetic items to the user's inventory in Firestore.
    Automatically splits data into product master and inventory instance.

    Args:
        items_json: A JSON string representing a list of inventory item dicts.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        items = json.loads(items_json)
        if not isinstance(items, list):
            items = [items]

        products_ref = _products_ref(user_id)
        inventory_ref = _inventory_ref(user_id)

        # Load existing products for dedupe
        existing = {_dedupe_key(d.get("brand", ""), d.get("product_name", ""), d.get("color_code")): doc.id
                    for doc in products_ref.stream()
                    for d in [doc.to_dict()]}

        added_ids = []
        for item in items:
            item.pop("id", None)

            # Split fields
            product_fields = {k: v for k, v in item.items() if k in _PRODUCT_FIELDS}
            instance_fields = {k: v for k, v in item.items() if k not in _PRODUCT_FIELDS}

            # Upsert product
            key = _dedupe_key(
                product_fields.get("brand", ""),
                product_fields.get("product_name", ""),
                product_fields.get("color_code"),
            )
            product_id = existing.get(key)

            if not product_id:
                product_doc = products_ref.document()
                product_fields["created_at"] = firestore.SERVER_TIMESTAMP
                product_fields["updated_at"] = firestore.SERVER_TIMESTAMP
                product_doc.set(product_fields)
                product_id = product_doc.id
                existing[key] = product_id

            # Create inventory instance
            inv_doc = inventory_ref.document()
            inv_doc.set({
                "product_id": product_id,
                "estimated_remaining": instance_fields.get("estimated_remaining", "100%"),
                "purchase_date": instance_fields.get("purchase_date"),
                "open_date": instance_fields.get("open_date"),
                "memo": instance_fields.get("memo"),
                "created_at": firestore.SERVER_TIMESTAMP,
                "updated_at": firestore.SERVER_TIMESTAMP,
            })
            added_ids.append(inv_doc.id)

        return {"status": "success", "added_ids": added_ids}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_inventory(tool_context: ToolContext) -> dict:
    """Get the full inventory for the current user as a list of items (enriched with product data)."""
    try:
        user_id = _resolve_user_id(tool_context)
        items = _get_enriched_items(user_id)
        return {"status": "success", "items": [_slim_item(i) for i in items]}
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
