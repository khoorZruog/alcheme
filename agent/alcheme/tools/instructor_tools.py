"""Instructor tools for the Makeup Instructor agent.

Provides substitution technique analysis by comparing original and substitute
cosmetic items and generating compensation instructions.

Docstrings are used as tool descriptions by ADK.
"""

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


def _inventory_ref(user_id: str) -> Any:
    return _get_db().collection("users").document(user_id).collection("inventory")


def _find_item_by_name(user_id: str, item_name: str) -> dict | None:
    """Find an inventory item by name (fuzzy match)."""
    try:
        docs = _inventory_ref(user_id).stream()
        item_lower = item_name.lower()
        for doc in docs:
            data = doc.to_dict()
            name = (data.get("product_name") or "").lower()
            brand = (data.get("brand") or "").lower()
            full = f"{brand} {name}"
            if item_lower in full or full in item_lower or name == item_lower:
                return {**data, "id": doc.id}
        return None
    except Exception as e:
        logger.warning("Failed to search inventory: %s", e)
        return None


# Texture type mapping for comparison
_TEXTURE_TYPES = {
    "マット": 0, "matte": 0, "セミマット": 1,
    "サテン": 2, "satin": 2,
    "ツヤ": 3, "グロウ": 3, "glow": 3, "グロッシー": 3, "glossy": 3,
    "ラメ": 4, "グリッター": 4, "glitter": 4, "シマー": 4, "shimmer": 4,
}


def _compare_textures(a: str | None, b: str | None) -> str:
    """Compare two texture types and suggest compensation."""
    if not a or not b:
        return ""
    a_val = _TEXTURE_TYPES.get(a.lower().strip(), -1)
    b_val = _TEXTURE_TYPES.get(b.lower().strip(), -1)
    if a_val == -1 or b_val == -1 or a_val == b_val:
        return ""
    if a_val < b_val:
        return "代用品の方がツヤ感が強いです。指でしっかりなじませるか、上からパウダーを薄くのせてマット寄りに調整してください"
    return "代用品の方がマット寄りです。仕上げにミスト（ツヤ系）を吹きかけるか、ハイライトを少量重ねてツヤ感をプラスしてください"


def get_substitution_technique(
    original_item: str,
    substitute_item: str,
    tool_context: ToolContext,
) -> dict:
    """Get detailed substitution technique for using a substitute cosmetic item.

    Compares the original item and substitute item properties (pigment,
    longevity, texture) and generates compensation instructions to achieve
    similar results with the substitute.

    Args:
        original_item: Name of the original item in the recipe.
        substitute_item: Name of the substitute item the user wants to use.

    Returns:
        dict with technique instructions, reasons, and step-by-step guidance.
    """
    try:
        user_id = tool_context.state.get("user:id", "test-user-001")

        # Find both items in inventory
        orig = _find_item_by_name(user_id, original_item)
        sub = _find_item_by_name(user_id, substitute_item)

        techniques: list[str] = []
        reasons: list[str] = []

        if orig and sub:
            # Compare pigment/発色力
            orig_pigment = orig.get("pigment") or orig.get("stats", {}).get("pigment", 50)
            sub_pigment = sub.get("pigment") or sub.get("stats", {}).get("pigment", 50)
            if isinstance(orig_pigment, (int, float)) and isinstance(sub_pigment, (int, float)):
                pigment_diff = orig_pigment - sub_pigment
                if pigment_diff > 15:
                    techniques.append("発色が弱めなので、2〜3回重ね塗りしてしっかり発色させてください")
                    reasons.append(f"発色力の差: オリジナル({orig_pigment}) > 代用品({sub_pigment})")
                elif pigment_diff < -15:
                    techniques.append("発色が強めなので、少量ずつ取り、薄くぼかすようにのせてください")
                    reasons.append(f"発色力の差: 代用品({sub_pigment}) > オリジナル({orig_pigment})")

            # Compare longevity/持続力
            orig_longevity = orig.get("longevity") or orig.get("stats", {}).get("longevity", 50)
            sub_longevity = sub.get("longevity") or sub.get("stats", {}).get("longevity", 50)
            if isinstance(orig_longevity, (int, float)) and isinstance(sub_longevity, (int, float)):
                longevity_diff = orig_longevity - sub_longevity
                if longevity_diff > 15:
                    techniques.append("持ちが短めなので、仕上げにセッティングパウダーやフィックスミストをプラスしてください")
                    reasons.append(f"持続力の差: オリジナル({orig_longevity}) > 代用品({sub_longevity})")

            # Compare texture
            orig_texture = orig.get("texture") or ""
            sub_texture = sub.get("texture") or ""
            texture_advice = _compare_textures(orig_texture, sub_texture)
            if texture_advice:
                techniques.append(texture_advice)
                reasons.append(f"質感の違い: {orig_texture} → {sub_texture}")

            # Category cross-use advice
            orig_cat = (orig.get("category") or "").lower()
            sub_cat = (sub.get("category") or "").lower()
            if orig_cat != sub_cat and orig_cat and sub_cat:
                cross_use_tips = {
                    ("lip", "cheek"): "リップをチークとして使う場合は、指先に少量取り、頬の高い位置にトントンとなじませてください",
                    ("cheek", "eyeshadow"): "チークをアイシャドウとして使う場合は、アイシャドウベースを先に塗ると発色・持ちがアップします",
                    ("eyeshadow", "eyebrow"): "アイシャドウの濃い色を眉に使う場合は、アングルブラシで少量ずつのせてください",
                    ("highlighter", "eyeshadow"): "ハイライターを目元に使う場合は、涙袋や目頭に少量のせるとナチュラルに輝きます",
                }
                for (a, b), tip in cross_use_tips.items():
                    if a in orig_cat and b in sub_cat or a in sub_cat and b in orig_cat:
                        techniques.append(tip)
                        break

        # Fallback if no specific comparison data
        if not techniques:
            techniques = [
                "まず少量を手の甲で試して、発色と質感を確認してください",
                "薄くのせてから足していく「ビルドアップ」方式がおすすめです",
                "色味が違う場合は、上から別のアイテムを重ねて調整できます",
            ]
            reasons = ["アイテムの詳細スペックが不明のため、一般的な代用テクニックを提案"]

        return {
            "status": "success",
            "original": original_item,
            "substitute": substitute_item,
            "techniques": techniques,
            "reasons": reasons,
            "general_tips": [
                "代用品は少量ずつ重ねるのがコツ",
                "仕上がりが気になったら、パウダーで微調整",
                "色味の差はグラデーションで自然になじませて",
            ],
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
