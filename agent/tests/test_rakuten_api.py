"""Tests for rakuten_api.py — UT-P21~P23."""

import os
from unittest.mock import patch, MagicMock

import pytest

from alcheme.tools.rakuten_api import search_rakuten_api


# ---------------------------------------------------------------------------
# UT-P21: Successful search
# ---------------------------------------------------------------------------
class TestSearchRakutenApi:
    @patch("alcheme.tools.rakuten_api.requests.get")
    @patch.dict(os.environ, {"RAKUTEN_APP_ID": "test_app_id"})
    def test_success(self, mock_get):
        """Successful search returns results."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "Items": [
                {
                    "Item": {
                        "itemName": "KATE リップモンスター 01",
                        "itemPrice": 1540,
                        "itemUrl": "https://example.com/item1",
                        "shopName": "テストショップ",
                        "mediumImageUrls": [{"imageUrl": "https://example.com/img1.jpg"}],
                    }
                },
                {
                    "Item": {
                        "itemName": "KATE リップモンスター 02",
                        "itemPrice": 1540,
                        "itemUrl": "https://example.com/item2",
                        "shopName": "テストショップ2",
                        "mediumImageUrls": [{"imageUrl": "https://example.com/img2.jpg"}],
                    }
                },
            ]
        }
        mock_get.return_value = mock_response

        result = search_rakuten_api("KATE リップモンスター")
        assert result["status"] == "success"
        assert result["count"] == 2
        assert result["results"][0]["name"] == "KATE リップモンスター 01"

    # ---------------------------------------------------------------------------
    # UT-P22: Empty results
    # ---------------------------------------------------------------------------
    @patch("alcheme.tools.rakuten_api.requests.get")
    @patch.dict(os.environ, {"RAKUTEN_APP_ID": "test_app_id"})
    def test_empty_results(self, mock_get):
        """Search with no matches returns empty results."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"Items": []}
        mock_get.return_value = mock_response

        result = search_rakuten_api("NONEXISTENT_PRODUCT_12345")
        assert result["status"] == "success"
        assert result["count"] == 0
        assert result["results"] == []

    # ---------------------------------------------------------------------------
    # UT-P23a: Missing RAKUTEN_APP_ID
    # ---------------------------------------------------------------------------
    @patch.dict(os.environ, {}, clear=True)
    def test_missing_app_id(self):
        """Missing RAKUTEN_APP_ID returns error."""
        # Ensure env var is not set
        os.environ.pop("RAKUTEN_APP_ID", None)
        result = search_rakuten_api("test")
        assert result["status"] == "error"
        assert "RAKUTEN_APP_ID" in result["message"]

    # ---------------------------------------------------------------------------
    # UT-P23b: Timeout
    # ---------------------------------------------------------------------------
    @patch("alcheme.tools.rakuten_api.requests.get")
    @patch.dict(os.environ, {"RAKUTEN_APP_ID": "test_app_id"})
    def test_timeout(self, mock_get):
        """Timeout raises and returns error."""
        import requests

        mock_get.side_effect = requests.exceptions.Timeout("Connection timed out")

        result = search_rakuten_api("test")
        assert result["status"] == "error"
        assert "timed out" in result["message"].lower() or "error" in result["status"]
