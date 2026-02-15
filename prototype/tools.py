"""
Cosme Mixologist - Tool Functions (Firestore版)
エージェントが使用するツール関数 — Firestore でデータ永続化
"""

import uuid
from datetime import datetime, timezone

from firestore_client import db


def generate_item_id() -> str:
    """Generate a unique item ID for cosmetic items."""
    return f"item_{uuid.uuid4().hex[:8]}"


# ============================================================================
# Firestore Collection Helpers
# ============================================================================

def _inventory_collection(user_id: str):
    """users/{userId}/inventory コレクション参照を返す"""
    return db.collection("users").document(user_id).collection("inventory")


def _recipe_collection(user_id: str):
    """users/{userId}/recipes コレクション参照を返す"""
    return db.collection("users").document(user_id).collection("recipes")


# ============================================================================
# Inventory CRUD (Firestore)
# ============================================================================

def load_inventory(user_id: str) -> dict:
    """
    Firestore からユーザーの在庫一覧を読み込む。

    Args:
        user_id: Firebase Auth UID

    Returns:
        dict: Status and inventory data or error message
    """
    try:
        docs = _inventory_collection(user_id).stream()
        inventory = []
        for doc in docs:
            item = doc.to_dict()
            item["id"] = doc.id
            # Firestore Timestamp → ISO string
            for ts_field in ("created_at", "updated_at"):
                if ts_field in item and hasattr(item[ts_field], "isoformat"):
                    item[ts_field] = item[ts_field].isoformat()
                elif ts_field in item and hasattr(item[ts_field], "toDate"):
                    item[ts_field] = item[ts_field].toDate().isoformat()
            inventory.append(item)

        return {
            "status": "success",
            "inventory": inventory,
            "message": f"{len(inventory)}件のアイテムを読み込みました",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Firestore 読み込みエラー: {str(e)}",
        }


def save_inventory_item(user_id: str, item: dict) -> dict:
    """
    Firestore に在庫アイテムを1件保存する。

    Args:
        user_id: Firebase Auth UID
        item: コスメアイテム dict

    Returns:
        dict: Status and result
    """
    try:
        now = datetime.now(timezone.utc).isoformat()
        item_id = item.get("id") or generate_item_id()

        doc_data = {**item}
        doc_data.pop("id", None)  # id はドキュメントIDとして使う
        doc_data.setdefault("created_at", now)
        doc_data["updated_at"] = now

        _inventory_collection(user_id).document(item_id).set(doc_data)

        return {
            "status": "success",
            "message": f"アイテム '{item.get('product_name', item_id)}' を保存しました",
            "item_id": item_id,
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"Firestore 保存エラー: {str(e)}",
        }


def add_items_to_inventory(user_id: str, new_items: list) -> dict:
    """
    複数のコスメアイテムを Firestore に一括追加する。

    Args:
        user_id: Firebase Auth UID
        new_items: 追加するアイテムのリスト

    Returns:
        dict: Updated inventory and status
    """
    try:
        added_ids = []
        for item in new_items:
            if "id" not in item or not item["id"]:
                item["id"] = generate_item_id()
            result = save_inventory_item(user_id, item)
            if result["status"] != "success":
                return result
            added_ids.append(result["item_id"])

        # 追加後の在庫を再取得
        inventory_result = load_inventory(user_id)
        total = len(inventory_result.get("inventory", []))

        return {
            "status": "success",
            "added_count": len(new_items),
            "added_ids": added_ids,
            "total_count": total,
            "message": f"{len(new_items)}件の新しいアイテムを追加しました！",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"アイテム追加エラー: {str(e)}",
        }


def delete_inventory_item(user_id: str, item_id: str) -> dict:
    """
    Firestore から在庫アイテムを1件削除する。

    Args:
        user_id: Firebase Auth UID
        item_id: 削除するアイテムID

    Returns:
        dict: Status
    """
    try:
        _inventory_collection(user_id).document(item_id).delete()
        return {
            "status": "success",
            "message": f"アイテム '{item_id}' を削除しました",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"削除エラー: {str(e)}",
        }


