"""Tests for profiler_tools.py — Preference persistence (ARCH-002)."""

from unittest.mock import MagicMock, patch, PropertyMock

import pytest

from alcheme.tools.profiler_tools import analyze_preference_history


def _make_mock_db(log_docs=None, recipe_docs=None, inv_docs=None):
    """Create a mock Firestore client with configurable document streams."""
    mock_db = MagicMock()

    user_doc_ref = MagicMock()
    mock_db.collection.return_value.document.return_value = user_doc_ref

    # beauty_logs subcollection
    logs_query = MagicMock()
    logs_query.stream.return_value = log_docs or []
    logs_col = MagicMock()
    logs_col.order_by.return_value.limit.return_value = logs_query

    # recipes subcollection
    recipes_query = MagicMock()
    recipes_query.stream.return_value = recipe_docs or []
    recipes_col = MagicMock()
    recipes_col.order_by.return_value.limit.return_value = recipes_query

    # inventory subcollection
    inv_col = MagicMock()
    inv_col.stream.return_value = inv_docs or []

    def _collection_side_effect(name):
        if name == "beauty_logs":
            return logs_col
        elif name == "recipes":
            return recipes_col
        elif name == "inventory":
            return inv_col
        return MagicMock()

    user_doc_ref.collection.side_effect = _collection_side_effect

    return mock_db


class TestAnalyzePreferenceHistory:
    """Tests for analyze_preference_history tool."""

    @patch("alcheme.tools.profiler_tools._get_db")
    def test_analyze_returns_success(self, mock_get_db, mock_tool_context):
        """Successful analysis returns dict with expected keys."""
        mock_get_db.return_value = _make_mock_db()

        result = analyze_preference_history(mock_tool_context)

        assert result["status"] == "success"
        assert "color_preferences" in result
        assert "texture_preferences" in result
        assert "area_frequency" in result
        assert "mood_patterns" in result
        assert "occasion_patterns" in result
        assert "monotony_alert" in result
        assert "underused_items" in result

    @patch("alcheme.tools.profiler_tools._get_db")
    def test_persists_to_firestore(self, mock_get_db, mock_tool_context):
        """After analysis, preferences are written to Firestore."""
        mock_db = _make_mock_db()
        mock_get_db.return_value = mock_db

        result = analyze_preference_history(mock_tool_context)

        assert result["status"] == "success"
        # Verify update() was called on users/{userId} doc
        user_doc_ref = mock_db.collection.return_value.document.return_value
        user_doc_ref.update.assert_called_once()
        call_args = user_doc_ref.update.call_args[0][0]
        assert "preferences" in call_args
        prefs = call_args["preferences"]
        assert "color_preferences" in prefs
        assert "analyzed_at" in prefs

    @patch("alcheme.tools.profiler_tools._get_db")
    def test_updates_session_state(self, mock_get_db, mock_tool_context):
        """After analysis, user:profiler_preferences is set in state."""
        mock_get_db.return_value = _make_mock_db()

        analyze_preference_history(mock_tool_context)

        assert "user:profiler_preferences" in mock_tool_context.state
        prefs = mock_tool_context.state["user:profiler_preferences"]
        assert "color_preferences" in prefs
        # Should not include "status" key
        assert "status" not in prefs

    @patch("alcheme.tools.profiler_tools._get_db")
    def test_firestore_failure_does_not_break(self, mock_get_db, mock_tool_context):
        """If Firestore write fails, tool still returns success."""
        mock_db = _make_mock_db()
        mock_db.collection.return_value.document.return_value.update.side_effect = (
            Exception("Firestore write failed")
        )
        mock_get_db.return_value = mock_db

        result = analyze_preference_history(mock_tool_context)

        assert result["status"] == "success"
