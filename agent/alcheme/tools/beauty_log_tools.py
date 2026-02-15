"""Beauty Log tools for the Memory Keeper agent.

Docstrings are used as tool descriptions by ADK.
All tools that need user context receive it from tool_context.state["user:id"].
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

_db: firestore.Client | None = None
JST = timezone(timedelta(hours=9))


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _beauty_logs_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("beauty_logs")


def _recipes_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("recipes")


def save_beauty_log(
    date: str,
    self_rating: int,
    recipe_id: str = "",
    mood: str = "",
    occasion: str = "",
    weather: str = "",
    user_note: str = "",
    modifications: str = "[]",
    tool_context: ToolContext = None,
) -> dict:
    """Save or update a daily beauty log entry.

    Records the user's makeup for a specific date including satisfaction rating,
    mood, occasion, and any notes. One log per day (updates if already exists).

    Args:
        date: Date string "YYYY-MM-DD" or "today" for current date.
        self_rating: Satisfaction score from 1 to 5.
        recipe_id: Optional recipe ID that was used. Leave empty if no specific recipe.
        mood: Optional mood description (e.g., "元気", "落ち着き", "ウキウキ").
        occasion: Optional occasion/TPO (e.g., "仕事", "デート", "休日").
        weather: Optional weather (e.g., "晴れ", "曇り", "雨").
        user_note: Optional free-text memo about today's makeup.
        modifications: JSON array of modification strings from recipe (e.g., '["リップを変更"]').
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")

        # Resolve "today"
        if date == "today" or not date:
            date = datetime.now(JST).strftime("%Y-%m-%d")

        # Clamp self_rating
        self_rating = max(1, min(5, int(self_rating)))

        # Parse modifications
        try:
            mods = json.loads(modifications) if modifications else []
        except (json.JSONDecodeError, TypeError):
            mods = [modifications] if modifications else []

        # Look up recipe name if recipe_id provided
        recipe_name = ""
        if recipe_id:
            try:
                recipe_doc = _recipes_ref(user_id).document(recipe_id).get()
                if recipe_doc.exists:
                    recipe_data = recipe_doc.to_dict()
                    recipe_name = recipe_data.get("recipe_name") or recipe_data.get("title", "")
            except Exception:
                pass  # Non-critical

        log_data = {
            "date": date,
            "self_rating": self_rating,
            "mood": mood,
            "occasion": occasion,
            "weather": weather,
            "user_note": user_note,
            "modifications": mods,
            "auto_tags": [],
            "used_items": [],
            "updated_at": firestore.SERVER_TIMESTAMP,
        }

        if recipe_id:
            log_data["recipe_id"] = recipe_id
        if recipe_name:
            log_data["recipe_name"] = recipe_name

        # Use date as doc ID → upsert (one log per day)
        doc_ref = _beauty_logs_ref(user_id).document(date)
        existing = doc_ref.get()

        if existing.exists:
            doc_ref.update(log_data)
        else:
            log_data["created_at"] = firestore.SERVER_TIMESTAMP
            doc_ref.set(log_data)

        # Build summary
        parts = [f"📅 {date}"]
        if recipe_name:
            parts.append(f"💄 {recipe_name}")
        parts.append(f"⭐ {self_rating}/5")
        if mood:
            parts.append(f"😊 {mood}")
        if occasion:
            parts.append(f"🏷️ {occasion}")

        return {
            "status": "success",
            "log_id": date,
            "summary": " | ".join(parts),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def get_beauty_logs(
    limit: int = 7,
    tool_context: ToolContext = None,
) -> dict:
    """Get the user's recent beauty log entries.

    Returns the most recent beauty logs ordered by date.

    Args:
        limit: Maximum number of logs to return (default 7).
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")
        docs = (
            _beauty_logs_ref(user_id)
            .order_by("date", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )

        logs = []
        for doc in docs:
            data = doc.to_dict()
            logs.append({
                "date": data.get("date", doc.id),
                "recipe_name": data.get("recipe_name", ""),
                "self_rating": data.get("self_rating"),
                "mood": data.get("mood", ""),
                "occasion": data.get("occasion", ""),
                "weather": data.get("weather", ""),
                "user_note": data.get("user_note", ""),
            })

        return {
            "status": "success",
            "logs": logs,
            "count": len(logs),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
