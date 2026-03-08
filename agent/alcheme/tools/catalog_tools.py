"""Global product catalog tools.

Provides catalog upsert (mirroring the TypeScript lib/api/catalog-upsert.ts)
and search functionality for the shared product catalog.
"""

import hashlib
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


# Fields eligible for the global catalog (universal/objective info)
_CATALOG_FIELDS = {
    "brand", "product_name", "category", "item_type", "color_code", "color_name",
    "color_description", "hex_color", "texture", "pao_months", "price", "product_url",
    "image_url", "rakuten_image_url",
}


def _catalog_doc_id(brand: str, product_name: str, color_code: str | None = None) -> str:
    """Deterministic catalog document ID — SHA-256 first 20 hex chars.

    Must produce identical IDs to the TypeScript catalogDocId() in
    lib/api/catalog-upsert.ts.
    """
    normalized = (
        f"{(brand or '').strip().lower()}"
        f"::{(product_name or '').strip().lower()}"
        f"::{(color_code or '').strip().lower()}"
    )
    return hashlib.sha256(normalized.encode()).hexdigest()[:20]


def upsert_catalog(product_fields: dict, count_type: str = "have") -> str:
    """Upsert a product into the global catalog collection.

    - New entry: set all fields + have_count/want_count based on count_type
    - Existing entry: fill null fields only + increment the appropriate count

    Args:
        product_fields: Product data dict.
        count_type: "have" (inventory registration) or "want" (suggestion/wishlist).

    Returns the catalog document ID, or empty string if brand/product_name missing.
    """
    brand = (product_fields.get("brand") or "").strip()
    product_name = (product_fields.get("product_name") or "").strip()
    if not brand or not product_name:
        return ""

    color_code = product_fields.get("color_code")
    doc_id = _catalog_doc_id(brand, product_name, color_code)
    db = _get_db()
    catalog_ref = db.collection("catalog").document(doc_id)

    # Extract catalog-eligible fields (skip None/empty)
    catalog_data: dict[str, Any] = {}
    for field in _CATALOG_FIELDS:
        val = product_fields.get(field)
        if val is not None and val != "":
            catalog_data[field] = val

    catalog_data["brand_normalized"] = brand.lower()
    catalog_data["product_name_normalized"] = product_name.lower()
    catalog_data["dedupe_key"] = (
        f"{brand.lower()}::{product_name.lower()}::{(color_code or '').strip().lower()}"
    )

    existing = catalog_ref.get()

    if existing.exists:
        existing_data = existing.to_dict() or {}
        count_field = "have_count" if count_type == "have" else "want_count"
        updates: dict[str, Any] = {
            "updated_at": firestore.SERVER_TIMESTAMP,
            "contributor_count": firestore.Increment(1),
            count_field: firestore.Increment(1),
        }
        for key, val in catalog_data.items():
            if val and not existing_data.get(key):
                updates[key] = val
        catalog_ref.update(updates)
        logger.info("Updated catalog entry %s (contributor +1)", doc_id)
    else:
        catalog_ref.set({
            **catalog_data,
            "contributor_count": 1,
            "have_count": 1 if count_type == "have" else 0,
            "want_count": 1 if count_type == "want" else 0,
            "use_count": 0,
            "total_rating": 0,
            "rating_count": 0,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        logger.info("Created catalog entry %s", doc_id)

    return doc_id


def search_catalog(query: str, tool_context: ToolContext) -> dict:
    """Search the global product catalog by brand or product name.

    Use this when a user asks about a cosmetic product — it checks
    whether the product is already known in the community catalog.

    Args:
        query: Search keyword to match against brand or product name.
    """
    try:
        db = _get_db()
        q_lower = query.strip().lower()

        if len(q_lower) < 2:
            return {"status": "error", "message": "Query must be at least 2 characters"}

        # Prefix match on brand_normalized
        brand_docs = list(
            db.collection("catalog")
            .where("brand_normalized", ">=", q_lower)
            .where("brand_normalized", "<", q_lower + "\uf8ff")
            .limit(10)
            .stream()
        )

        # Prefix match on product_name_normalized
        name_docs = list(
            db.collection("catalog")
            .where("product_name_normalized", ">=", q_lower)
            .where("product_name_normalized", "<", q_lower + "\uf8ff")
            .limit(10)
            .stream()
        )

        seen: set[str] = set()
        results: list[dict] = []
        for doc in brand_docs + name_docs:
            if doc.id in seen:
                continue
            seen.add(doc.id)
            data = doc.to_dict() or {}
            results.append({
                "catalog_id": doc.id,
                "brand": data.get("brand"),
                "product_name": data.get("product_name"),
                "category": data.get("category"),
                "item_type": data.get("item_type"),
                "color_code": data.get("color_code"),
                "color_name": data.get("color_name"),
                "image_url": data.get("image_url"),
                "contributor_count": data.get("contributor_count", 0),
                "have_count": data.get("have_count", 0),
                "want_count": data.get("want_count", 0),
                "use_count": data.get("use_count", 0),
                "total_rating": data.get("total_rating", 0),
                "rating_count": data.get("rating_count", 0),
            })

        return {"status": "success", "results": results, "count": len(results)}
    except Exception as e:
        logger.error("search_catalog error: %s", e, exc_info=True)
        return {"status": "error", "message": str(e)}
