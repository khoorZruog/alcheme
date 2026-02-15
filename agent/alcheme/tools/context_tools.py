"""Context tools for the ADK agents.

Provides date, season, event, and inventory usage context to help agents
make timely, personalized recommendations.

Docstrings are used as tool descriptions by ADK.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore

_db: firestore.Client | None = None
JST = timezone(timedelta(hours=9))

# Japanese season mapping (month → season + keyword)
_SEASON_MAP: dict[int, tuple[str, list[str]]] = {
    1: ("冬", ["乾燥対策", "保湿重視", "マット仕上げ"]),
    2: ("冬", ["乾燥対策", "バレンタイン", "ピンクメイク"]),
    3: ("春", ["花粉対策", "崩れにくい", "春色メイク"]),
    4: ("春", ["新生活", "透明感", "ナチュラルメイク"]),
    5: ("春", ["紫外線対策", "軽やかメイク", "フレッシュカラー"]),
    6: ("夏", ["梅雨", "崩れにくい", "ウォータープルーフ"]),
    7: ("夏", ["紫外線対策", "ツヤ肌", "夏フェスメイク"]),
    8: ("夏", ["猛暑", "軽いベース", "夏映えカラー"]),
    9: ("秋", ["秋色メイク", "ブラウン系", "マットリップ"]),
    10: ("秋", ["ハロウィン", "深みカラー", "テラコッタ"]),
    11: ("秋", ["クリスマス準備", "ボルドー", "大人メイク"]),
    12: ("冬", ["クリスマス", "パーティーメイク", "華やかメイク"]),
}

# Day-of-week context hints
_DAY_HINTS: dict[int, str] = {
    0: "月曜日 — 週始め、きちんと感のあるメイクが人気",
    1: "火曜日",
    2: "水曜日 — 週の折り返し",
    3: "木曜日",
    4: "金曜日 — 週末前、少し華やかなメイクも◎",
    5: "土曜日 — おでかけ・デートメイクにぴったり",
    6: "日曜日 — リラックス・ナチュラルメイクが人気",
}


def _get_db() -> firestore.Client:
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


def _inventory_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("inventory")


def _recipes_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("recipes")


def get_today_context(tool_context: ToolContext) -> dict:
    """Get today's date, season, events, and inventory usage context.

    Returns contextual information including current date/season in Japan,
    seasonal beauty tips, underused inventory items, and recent recipe history.
    Use this to make personalized, timely makeup recommendations.
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")
        now = datetime.now(JST)

        # Date & season context
        month = now.month
        season, season_keywords = _SEASON_MAP.get(month, ("", []))
        day_hint = _DAY_HINTS.get(now.weekday(), "")

        # Inventory analysis: find underused items (no updatedAt in 30+ days)
        underused_items: list[str] = []
        category_counts: dict[str, int] = {}
        total_items = 0
        thirty_days_ago = now - timedelta(days=30)

        try:
            docs = _inventory_ref(user_id).stream()
            for doc in docs:
                item = doc.to_dict()
                total_items += 1
                cat = item.get("category", "Other")
                category_counts[cat] = category_counts.get(cat, 0) + 1

                # Check if item is underused
                updated = item.get("updatedAt") or item.get("updated_at")
                if updated and hasattr(updated, "timestamp"):
                    # Firestore timestamp
                    last_used = datetime.fromtimestamp(updated.timestamp(), tz=JST)
                    if last_used < thirty_days_ago:
                        brand = item.get("brand", "")
                        name = item.get("product_name", "")
                        underused_items.append(f"{brand} {name}")
        except Exception:
            pass  # Inventory read failure is non-critical

        # Recent recipes (last 3)
        recent_themes: list[str] = []
        try:
            recipe_docs = (
                _recipes_ref(user_id)
                .order_by("createdAt", direction=firestore.Query.DESCENDING)
                .limit(3)
                .stream()
            )
            for doc in recipe_docs:
                r = doc.to_dict()
                title = r.get("title") or r.get("recipe_name") or ""
                if title:
                    recent_themes.append(title)
        except Exception:
            pass  # Recipe read failure is non-critical

        return {
            "status": "success",
            "date": now.strftime("%Y年%m月%d日"),
            "day_of_week": day_hint,
            "season": season,
            "season_keywords": season_keywords,
            "inventory_summary": {
                "total_items": total_items,
                "categories": category_counts,
            },
            "underused_items": underused_items[:5],  # Limit to top 5
            "recent_recipes": recent_themes,
            "suggestion": (
                f"今は{season}。{', '.join(season_keywords[:2])}がおすすめの時期です。"
                + (f" 最近使っていないアイテムが{len(underused_items)}個あります。" if underused_items else "")
                + (f" 最近は「{'」「'.join(recent_themes)}」を作りました。違うテイストも提案してみましょう。" if recent_themes else "")
            ),
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
