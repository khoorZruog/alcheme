"""Tests for inventory_tools.py — UT-P01~P10."""

import json
from unittest.mock import MagicMock, patch

import pytest

from alcheme.tools.inventory_tools import (
    generate_item_id,
    get_inventory,
    get_inventory_summary,
    search_inventory,
    filter_inventory_by_category,
    add_items_to_inventory,
    validate_recipe_items,
)


# ---------------------------------------------------------------------------
# UT-P01: generate_item_id
# ---------------------------------------------------------------------------
class TestGenerateItemId:
    def test_format(self):
        """ID format is item_{8 hex chars}."""
        item_id = generate_item_id()
        assert item_id.startswith("item_")
        assert len(item_id) == 13  # "item_" + 8 hex chars

    def test_uniqueness(self):
        """Multiple calls produce unique IDs."""
        ids = {generate_item_id() for _ in range(100)}
        assert len(ids) == 100


# ---------------------------------------------------------------------------
# UT-P02: get_inventory
# ---------------------------------------------------------------------------
class TestGetInventory:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_returns_items(self, mock_db, mock_tool_context, sample_items):
        """get_inventory returns all items from Firestore."""
        # Setup mock docs
        mock_docs = []
        for item in sample_items:
            doc = MagicMock()
            doc.id = item["id"]
            doc.to_dict.return_value = item
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        result = get_inventory(mock_tool_context)
        assert result["status"] == "success"
        assert len(result["items"]) == 4

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_empty_inventory(self, mock_db, mock_tool_context):
        """get_inventory returns empty list when no items."""
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = []

        result = get_inventory(mock_tool_context)
        assert result["status"] == "success"
        assert result["items"] == []


# ---------------------------------------------------------------------------
# UT-P03: get_inventory_summary
# ---------------------------------------------------------------------------
class TestGetInventorySummary:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_summary_counts(self, mock_db, mock_tool_context, sample_items):
        """Summary includes total_items and category_counts."""
        mock_docs = []
        for item in sample_items:
            doc = MagicMock()
            doc.id = item["id"]
            doc.to_dict.return_value = item
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        result = get_inventory_summary(mock_tool_context)
        assert result["status"] == "success"
        assert result["total_items"] == 4
        assert result["category_counts"]["Lip"] == 1
        assert result["category_counts"]["Eye"] == 1
        assert result["category_counts"]["Cheek"] == 1
        assert result["category_counts"]["Base"] == 1

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_empty_summary(self, mock_db, mock_tool_context):
        """Summary with no items."""
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = []

        result = get_inventory_summary(mock_tool_context)
        assert result["status"] == "success"
        assert result["total_items"] == 0


# ---------------------------------------------------------------------------
# UT-P04: search_inventory
# ---------------------------------------------------------------------------
class TestSearchInventory:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_search_by_brand(self, mock_db, mock_tool_context, sample_items):
        """Search finds items matching brand name."""
        mock_docs = []
        for item in sample_items:
            doc = MagicMock()
            doc.id = item["id"]
            doc.to_dict.return_value = item
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        result = search_inventory("KATE", mock_tool_context)
        assert result["status"] == "success"
        assert result["count"] >= 1
        assert any("KATE" in str(i) for i in result["items"])

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_search_no_results(self, mock_db, mock_tool_context, sample_items):
        """Search with no matches returns empty."""
        mock_docs = []
        for item in sample_items:
            doc = MagicMock()
            doc.id = item["id"]
            doc.to_dict.return_value = item
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        result = search_inventory("NONEXISTENT_BRAND_XYZ", mock_tool_context)
        assert result["status"] == "success"
        assert result["count"] == 0


# ---------------------------------------------------------------------------
# UT-P05: filter_inventory_by_category
# ---------------------------------------------------------------------------
class TestFilterInventoryByCategory:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_filter_lip(self, mock_db, mock_tool_context, sample_items):
        """Filter by Lip returns only Lip items."""
        lip_items = [i for i in sample_items if i["category"] == "Lip"]
        mock_docs = []
        for item in lip_items:
            doc = MagicMock()
            doc.id = item["id"]
            doc.to_dict.return_value = item
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.where.return_value.stream.return_value = mock_docs

        result = filter_inventory_by_category("Lip", mock_tool_context)
        assert result["status"] == "success"
        assert result["count"] == 1

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_filter_empty_category(self, mock_db, mock_tool_context):
        """Filter returns empty for non-existent category."""
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.where.return_value.stream.return_value = []

        result = filter_inventory_by_category("Unknown", mock_tool_context)
        assert result["status"] == "success"
        assert result["count"] == 0


# ---------------------------------------------------------------------------
# UT-P06: add_items_to_inventory
# ---------------------------------------------------------------------------
class TestAddItemsToInventory:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_add_single_item(self, mock_db, mock_tool_context):
        """Add a single item to inventory."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        item = {
            "id": "item_test001",
            "category": "Lip",
            "brand": "Test Brand",
            "product_name": "Test Lipstick",
            "color_description": "赤",
            "texture": "matte",
            "estimated_remaining": "100%",
            "confidence": "high",
        }
        result = add_items_to_inventory(json.dumps([item]), mock_tool_context)
        assert result["status"] == "success"
        assert "item_test001" in result["added_ids"]

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_add_multiple_items(self, mock_db, mock_tool_context):
        """Add multiple items to inventory."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        items = [
            {"id": "item_a", "category": "Lip", "brand": "A", "product_name": "A"},
            {"id": "item_b", "category": "Eye", "brand": "B", "product_name": "B"},
        ]
        result = add_items_to_inventory(json.dumps(items), mock_tool_context)
        assert result["status"] == "success"
        assert len(result["added_ids"]) == 2

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_add_invalid_json(self, mock_db, mock_tool_context):
        """Add with invalid JSON returns error."""
        result = add_items_to_inventory("not valid json{{{", mock_tool_context)
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# UT-P07~P10: validate_recipe_items
# ---------------------------------------------------------------------------
class TestValidateRecipeItems:
    @patch("alcheme.tools.inventory_tools._get_db")
    def test_all_valid(self, mock_db, mock_tool_context, sample_item_ids):
        """All item IDs exist in inventory."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        # All docs exist
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_ref.document.return_value.get.return_value = mock_doc

        ids = list(sample_item_ids)
        result = validate_recipe_items(json.dumps(ids), mock_tool_context)
        assert result["status"] == "success"
        assert result["all_valid"] is True
        assert result["missing_items"] == []

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_some_missing(self, mock_db, mock_tool_context):
        """Some item IDs don't exist in inventory."""
        mock_ref = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value = mock_ref

        def get_doc(item_id):
            doc = MagicMock()
            # Only "item_001" exists
            doc.exists = (item_id == "item_001")
            return doc

        mock_ref.document.return_value.get.side_effect = lambda: get_doc("unknown")

        # We need to mock per-id
        def mock_document(item_id):
            doc_ref = MagicMock()
            mock_doc = MagicMock()
            mock_doc.exists = (item_id == "item_001")
            doc_ref.get.return_value = mock_doc
            return doc_ref

        mock_ref.document.side_effect = mock_document

        result = validate_recipe_items(
            json.dumps(["item_001", "item_FAKE"]),
            mock_tool_context,
        )
        assert result["status"] == "success"
        assert result["all_valid"] is False
        assert "item_FAKE" in result["missing_items"]

    @patch("alcheme.tools.inventory_tools._get_db")
    def test_invalid_json(self, mock_db, mock_tool_context):
        """Invalid JSON returns error."""
        result = validate_recipe_items("not json", mock_tool_context)
        assert result["status"] == "error"
