"""Shopping consultation tools for the ADK agents.

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


def _inventory_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("inventory")


def _resolve_user_id(tool_context: ToolContext) -> str:
    return tool_context.state.get("user:id", "test-user-001")


# Fields to exclude from analysis output to keep LLM context small
_LARGE_FIELDS = {"image_url", "rakuten_image_url", "product_url", "candidates"}


def _slim_item(raw: dict) -> dict:
    """Return item dict without large fields that would bloat the LLM context."""
    return {k: v for k, v in raw.items() if k not in _LARGE_FIELDS}


def _normalize_category(category: str) -> str:
    """Normalize category names for comparison (handle EN/JA variants)."""
    mapping = {
        "Lip": "リップ",
        "Eye": "アイメイク",
        "Cheek": "ベースメイク",
        "Base": "ベースメイク",
        "Other": "その他",
    }
    return mapping.get(category, category)


def _find_similar_items(product: dict, inventory: list[dict]) -> list[dict]:
    """Find inventory items similar to the given product."""
    similar = []
    p_brand = (product.get("brand") or "").lower()
    p_name = (product.get("product_name") or "").lower()
    p_category = _normalize_category(product.get("category") or "")
    p_item_type = (product.get("item_type") or "").lower()
    p_color = (product.get("color_description") or product.get("color_name") or "").lower()
    p_texture = (product.get("texture") or "").lower()

    for item in inventory:
        score = 0
        reasons = []
        i_brand = (item.get("brand") or "").lower()
        i_name = (item.get("product_name") or "").lower()
        i_category = _normalize_category(item.get("category") or "")
        i_item_type = (item.get("item_type") or "").lower()
        i_color = (item.get("color_description") or item.get("color_name") or "").lower()
        i_texture = (item.get("texture") or "").lower()

        # Same brand + same product line = near duplicate
        if p_brand and i_brand and p_brand == i_brand:
            score += 1
            reasons.append("same_brand")
            if p_name and i_name and (p_name in i_name or i_name in p_name):
                score += 2
                reasons.append("same_product_line")

        # Same item_type = functional overlap
        if p_item_type and i_item_type and p_item_type == i_item_type:
            score += 2
            reasons.append("same_item_type")
        elif p_category and i_category and p_category == i_category:
            score += 1
            reasons.append("same_category")

        # Similar color
        if p_color and i_color and (p_color in i_color or i_color in p_color):
            score += 1
            reasons.append("similar_color")

        # Same texture
        if p_texture and i_texture and p_texture == i_texture:
            score += 1
            reasons.append("same_texture")

        if score >= 2:
            similar.append({
                "item": _slim_item(item),
                "similarity_score": score,
                "reasons": reasons,
            })

    similar.sort(key=lambda x: x["similarity_score"], reverse=True)
    return similar[:5]  # Top 5 most similar


def analyze_product_compatibility(product_info_json: str, tool_context: ToolContext) -> dict:
    """Analyze how a product the user is considering purchasing fits with their existing cosmetics inventory.

    Returns category overlap, similar items already owned, duplicate risk level, and gap analysis.
    Does NOT make a buy/don't-buy recommendation — the LLM interprets the data.

    Args:
        product_info_json: A JSON string with product details. Expected fields:
            brand, product_name, category, item_type, color_description, texture.
            At minimum brand and product_name should be provided.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        product = json.loads(product_info_json)

        # Fetch full inventory
        docs = _inventory_ref(user_id).stream()
        inventory = [_slim_item(doc.to_dict() | {"id": doc.id}) for doc in docs]

        if not inventory:
            return {
                "status": "success",
                "inventory_size": 0,
                "message": "ユーザーの在庫が空です。初めてのアイテムとなります。",
                "category_overlap": {},
                "similar_items": [],
                "duplicate_risk": "none",
                "gap_analysis": "inventory_empty",
            }

        p_category = _normalize_category(product.get("category") or "")

        # Category overlap analysis
        category_counts: dict[str, int] = {}
        for item in inventory:
            cat = _normalize_category(item.get("category") or "その他")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        same_category_count = category_counts.get(p_category, 0) if p_category else 0

        # Find similar items
        similar = _find_similar_items(product, inventory)

        # Determine duplicate risk
        duplicate_risk = "none"
        if similar:
            top_score = similar[0]["similarity_score"]
            if top_score >= 5:
                duplicate_risk = "high"
            elif top_score >= 3:
                duplicate_risk = "medium"
            else:
                duplicate_risk = "low"

        # Gap analysis
        gap_analysis = "fills_gap" if same_category_count == 0 and p_category else "adds_variety"
        if duplicate_risk == "high":
            gap_analysis = "near_duplicate"

        return {
            "status": "success",
            "inventory_size": len(inventory),
            "product_analyzed": {
                "brand": product.get("brand"),
                "product_name": product.get("product_name"),
                "category": p_category,
                "item_type": product.get("item_type"),
            },
            "category_counts": category_counts,
            "same_category_count": same_category_count,
            "similar_items": similar,
            "duplicate_risk": duplicate_risk,
            "gap_analysis": gap_analysis,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def compare_products_against_inventory(products_json: str, tool_context: ToolContext) -> dict:
    """Compare two or more products against the user's inventory to help decide which to purchase.

    Returns per-product compatibility analysis so the LLM can advise which product
    better complements the user's existing collection.

    Args:
        products_json: A JSON string representing a list of product dicts to compare.
            Each product should have: brand, product_name, category, item_type,
            color_description, texture. At minimum brand and product_name per product.
    """
    try:
        user_id = _resolve_user_id(tool_context)
        products = json.loads(products_json)
        if not isinstance(products, list) or len(products) < 2:
            return {"status": "error", "message": "At least 2 products are required for comparison."}

        # Fetch inventory once
        docs = _inventory_ref(user_id).stream()
        inventory = [_slim_item(doc.to_dict() | {"id": doc.id}) for doc in docs]

        # Category counts (shared across products)
        category_counts: dict[str, int] = {}
        for item in inventory:
            cat = _normalize_category(item.get("category") or "その他")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        comparisons = []
        for product in products:
            p_category = _normalize_category(product.get("category") or "")
            same_category_count = category_counts.get(p_category, 0) if p_category else 0
            similar = _find_similar_items(product, inventory)

            duplicate_risk = "none"
            if similar:
                top_score = similar[0]["similarity_score"]
                if top_score >= 5:
                    duplicate_risk = "high"
                elif top_score >= 3:
                    duplicate_risk = "medium"
                else:
                    duplicate_risk = "low"

            gap_analysis = "fills_gap" if same_category_count == 0 and p_category else "adds_variety"
            if duplicate_risk == "high":
                gap_analysis = "near_duplicate"

            comparisons.append({
                "product": {
                    "brand": product.get("brand"),
                    "product_name": product.get("product_name"),
                    "category": p_category,
                    "item_type": product.get("item_type"),
                },
                "same_category_count": same_category_count,
                "similar_items": similar,
                "duplicate_risk": duplicate_risk,
                "gap_analysis": gap_analysis,
            })

        return {
            "status": "success",
            "inventory_size": len(inventory),
            "category_counts": category_counts,
            "comparisons": comparisons,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
