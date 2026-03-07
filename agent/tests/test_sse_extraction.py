"""Tests for _extract_card_events_from_event in server.py."""

from unittest.mock import MagicMock

import pytest

from server import _extract_card_events_from_event


def _make_event_with_function_response(name: str, response: dict):
    """Create a mock ADK event with a function_response part."""
    part = MagicMock()
    part.function_response = MagicMock()
    part.function_response.name = name
    part.function_response.response = response
    # Ensure function_call is not set
    part.function_call = None

    event = MagicMock()
    event.content = MagicMock()
    event.content.parts = [part]
    return event


def _make_event_no_content():
    """Create a mock ADK event with no content."""
    event = MagicMock()
    event.content = None
    return event


class TestExtractCardEvents:
    """Test _extract_card_events_from_event extraction."""

    def test_returns_empty_for_no_content(self):
        event = _make_event_no_content()
        assert _extract_card_events_from_event(event) == []

    def test_returns_empty_for_unrelated_tool(self):
        event = _make_event_with_function_response(
            "search_rakuten", {"status": "success", "results": []}
        )
        assert _extract_card_events_from_event(event) == []

    def test_returns_empty_for_failed_status(self):
        event = _make_event_with_function_response(
            "analyze_product_compatibility",
            {"status": "error", "message": "something went wrong"},
        )
        assert _extract_card_events_from_event(event) == []

    def test_analyze_product_compatibility(self):
        event = _make_event_with_function_response(
            "analyze_product_compatibility",
            {
                "status": "success",
                "product_analyzed": {
                    "brand": "CANMAKE",
                    "product_name": "パーフェクトマルチアイズ",
                    "category": "アイシャドウ",
                    "price": 858,
                    "image_url": "https://example.com/img.jpg",
                    "product_url": "https://example.com/product",
                },
                "duplicate_risk": "low",
                "gap_analysis": "fills_gap",
                "similar_items": [],
            },
        )
        results = _extract_card_events_from_event(event)
        assert len(results) == 1
        assert results[0]["type"] == "product_card"
        data = results[0]["data"]
        assert data["brand"] == "CANMAKE"
        assert data["product_name"] == "パーフェクトマルチアイズ"
        assert data["duplicate_risk"] == "low"
        assert data["gap_analysis"] == "fills_gap"
        assert data["similar_items_count"] == 0

    def test_compare_products_multiple(self):
        event = _make_event_with_function_response(
            "compare_products_against_inventory",
            {
                "status": "success",
                "comparisons": [
                    {
                        "product": {
                            "brand": "DIOR",
                            "product_name": "リップ A",
                            "category": "リップ",
                        },
                        "duplicate_risk": "high",
                        "gap_analysis": "near_duplicate",
                        "similar_items": [{"name": "existing"}],
                    },
                    {
                        "product": {
                            "brand": "CHANEL",
                            "product_name": "アイシャドウ B",
                            "category": "アイシャドウ",
                        },
                        "duplicate_risk": "none",
                        "gap_analysis": "fills_gap",
                        "similar_items": [],
                    },
                ],
            },
        )
        results = _extract_card_events_from_event(event)
        assert len(results) == 2
        assert results[0]["data"]["brand"] == "DIOR"
        assert results[0]["data"]["duplicate_risk"] == "high"
        assert results[0]["data"]["similar_items_count"] == 1
        assert results[1]["data"]["brand"] == "CHANEL"
        assert results[1]["data"]["duplicate_risk"] == "none"

    def test_get_substitution_technique(self):
        event = _make_event_with_function_response(
            "get_substitution_technique",
            {
                "status": "success",
                "title": "アイシャドウの代用テクニック",
                "original_item": "EXCEL ブラウンパレット",
                "substitute_item": "CANMAKE チーク",
                "techniques": ["ブラシで少量取る", "重ね塗りする"],
                "reasons": ["同系色で代用可能"],
                "general_tips": ["少量ずつ重ねる"],
            },
        )
        results = _extract_card_events_from_event(event)
        assert len(results) == 1
        assert results[0]["type"] == "technique_card"
        data = results[0]["data"]
        assert data["title"] == "アイシャドウの代用テクニック"
        assert data["original_item"] == "EXCEL ブラウンパレット"
        assert len(data["techniques"]) == 2

    def test_handles_exception_gracefully(self):
        """If event structure is unexpected, should return empty list."""
        event = MagicMock()
        event.content = MagicMock()
        # parts raises an error when iterated
        type(event.content).parts = property(lambda self: (_ for _ in ()).throw(RuntimeError("broken")))
        results = _extract_card_events_from_event(event)
        assert results == []
