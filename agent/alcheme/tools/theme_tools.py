"""Theme suggestion tools.

Generates makeup theme suggestions using Gemini and creates
preview images for each theme.
Results are persisted to the *recipes* collection (source="theme").
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any

from google import genai
from google.cloud import firestore, storage
from google.genai import types

from ..prompts.theme_generator import build_theme_generation_prompt, build_theme_image_prompt
from ..prompts.simulator import CHARACTER_THEMES

logger = logging.getLogger(__name__)

_storage_client: storage.Client | None = None
_firestore_db: firestore.Client | None = None


def _get_storage() -> storage.Client:
    global _storage_client
    if _storage_client is None:
        _storage_client = storage.Client()
    return _storage_client


def _get_firestore() -> firestore.Client:
    global _firestore_db
    if _firestore_db is None:
        _firestore_db = firestore.Client()
    return _firestore_db


def _build_user_context(user_id: str) -> dict:
    """Build user context for theme generation by reading Firestore data."""
    db = _get_firestore()
    context: dict[str, Any] = {}

    # --- User profile ---
    try:
        user_doc = db.collection("users").document(user_id).get()
        if user_doc.exists:
            profile_data = user_doc.to_dict() or {}
            context["profile"] = {
                "personal_color": profile_data.get("personalColor", ""),
                "skin_type": profile_data.get("skinType", ""),
                "beauty_goals": profile_data.get("beautyGoals", ""),
            }
    except Exception as e:
        logger.warning("Failed to fetch user profile for theme gen: %s", e)

    # --- Inventory summary ---
    try:
        inv_ref = db.collection("users").document(user_id).collection("inventory")
        prod_ref = db.collection("users").document(user_id).collection("products")

        categories: dict[str, int] = {}
        item_summaries: list[str] = []
        underused: list[str] = []
        thirty_days_ago = datetime.now(timezone.utc).timestamp() - (30 * 86400)

        for doc in inv_ref.stream():
            item = doc.to_dict() or {}
            cat = item.get("category", "Other")
            categories[cat] = categories.get(cat, 0) + 1

            # Enrich with product data
            brand = item.get("brand", "")
            product_name = item.get("product_name", "")
            product_id = item.get("product_id", "")
            if product_id and (not brand or not product_name):
                try:
                    prod_doc = prod_ref.document(product_id).get()
                    if prod_doc.exists:
                        prod_data = prod_doc.to_dict() or {}
                        brand = brand or prod_data.get("brand", "")
                        product_name = product_name or prod_data.get("product_name", "")
                except Exception:
                    pass

            color = item.get("color_name", "") or item.get("color_description", "")
            remaining = item.get("estimated_remaining", "?")
            color_info = f" ({color})" if color else ""
            item_summaries.append(f"{brand} {product_name}{color_info} 残量{remaining}")

            # Check if underused
            updated = item.get("updatedAt") or item.get("updated_at")
            if updated and hasattr(updated, "timestamp"):
                if updated.timestamp() < thirty_days_ago:
                    underused.append(f"{brand} {product_name}{color_info}")

        context["inventory_summary"] = {
            "total": sum(categories.values()),
            "categories": categories,
            "items": item_summaries,
        }
        if underused:
            context["underused_items"] = underused
    except Exception as e:
        logger.warning("Failed to fetch inventory for theme gen: %s", e)

    # --- Season ---
    now = datetime.now(timezone.utc)
    month = now.month
    if 3 <= month <= 5:
        context["season"] = "春"
    elif 6 <= month <= 8:
        context["season"] = "夏"
    elif 9 <= month <= 11:
        context["season"] = "秋"
    else:
        context["season"] = "冬"

    # --- Recent recipes (avoid repetition) ---
    try:
        recipes_ref = (
            db.collection("users")
            .document(user_id)
            .collection("recipes")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(5)
        )
        recent_names: list[str] = []
        for doc in recipes_ref.stream():
            recipe = doc.to_dict() or {}
            name = recipe.get("recipe_name", "")
            if name:
                recent_names.append(name)
        if recent_names:
            context["recent_recipes"] = recent_names
    except Exception as e:
        logger.warning("Failed to fetch recent recipes for theme gen: %s", e)

    return context


async def generate_theme_suggestions(user_id: str) -> dict[str, Any]:
    """Generate 3 makeup theme suggestions using Gemini and save to Firestore.

    Args:
        user_id: User ID for context and Firestore storage.

    Returns:
        Dict with 'status' and 'themes' (list of theme dicts with id).
    """
    model_name = os.environ.get("THEME_MODEL", "gemini-2.5-flash")

    try:
        # Build user context
        user_context = _build_user_context(user_id)

        # Build prompt
        prompt = build_theme_generation_prompt(user_context)
        logger.info("Generating theme suggestions for user %s (model=%s)", user_id, model_name)

        # Call Gemini for text generation
        use_vertexai = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").upper() == "TRUE"
        if use_vertexai:
            project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
            location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
            client = genai.Client(vertexai=True, project=project, location=location)
        else:
            client = genai.Client()

        response = await client.aio.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.9,
                response_mime_type="application/json",
            ),
        )

        # Parse response
        response_text = response.text.strip()
        # Remove markdown code fences if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1] if "\n" in response_text else response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3].strip()

        themes_raw = json.loads(response_text)
        if not isinstance(themes_raw, list) or len(themes_raw) == 0:
            return {"status": "error", "error": "Invalid response format from model"}

        # Validate and save each theme to the recipes collection
        db = _get_firestore()
        recipes_ref = db.collection("users").document(user_id).collection("recipes")
        now_iso = datetime.now(timezone.utc).isoformat()
        saved_themes: list[dict] = []

        valid_themes = ["cute", "cool", "elegant"]
        for i, raw in enumerate(themes_raw[:3]):
            theme_id = str(uuid.uuid4())[:8]
            char_theme = raw.get("character_theme", valid_themes[i % 3])
            if char_theme not in valid_themes:
                char_theme = valid_themes[i % 3]

            title = str(raw.get("title", f"テーマ {i + 1}"))
            description = str(raw.get("description", ""))

            theme_doc = {
                # Theme fields
                "theme_title": title,
                "theme_description": description,
                "style_keywords": raw.get("style_keywords", []),
                "character_theme": char_theme,
                "theme_status": "active",
                "theme_context": {
                    "season": user_context.get("season", ""),
                },
                # Recipe skeleton (theme-only entry)
                "recipe_name": title,
                "user_request": "",
                "steps": [],
                "thinking_process": [],
                "pro_tips": [],
                "is_favorite": False,
                "source": "theme",
                "created_at": now_iso,
                "updated_at": now_iso,
            }

            recipes_ref.document(theme_id).set(theme_doc)
            # Return with legacy field names for frontend compatibility
            saved_themes.append({
                "id": theme_id,
                "title": title,
                "description": description,
                "style_keywords": theme_doc["style_keywords"],
                "character_theme": char_theme,
                "status": "active",
                "context": theme_doc["theme_context"],
                "created_at": now_iso,
                "updated_at": now_iso,
            })
            logger.info("Theme saved to recipes: %s — %s (%s)", theme_id, title, char_theme)

        return {"status": "success", "themes": saved_themes}

    except json.JSONDecodeError as e:
        logger.error("Failed to parse theme JSON: %s", e)
        return {"status": "error", "error": f"JSON parse error: {e}"}
    except Exception as e:
        logger.error("Theme generation failed for user %s: %s", user_id, e, exc_info=True)
        return {"status": "error", "error": str(e)}


async def generate_theme_image(
    theme_id: str,
    user_id: str,
    theme: dict,
) -> dict[str, Any]:
    """Generate a preview image for a theme suggestion.

    Args:
        theme_id: Firestore document ID of the theme.
        user_id: User ID for storage path and Firestore update.
        theme: Theme dict with title, description, style_keywords, character_theme.

    Returns:
        Dict with 'status', 'image_url', and optionally 'error'.
    """
    bucket_name = os.environ.get("GCS_PREVIEW_BUCKET", "alcheme-previews")
    model_name = os.environ.get("SIMULATOR_MODEL", "gemini-2.5-flash-image")
    image_location = os.environ.get("SIMULATOR_LOCATION", "us-central1")

    try:
        # Fetch user hair preferences from profile
        hair_style, hair_color = None, None
        try:
            user_doc = _get_firestore().collection("users").document(user_id).get()
            if user_doc.exists:
                profile = user_doc.to_dict() or {}
                hair_style = profile.get("hairType")
                hair_color = profile.get("hairColor")
        except Exception as e:
            logger.warning("Failed to fetch user profile for hair: %s", e)

        prompt = build_theme_image_prompt(theme, hair_style=hair_style, hair_color=hair_color)
        logger.info(
            "Generating theme image for %s (theme=%s, model=%s)",
            theme_id, theme.get("character_theme", "cute"), model_name,
        )

        # Call Gemini image generation — retry with exponential backoff on 429
        use_vertexai = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "").upper() == "TRUE"
        if use_vertexai:
            project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
            client = genai.Client(vertexai=True, project=project, location=image_location)
        else:
            client = genai.Client()

        response = None
        for attempt in range(4):
            try:
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE", "TEXT"],
                    ),
                )
                break
            except Exception as retry_err:
                if "429" in str(retry_err) or "RESOURCE_EXHAUSTED" in str(retry_err):
                    wait = 2 ** attempt * 3  # 3s, 6s, 12s, 24s
                    logger.warning("Gemini 429 on attempt %d, retrying in %ds...", attempt + 1, wait)
                    await asyncio.sleep(wait)
                else:
                    raise
        if response is None:
            return {"status": "error", "error": "Gemini rate limit exceeded after retries"}

        # Extract image
        image_data: bytes | None = None
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    image_data = part.inline_data.data
                    break

        if not image_data:
            return {"status": "error", "error": "No image generated by model"}

        # Upload to GCS
        blob_path = f"{user_id}/themes/{theme_id}.webp"
        bucket = _get_storage().bucket(bucket_name)
        blob = bucket.blob(blob_path)
        blob.upload_from_string(image_data, content_type="image/webp")
        image_url = blob.public_url

        # Update Firestore recipe document (theme entry)
        _get_firestore().collection("users").document(user_id).collection(
            "recipes"
        ).document(theme_id).update(
            {
                "preview_image_url": image_url,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )

        logger.info("Theme image saved: %s", image_url)
        return {"status": "success", "image_url": image_url}

    except Exception as e:
        logger.error("Theme image generation failed for %s: %s", theme_id, e, exc_info=True)
        return {"status": "error", "error": str(e)}


async def update_theme_status(
    theme_id: str,
    user_id: str,
    status: str,
    recipe_id: str | None = None,
) -> dict[str, Any]:
    """Update the status of a theme suggestion in Firestore.

    Args:
        theme_id: Theme document ID.
        user_id: User ID.
        status: New status ('liked' or 'skipped').
        recipe_id: Optional recipe ID to link.

    Returns:
        Dict with 'status' key.
    """
    try:
        update_data: dict[str, Any] = {
            "theme_status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if recipe_id:
            update_data["recipe_id"] = recipe_id

        _get_firestore().collection("users").document(user_id).collection(
            "recipes"
        ).document(theme_id).update(update_data)

        logger.info("Theme %s status updated to %s", theme_id, status)
        return {"status": "success"}

    except Exception as e:
        logger.error("Theme status update failed for %s: %s", theme_id, e, exc_info=True)
        return {"status": "error", "error": str(e)}
