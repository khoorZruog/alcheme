"""Hallucination detection tests — AGT-09 (QG-1: MOST CRITICAL).

Verifies that ALL item_ids referenced in generated recipes exist in the
user's actual inventory. A hallucinated item_id means the agent fabricated
a product the user doesn't own.

This module tests the validate_recipe_items tool directly and also validates
recipe output structure to catch hallucination scenarios.
"""

import json
from unittest.mock import MagicMock, patch

import pytest

from alcheme.tools.inventory_tools import validate_recipe_items
from alcheme.schemas.recipe import Recipe, RecipeStep, RecipeOutput, RecipeValidation


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
FULL_INVENTORY = {
    "item_001": {"category": "Lip", "brand": "KATE", "product_name": "リップモンスター"},
    "item_002": {"category": "Eye", "brand": "EXCEL", "product_name": "スキニーリッチシャドウ"},
    "item_003": {"category": "Cheek", "brand": "CANMAKE", "product_name": "グロウフルールチークス"},
    "item_004": {"category": "Base", "brand": "PAUL & JOE", "product_name": "プライマー"},
    "item_005": {"category": "Lip", "brand": "rom&nd", "product_name": "ジューシーラスティングティント"},
    "item_006": {"category": "Eye", "brand": "CANMAKE", "product_name": "パーフェクトスタイリストアイズ"},
    "item_007": {"category": "Base", "brand": "CEZANNE", "product_name": "UVファンデーション"},
}

INVENTORY_IDS = set(FULL_INVENTORY.keys())


def assert_no_hallucination(recipe_steps: list[dict], inventory_ids: set[str]):
    """Assert that every item_id in recipe steps exists in inventory.

    This is the core hallucination check. Any failure here means QG-1 FAILS.
    """
    for step in recipe_steps:
        item_id = step.get("item_id")
        assert item_id in inventory_ids, (
            f"HALLUCINATION DETECTED: step {step.get('step')} references "
            f"item_id='{item_id}' which does NOT exist in inventory. "
            f"Valid IDs: {inventory_ids}"
        )


# ---------------------------------------------------------------------------
# Test: Recipe with all valid item_ids
# ---------------------------------------------------------------------------
class TestNoHallucination:
    def test_valid_recipe_all_items_in_inventory(self):
        """Recipe uses only items that exist in inventory — no hallucination."""
        recipe_steps = [
            {"step": 1, "area": "Base", "item_id": "item_004", "item_name": "プライマー", "instruction": "下地"},
            {"step": 2, "area": "Eye", "item_id": "item_002", "item_name": "シャドウ", "instruction": "アイメイク"},
            {"step": 3, "area": "Cheek", "item_id": "item_003", "item_name": "チーク", "instruction": "チーク"},
            {"step": 4, "area": "Lip", "item_id": "item_001", "item_name": "リップ", "instruction": "リップ"},
        ]
        # Should NOT raise
        assert_no_hallucination(recipe_steps, INVENTORY_IDS)

    def test_valid_recipe_subset_of_inventory(self):
        """Recipe can use a subset of inventory items."""
        recipe_steps = [
            {"step": 1, "area": "Lip", "item_id": "item_005", "item_name": "ティント", "instruction": "唇に塗る"},
        ]
        assert_no_hallucination(recipe_steps, INVENTORY_IDS)


