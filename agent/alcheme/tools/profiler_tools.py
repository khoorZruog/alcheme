"""Profiler tools for the Profiler agent.

Analyzes user's Beauty Log and recipe history to detect preference patterns,
monotony (マンネリ), and underutilized inventory items.

Docstrings are used as tool descriptions by ADK.
"""

import logging
from collections import Counter
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

logger = logging.getLogger(__name__)

_db: firestore.Client | None = None

# Color-related keywords for preference analysis
_COLOR_KEYWORDS: dict[str, list[str]] = {
    "ピンク系": ["ピンク", "pink", "ローズ", "rose", "コーラル", "coral", "桜", "モーヴ"],
    "ブラウン系": ["ブラウン", "brown", "ベージュ", "beige", "テラコッタ", "キャメル"],
    "オレンジ系": ["オレンジ", "orange", "アプリコット", "apricot", "みかん"],
    "レッド系": ["レッド", "red", "赤", "ボルドー", "バーガンディ", "ワイン"],
    "パープル系": ["パープル", "purple", "ラベンダー", "lavender", "プラム"],
    "ヌード系": ["ヌード", "nude", "ナチュラル", "肌色", "透明感"],
}

# Texture keywords
_TEXTURE_KEYWORDS: dict[str, list[str]] = {
    "マット": ["マット", "matte", "セミマット"],
    "ツヤ": ["ツヤ", "グロウ", "glow", "ウェット", "デューイ"],
    "ラメ/グリッター": ["ラメ", "グリッター", "glitter", "キラキラ", "パール"],
    "シアー": ["シアー", "sheer", "透け感", "薄づき"],
}


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _beauty_logs_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("beauty_logs")


def _recipes_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("recipes")


def _inventory_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("inventory")


def _count_keywords(text: str, keyword_map: dict[str, list[str]]) -> dict[str, int]:
    """Count occurrences of keyword categories in text."""
    counts: dict[str, int] = {}
    text_lower = text.lower()
    for category, keywords in keyword_map.items():
        count = sum(1 for kw in keywords if kw.lower() in text_lower)
        if count > 0:
            counts[category] = count
    return counts


def analyze_preference_history(tool_context: ToolContext) -> dict:
    """Analyze user's makeup preferences from Beauty Log and recipe history.

    Examines recent Beauty Logs and recipes to identify:
    - Color preferences (which color families are used most)
    - Texture preferences (matte vs glossy vs shimmer)
    - Category usage patterns (which product types used most/least)
    - Monotony detection (if recent looks are too similar)
    - Underutilized inventory items (items not appearing in recent recipes)

    Returns a comprehensive preference analysis with suggestions.
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")

        # ---- Gather beauty logs (last 30) ----
        log_texts: list[str] = []
        log_moods: list[str] = []
        log_occasions: list[str] = []
        log_ratings: list[int] = []
        log_recipe_ids: set[str] = set()

        try:
            log_docs = (
                _beauty_logs_ref(user_id)
                .order_by("date", direction=firestore.Query.DESCENDING)
                .limit(30)
                .stream()
            )
            for doc in log_docs:
                data = doc.to_dict()
                if data.get("recipe_name"):
                    log_texts.append(data["recipe_name"])
                if data.get("user_note"):
                    log_texts.append(data["user_note"])
                if data.get("mood"):
                    log_moods.append(data["mood"])
                if data.get("occasion"):
                    log_occasions.append(data["occasion"])
                if data.get("self_rating"):
                    log_ratings.append(int(data["self_rating"]))
                if data.get("recipe_id"):
                    log_recipe_ids.add(data["recipe_id"])
        except Exception as e:
            logger.warning("Failed to read beauty logs: %s", e)

        # ---- Gather recent recipes (last 20) ----
        recipe_texts: list[str] = []
        recipe_item_ids: set[str] = set()
        recipe_categories: list[str] = []

        try:
            recipe_docs = (
                _recipes_ref(user_id)
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(20)
                .stream()
            )
            for doc in recipe_docs:
                data = doc.to_dict()
                name = data.get("recipe_name") or data.get("title") or ""
                if name:
                    recipe_texts.append(name)
                if data.get("user_request"):
                    recipe_texts.append(data["user_request"])
                for step in data.get("steps", []):
                    if step.get("item_name"):
                        recipe_texts.append(step["item_name"])
                    if step.get("instruction"):
                        recipe_texts.append(step["instruction"])
                    if step.get("item_id"):
                        recipe_item_ids.add(step["item_id"])
                    if step.get("area"):
                        recipe_categories.append(step["area"])
        except Exception as e:
            logger.warning("Failed to read recipes: %s", e)

        # ---- Analyze preferences ----
        all_text = " ".join(log_texts + recipe_texts)

        color_prefs = _count_keywords(all_text, _COLOR_KEYWORDS)
        texture_prefs = _count_keywords(all_text, _TEXTURE_KEYWORDS)
        area_counts = Counter(recipe_categories)

        # ---- Monotony detection ----
        monotony_alert = None
        if color_prefs:
            total_color = sum(color_prefs.values())
            top_color, top_count = max(color_prefs.items(), key=lambda x: x[1])
            if total_color > 0 and (top_count / total_color) >= 0.7:
                # Find underused colors
                all_colors = set(_COLOR_KEYWORDS.keys())
                used_colors = set(color_prefs.keys())
                unused = all_colors - used_colors
                suggestion = list(unused)[:2] if unused else ["違うトーン"]
                monotony_alert = {
                    "dominant": top_color,
                    "ratio": round(top_count / total_color * 100),
                    "message": f"最近は{top_color}が多めですね。{', '.join(suggestion)}も試してみませんか？",
                }

        # ---- Underutilized inventory ----
        underused_items: list[str] = []
        try:
            inv_docs = _inventory_ref(user_id).stream()
            for doc in inv_docs:
                item = doc.to_dict()
                item_id = doc.id
                if item_id not in recipe_item_ids:
                    brand = item.get("brand", "")
                    name = item.get("product_name", "")
                    if brand or name:
                        underused_items.append(f"{brand} {name}".strip())
        except Exception as e:
            logger.warning("Failed to read inventory for underused items: %s", e)

        # ---- Build result ----
        mood_counts = Counter(log_moods)
        occasion_counts = Counter(log_occasions)
        avg_rating = round(sum(log_ratings) / len(log_ratings), 1) if log_ratings else None

        return {
            "status": "success",
            "color_preferences": color_prefs,
            "texture_preferences": texture_prefs,
            "area_frequency": dict(area_counts.most_common(10)),
            "mood_patterns": dict(mood_counts.most_common(5)),
            "occasion_patterns": dict(occasion_counts.most_common(5)),
            "average_satisfaction": avg_rating,
            "total_logs_analyzed": len(log_texts),
            "total_recipes_analyzed": len(recipe_texts),
            "monotony_alert": monotony_alert,
            "underused_items": underused_items[:8],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
