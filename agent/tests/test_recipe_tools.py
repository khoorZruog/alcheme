"""Tests for recipe_tools.py — UT-P11~P14."""

import json
from unittest.mock import MagicMock, patch

import pytest

from alcheme.tools.recipe_tools import save_recipe, get_recent_recipes


# ---------------------------------------------------------------------------
# UT-P11: save_recipe — success
# ---------------------------------------------------------------------------
class TestSaveRecipe:
    @patch("alcheme.tools.recipe_tools._get_db")
    def test_save_valid_recipe(self, mock_db, mock_tool_context):
        """Save a valid recipe returns success with recipe_id."""
        mock_doc_ref = MagicMock()
        mock_doc_ref.id = "recipe_abc123"
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref

        recipe = {
            "title": "韓国風メイク",
            "match_score": 85,
            "steps": [
                {
                    "step": 1,
                    "area": "Base",
                    "item_id": "item_004",
                    "item_name": "PAUL & JOE プライマー",
                    "instruction": "下地を塗る",
                }
            ],
        }
        result = save_recipe(json.dumps(recipe), mock_tool_context)
        assert result["status"] == "success"
        assert "recipe_id" in result

    @patch("alcheme.tools.recipe_tools._get_db")
    def test_save_invalid_json(self, mock_db, mock_tool_context):
        """Save with invalid JSON returns error."""
        result = save_recipe("{{invalid", mock_tool_context)
        assert result["status"] == "error"


# ---------------------------------------------------------------------------
# UT-P12~P14: get_recent_recipes
# ---------------------------------------------------------------------------
class TestGetRecentRecipes:
    @patch("alcheme.tools.recipe_tools._get_db")
    def test_returns_recipes(self, mock_db, mock_tool_context):
        """get_recent_recipes returns list of recipes."""
        mock_docs = []
        for i in range(3):
            doc = MagicMock()
            doc.id = f"recipe_{i}"
            doc.to_dict.return_value = {
                "title": f"レシピ {i}",
                "match_score": 80 + i,
            }
            mock_docs.append(doc)

        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.order_by.return_value.limit.return_value.stream.return_value = mock_docs

        result = get_recent_recipes(mock_tool_context)
        assert result["status"] == "success"
        assert len(result["recipes"]) == 3

    @patch("alcheme.tools.recipe_tools._get_db")
    def test_empty_recipes(self, mock_db, mock_tool_context):
        """get_recent_recipes returns empty list when no recipes."""
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.order_by.return_value.limit.return_value.stream.return_value = []

        result = get_recent_recipes(mock_tool_context)
        assert result["status"] == "success"
        assert result["recipes"] == []

    @patch("alcheme.tools.recipe_tools._get_db")
    def test_custom_limit(self, mock_db, mock_tool_context):
        """get_recent_recipes respects custom limit parameter."""
        mock_query = MagicMock()
        mock_db.return_value.collection.return_value.document.return_value.collection.return_value.order_by.return_value = mock_query
        mock_query.limit.return_value.stream.return_value = []

        get_recent_recipes(mock_tool_context, limit=10)
        mock_query.limit.assert_called_with(10)