# ---------------------------------------------------------------------------
# Test: Recipe with hallucinated item_ids
# ---------------------------------------------------------------------------
class TestHallucinationDetection:
    def test_detects_fabricated_item_id(self):
        """Detects when agent invents an item_id not in inventory."""
        recipe_steps = [
            {"step": 1, "area": "Base", "item_id": "item_004", "item_name": "プライマー", "instruction": "下地"},
            {"step": 2, "area": "Eye", "item_id": "item_FAKE", "item_name": "架空のシャドウ", "instruction": "偽"},
        ]
        with pytest.raises(AssertionError, match="HALLUCINATION DETECTED"):
            assert_no_hallucination(recipe_steps, INVENTORY_IDS)

    def test_detects_similar_but_wrong_id(self):
        """Detects when agent uses an ID close to but not matching real IDs."""
        recipe_steps = [
            {"step": 1, "area": "Lip", "item_id": "item_01", "item_name": "リップ", "instruction": "塗る"},
        ]
        with pytest.raises(AssertionError, match="HALLUCINATION DETECTED"):
            assert_no_hallucination(recipe_steps, INVENTORY_IDS)

    def test_detects_empty_item_id(self):
        """Detects when agent leaves item_id empty."""
        recipe_steps = [
            {"step": 1, "area": "Lip", "item_id": "", "item_name": "リップ", "instruction": "塗る"},
        ]
        with pytest.raises(AssertionError, match="HALLUCINATION DETECTED"):
            assert_no_hallucination(recipe_steps, INVENTORY_IDS)


# ---------------------------------------------------------------------------
# Test: validate_recipe_items tool (integration with Firestore mock)
# ---------------------------------------------------------------------------
class TestValidateRecipeItemsTool:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_all_items_valid(self, mock_db, mock_tool_context):
        """validate_recipe_items confirms all IDs exist."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        def mock_document(item_id):
            doc_ref = MagicMock()
            mock_doc = MagicMock()
            mock_doc.exists = item_id in INVENTORY_IDS
            doc_ref.get.return_value = mock_doc
            return doc_ref

        mock_ref.document.side_effect = mock_document

        ids = ["item_001", "item_002", "item_004"]
        result = validate_recipe_items(json.dumps(ids), mock_tool_context)
        assert result["status"] == "success"
        assert result["all_valid"] is True
        assert result["missing_items"] == []

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_hallucinated_items_detected(self, mock_db, mock_tool_context):
        """validate_recipe_items catches non-existent IDs."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        def mock_document(item_id):
            doc_ref = MagicMock()
            mock_doc = MagicMock()
            mock_doc.exists = item_id in INVENTORY_IDS
            doc_ref.get.return_value = mock_doc
            return doc_ref

        mock_ref.document.side_effect = mock_document

        ids = ["item_001", "item_HALLUCINATED", "item_999"]
        result = validate_recipe_items(json.dumps(ids), mock_tool_context)
        assert result["status"] == "success"
        assert result["all_valid"] is False
        assert "item_HALLUCINATED" in result["missing_items"]
        assert "item_999" in result["missing_items"]


# ---------------------------------------------------------------------------
# Test: RecipeOutput schema validation
# ---------------------------------------------------------------------------
class TestRecipeOutputValidation:
    def test_recipe_output_with_valid_validation(self):
        """RecipeOutput.validation.all_items_in_inventory must be True for QG-1."""
        recipe = Recipe(
            title="テスト",
            match_score=80,
            thinking_process=["在庫確認"],
            steps=[
                RecipeStep(
                    step=1, area="Lip", item_id="item_001",
                    item_name="リップ", instruction="塗る"
                ),
            ],
        )
        validation = RecipeValidation(
            all_items_in_inventory=True, missing_items=[]
        )
        output = RecipeOutput(
            recipe=recipe, used_items=["item_001"], validation=validation
        )
        assert output.validation.all_items_in_inventory is True
        assert output.validation.missing_items == []

    def test_recipe_output_flags_missing_items(self):
        """RecipeOutput.validation properly flags missing items."""
        recipe = Recipe(
            title="テスト",
            match_score=80,
            thinking_process=["在庫確認"],
            steps=[
                RecipeStep(
                    step=1, area="Lip", item_id="item_FAKE",
                    item_name="架空", instruction="架空"
                ),
            ],
        )
        validation = RecipeValidation(
            all_items_in_inventory=False, missing_items=["item_FAKE"]
        )
        output = RecipeOutput(
            recipe=recipe, used_items=["item_FAKE"], validation=validation
        )
        assert output.validation.all_items_in_inventory is False
        assert "item_FAKE" in output.validation.missing_items
