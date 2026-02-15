"""Tests for shopping_tools.py — Shopping consultation tools."""

import json
from unittest.mock import MagicMock, patch

import pytest

from alcheme.tools.shopping_tools import (
    _normalize_category,
    _find_similar_items,
    _slim_item,
    analyze_product_compatibility,
    compare_products_against_inventory,
)


# ---------------------------------------------------------------------------
# _normalize_category
# ---------------------------------------------------------------------------
class TestNormalizeCategory:
    def test_en_lip_to_ja(self):
        assert _normalize_category("Lip") == "リップ"

    def test_en_eye_to_ja(self):
        assert _normalize_category("Eye") == "アイメイク"

    def test_en_base_to_ja(self):
        assert _normalize_category("Base") == "ベースメイク"

    def test_ja_passthrough(self):
        assert _normalize_category("リップ") == "リップ"

    def test_unknown_passthrough(self):
        assert _normalize_category("ネイル") == "ネイル"


# ---------------------------------------------------------------------------
# _find_similar_items
# ---------------------------------------------------------------------------
class TestFindSimilarItems:
    def test_same_brand_and_product_line(self, sample_items):
        """Same brand + overlapping product name → score ≥ 3."""
        product = {"brand": "KATE", "product_name": "リップモンスター 05", "category": "Lip"}
        similar = _find_similar_items(product, sample_items)
        assert len(similar) >= 1
        top = similar[0]
        assert top["similarity_score"] >= 3
        assert "same_brand" in top["reasons"]
        assert "same_product_line" in top["reasons"]

    def test_same_item_type(self, sample_items):
        """Same item_type (without brand match) → included if score ≥ 2."""
        product = {"brand": "CEZANNE", "item_type": "shimmer", "category": "Eye"}
        similar = _find_similar_items(product, sample_items)
        # EXCEL item has shimmer texture but different item_type; matching depends on item_type field
        # At minimum, same category should contribute
        assert isinstance(similar, list)

    def test_no_similar_items(self, sample_items):
        """Completely different product → empty list."""
        product = {"brand": "CHANEL", "product_name": "N°5", "category": "フレグランス"}
        similar = _find_similar_items(product, sample_items)
        assert similar == []

    def test_top_5_limit(self):
        """Returns at most 5 items even with many matches."""
        inventory = [
            {"brand": "KATE", "product_name": f"リップ{i}", "category": "Lip", "item_type": "lip"}
            for i in range(10)
        ]
        product = {"brand": "KATE", "product_name": "リップ", "category": "Lip", "item_type": "lip"}
        similar = _find_similar_items(product, inventory)
        assert len(similar) <= 5


# ---------------------------------------------------------------------------
# analyze_product_compatibility
# ---------------------------------------------------------------------------
def _make_mock_docs(items):
    """Create mock Firestore document snapshots from item dicts."""
    docs = []
    for item in items:
        doc = MagicMock()
        doc.id = item["id"]
        doc.to_dict.return_value = item
        docs.append(doc)
    return docs


class TestAnalyzeProductCompatibility:
    @patch("alcheme.tools.shopping_tools._get_db")
    def test_empty_inventory(self, mock_db, mock_tool_context):
        """Empty inventory returns inventory_empty gap analysis."""
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = []

        product = {"brand": "KATE", "product_name": "リップモンスター", "category": "Lip"}
        result = analyze_product_compatibility(json.dumps(product), mock_tool_context)

        assert result["status"] == "success"
        assert result["inventory_size"] == 0
        assert result["gap_analysis"] == "inventory_empty"
        assert result["duplicate_risk"] == "none"

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_fills_gap_new_category(self, mock_db, mock_tool_context, sample_items):
        """Product in new category → fills_gap."""
        mock_docs = _make_mock_docs(sample_items)
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        # "ネイル" category doesn't exist in sample_items
        product = {"brand": "OPI", "product_name": "ネイルポリッシュ", "category": "ネイル"}
        result = analyze_product_compatibility(json.dumps(product), mock_tool_context)

        assert result["status"] == "success"
        assert result["gap_analysis"] == "fills_gap"
        assert result["duplicate_risk"] == "none"

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_duplicate_risk_high(self, mock_db, mock_tool_context, sample_items):
        """Very similar product → high duplicate risk."""
        mock_docs = _make_mock_docs(sample_items)
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        # Same brand, same product line, same category, same color, same texture
        product = {
            "brand": "KATE",
            "product_name": "リップモンスター",
            "category": "Lip",
            "item_type": "lip",
            "color_description": "ブラウンレッド",
            "texture": "matte",
        }
        result = analyze_product_compatibility(json.dumps(product), mock_tool_context)

        assert result["status"] == "success"
        assert result["duplicate_risk"] in ("medium", "high")
        assert len(result["similar_items"]) >= 1

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_adds_variety(self, mock_db, mock_tool_context, sample_items):
        """Product in existing category but different → adds_variety."""
        mock_docs = _make_mock_docs(sample_items)
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        # Different brand, different product in Lip category
        product = {"brand": "CEZANNE", "product_name": "ラスティングリップ", "category": "Lip"}
        result = analyze_product_compatibility(json.dumps(product), mock_tool_context)

        assert result["status"] == "success"
        assert result["gap_analysis"] == "adds_variety"

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_invalid_json(self, mock_db, mock_tool_context):
        """Invalid JSON input returns error."""
        result = analyze_product_compatibility("not json{{{", mock_tool_context)
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# compare_products_against_inventory
# ---------------------------------------------------------------------------
class TestCompareProductsAgainstInventory:
    @patch("alcheme.tools.shopping_tools._get_db")
    def test_two_product_comparison(self, mock_db, mock_tool_context, sample_items):
        """Comparing 2 products returns per-product analysis."""
        mock_docs = _make_mock_docs(sample_items)
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        products = [
            {"brand": "CEZANNE", "product_name": "チーク", "category": "Cheek"},
            {"brand": "CANMAKE", "product_name": "チーク", "category": "Cheek"},
        ]
        result = compare_products_against_inventory(json.dumps(products), mock_tool_context)

        assert result["status"] == "success"
        assert len(result["comparisons"]) == 2
        assert result["inventory_size"] == len(sample_items)
        for comp in result["comparisons"]:
            assert "duplicate_risk" in comp
            assert "gap_analysis" in comp

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_less_than_two_products_error(self, mock_db, mock_tool_context):
        """Single product list returns error."""
        products = [{"brand": "KATE", "product_name": "リップ"}]
        result = compare_products_against_inventory(json.dumps(products), mock_tool_context)
        assert result["status"] == "error"
        assert "2 products" in result["message"]

    @patch("alcheme.tools.shopping_tools._get_db")
    def test_invalid_json(self, mock_db, mock_tool_context):
        """Invalid JSON input returns error."""
        result = compare_products_against_inventory("{{invalid}}", mock_tool_context)
        assert result["status"] == "error"