# ============================================================================
# Inventory Query Helpers (in-memory — Firestore から取得済みリストを操作)
# ============================================================================

def get_inventory_summary(inventory: list) -> dict:
    """
    Get a summary of the inventory by category.

    Args:
        inventory: List of cosmetic items

    Returns:
        dict: Summary statistics
    """
    try:
        categories = {}
        brands = set()

        for item in inventory:
            category = item.get("category", "Other")
            categories[category] = categories.get(category, 0) + 1
            if item.get("brand") and item["brand"] != "Unknown":
                brands.add(item["brand"])

        return {
            "status": "success",
            "total_items": len(inventory),
            "by_category": categories,
            "unique_brands": list(brands),
            "brand_count": len(brands),
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"サマリー生成エラー: {str(e)}",
        }


def search_inventory(inventory: list, query: str) -> dict:
    """
    Search inventory items by keyword.

    Args:
        inventory: List of cosmetic items
        query: Search keyword (matches brand, product_name, color_description)

    Returns:
        dict: Matching items
    """
    try:
        query_lower = query.lower()
        matches = []

        for item in inventory:
            searchable = " ".join([
                item.get("brand", ""),
                item.get("product_name", ""),
                item.get("color_description", ""),
                item.get("category", ""),
            ]).lower()

            if query_lower in searchable:
                matches.append(item)

        return {
            "status": "success",
            "matches": matches,
            "count": len(matches),
            "message": f"'{query}' に一致するアイテム: {len(matches)}件",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"検索エラー: {str(e)}",
        }


def filter_inventory_by_category(inventory: list, category: str) -> dict:
    """
    Filter inventory items by category.

    Args:
        inventory: List of cosmetic items
        category: Category to filter by (Lip, Cheek, Eye, Base, Other)

    Returns:
        dict: Filtered items
    """
    try:
        valid_categories = ["Lip", "Cheek", "Eye", "Base", "Other"]

        if category not in valid_categories:
            return {
                "status": "error",
                "error_message": f"無効なカテゴリです。有効なカテゴリ: {', '.join(valid_categories)}",
            }

        filtered = [item for item in inventory if item.get("category") == category]

        return {
            "status": "success",
            "items": filtered,
            "count": len(filtered),
            "category": category,
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"フィルターエラー: {str(e)}",
        }


def validate_recipe_items(recipe_steps: list, inventory: list) -> dict:
    """
    Validate that all items in a recipe exist in the inventory.

    Args:
        recipe_steps: List of recipe steps with item_id references
        inventory: Available inventory items

    Returns:
        dict: Validation result
    """
    try:
        inventory_ids = {item["id"] for item in inventory}
        missing_items = []
        valid_items = []

        for step in recipe_steps:
            item_id = step.get("item_id")
            if item_id:
                if item_id in inventory_ids:
                    valid_items.append(item_id)
                else:
                    missing_items.append(item_id)

        if missing_items:
            return {
                "status": "error",
                "valid": False,
                "missing_items": missing_items,
                "message": f"在庫にないアイテムが参照されています: {', '.join(missing_items)}",
            }

        return {
            "status": "success",
            "valid": True,
            "validated_items": valid_items,
            "message": "すべてのアイテムが在庫に存在します",
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": f"バリデーションエラー: {str(e)}",
        }


def format_inventory_for_prompt(inventory: list) -> str:
    """
    Format inventory list as a readable string for prompts.

    Args:
        inventory: List of cosmetic items

    Returns:
        str: Formatted inventory string
    """
    if not inventory:
        return "（在庫なし）"

    lines = []
    for item in inventory:
        line = (
            f"- [{item.get('id')}] {item.get('category')}: "
            f"{item.get('brand', 'Unknown')} {item.get('product_name', '不明')} "
            f"({item.get('color_description', '色不明')}, {item.get('texture', '質感不明')}) "
            f"残量: {item.get('estimated_remaining', '不明')}"
        )
        lines.append(line)

    return "\n".join(lines)
