"""
Cosme Mixologist - Agent Definitions (Firestore版)
Google ADK を使用したエージェント定義
"""

import json

from google.adk.agents import Agent

from prompts import (
    INVENTORY_SYSTEM_PROMPT,
    ALCHEMIST_SYSTEM_PROMPT,
    ROOT_AGENT_PROMPT,
)
from tools import (
    load_inventory,
    add_items_to_inventory,
    save_inventory_item,
    get_inventory_summary,
    search_inventory,
    filter_inventory_by_category,
    validate_recipe_items,
    format_inventory_for_prompt,
)


# ============================================================================
# Tool Functions for Agents
# ============================================================================

def analyze_cosmetic_image(image_description: str) -> dict:
    """
    Analyze a cosmetic image and return structured data.
    This is a placeholder - actual image analysis happens via Gemini's multimodal capabilities.

    Args:
        image_description: Description of what was detected in the image

    Returns:
        dict: Parsed cosmetic items from the image
    """
    return {
        "status": "success",
        "message": "画像分析が完了しました。",
        "note": "実際の画像分析はGeminiのマルチモーダル機能で実行されます。",
    }


def get_current_inventory(user_id: str) -> dict:
    """
    Get the current user's cosmetic inventory from Firestore.

    Args:
        user_id: Firebase Auth UID

    Returns:
        dict: Current inventory data
    """
    result = load_inventory(user_id)
    if result["status"] == "success":
        inventory = result["inventory"]
        summary = get_inventory_summary(inventory)
        return {
            "status": "success",
            "inventory": inventory,
            "summary": summary,
            "formatted": format_inventory_for_prompt(inventory),
        }
    return result


def save_analyzed_items(user_id: str, items_json: str) -> dict:
    """
    Save newly analyzed cosmetic items to Firestore.

    Args:
        user_id: Firebase Auth UID
        items_json: JSON string of analyzed cosmetic items

    Returns:
        dict: Result of save operation
    """
    try:
        new_items = json.loads(items_json)
        if not isinstance(new_items, list):
            new_items = [new_items]

        result = add_items_to_inventory(user_id, new_items)
        if result["status"] != "success":
            return result

        return {
            "status": "success",
            "message": f"{len(new_items)}件のコスメを登録しました！",
            "added_count": result["added_count"],
            "total_count": result["total_count"],
        }
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "error_message": f"JSONパースエラー: {str(e)}",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"保存エラー: {str(e)}",
        }


def create_makeup_recipe(user_id: str, user_request: str, context: str = "") -> dict:
    """
    Create a makeup recipe based on user request and available inventory.

    Args:
        user_id: Firebase Auth UID
        user_request: What kind of makeup the user wants
        context: Additional context (weather, occasion, etc.)

    Returns:
        dict: Inventory data for recipe generation
    """
    inventory_result = get_current_inventory(user_id)

    if inventory_result["status"] != "success":
        return inventory_result

    inventory = inventory_result["inventory"]

    if not inventory:
        return {
            "status": "error",
            "error_message": "在庫が登録されていません。まず画像をアップロードしてコスメを登録してください。",
        }

    return {
        "status": "ready",
        "user_request": user_request,
        "context": context,
        "inventory": inventory,
        "inventory_formatted": format_inventory_for_prompt(inventory),
        "message": "在庫データを取得しました。レシピを生成します。",
    }


def search_my_cosmetics(user_id: str, query: str) -> dict:
    """
    Search through the user's cosmetic inventory.

    Args:
        user_id: Firebase Auth UID
        query: Search keyword

    Returns:
        dict: Matching items
    """
    inventory_result = get_current_inventory(user_id)
    if inventory_result["status"] != "success":
        return inventory_result

    return search_inventory(inventory_result["inventory"], query)


def filter_by_category(user_id: str, category: str) -> dict:
    """
    Filter inventory by cosmetic category.

    Args:
        user_id: Firebase Auth UID
        category: Category name (Lip, Cheek, Eye, Base, Other)

    Returns:
        dict: Filtered items
    """
    inventory_result = get_current_inventory(user_id)
    if inventory_result["status"] != "success":
        return inventory_result

    return filter_inventory_by_category(inventory_result["inventory"], category)


def get_inventory_stats(user_id: str) -> dict:
    """
    Get statistics about the user's cosmetic inventory.

    Args:
        user_id: Firebase Auth UID

    Returns:
        dict: Inventory statistics
    """
    inventory_result = get_current_inventory(user_id)
    if inventory_result["status"] != "success":
        return inventory_result

    summary = get_inventory_summary(inventory_result["inventory"])

    if summary["status"] == "success":
        cat_summary = ", ".join([f"{k}: {v}点" for k, v in summary["by_category"].items()])
        message = (
            f"あなたのコスメポーチ\n"
            f"合計: {summary['total_items']}点\n"
            f"カテゴリ別: {cat_summary}\n"
            f"ブランド数: {summary['brand_count']}種類"
        )
        summary["formatted_message"] = message

    return summary


# ============================================================================
# Agent Definitions
# ============================================================================

# Inventory Agent - 在庫判定官（画像解析は gemini-2.5-pro で精度優先）
inventory_agent = Agent(
    name="inventory_agent",
    model="gemini-2.5-pro",
    description="コスメ画像を解析し、構造化データに変換するエージェント",
    instruction=INVENTORY_SYSTEM_PROMPT,
    tools=[
        analyze_cosmetic_image,
        save_analyzed_items,
        get_current_inventory,
    ],
)

# Alchemist Agent - 調合師（gemini-2.5-flash で速度優先）
alchemist_agent = Agent(
    name="alchemist_agent",
    model="gemini-2.5-flash",
    description="在庫データとユーザーの要望からメイクレシピを生成するエージェント",
    instruction=ALCHEMIST_SYSTEM_PROMPT,
    tools=[
        create_makeup_recipe,
        get_current_inventory,
        search_my_cosmetics,
        filter_by_category,
    ],
)

# Root Agent - オーケストレーター（gemini-2.5-flash）
root_agent = Agent(
    name="cosme_mixologist",
    model="gemini-2.5-flash",
    description="Cosme Mixologist - あなた専属のAI美容部員",
    instruction=ROOT_AGENT_PROMPT,
    tools=[
        get_current_inventory,
        get_inventory_stats,
        search_my_cosmetics,
        filter_by_category,
        save_analyzed_items,
        create_makeup_recipe,
    ],
    sub_agents=[inventory_agent, alchemist_agent],
)
