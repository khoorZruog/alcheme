"""Shared test fixtures for alche:me agent tests."""

import json
import os
import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Sample inventory data (matches shared/sample_inventory.json structure)
# ---------------------------------------------------------------------------
SAMPLE_ITEMS = [
    {
        "id": "item_001",
        "category": "Lip",
        "brand": "KATE",
        "product_name": "リップモンスター",
        "color_code": "03",
        "color_name": "陽炎",
        "color_description": "ほんのり赤みのあるブラウンレッド",
        "texture": "matte",
        "stats": {"pigment": 4, "longevity": 5, "shelf_life": 4, "natural_finish": 2},
        "estimated_remaining": "80%",
        "confidence": "high",
        "source": "テストデータ",
    },
    {
        "id": "item_002",
        "category": "Eye",
        "brand": "EXCEL",
        "product_name": "スキニーリッチシャドウ",
        "color_code": "SR06",
        "color_name": "センシュアルブラウン",
        "color_description": "肌なじみの良い4色ブラウンパレット",
        "texture": "shimmer",
        "stats": {"pigment": 3, "longevity": 3, "shelf_life": 4, "natural_finish": 4},
        "estimated_remaining": "60%",
        "confidence": "high",
        "source": "テストデータ",
    },
    {
        "id": "item_003",
        "category": "Cheek",
        "brand": "CANMAKE",
        "product_name": "グロウフルールチークス",
        "color_code": "01",
        "color_name": "ピーチフルール",
        "color_description": "ピンク系フラワーパターンチーク",
        "texture": "powder",
        "stats": {"pigment": 3, "longevity": 3, "shelf_life": 3, "natural_finish": 3},
        "estimated_remaining": "70%",
        "confidence": "medium",
        "source": "テストデータ",
    },
    {
        "id": "item_004",
        "category": "Base",
        "brand": "PAUL & JOE",
        "product_name": "モイスチュアライジング ファンデーション プライマー S",
        "color_code": None,
        "color_name": None,
        "color_description": "ツヤ肌仕上げの化粧下地",
        "texture": "cream",
        "stats": {"pigment": 2, "longevity": 3, "shelf_life": 3, "natural_finish": 5},
        "estimated_remaining": "50%",
        "confidence": "high",
        "source": "テストデータ",
    },
]


@pytest.fixture
def sample_items():
    """Return sample inventory items for testing."""
    return SAMPLE_ITEMS.copy()


@pytest.fixture
def sample_item_ids():
    """Return set of sample item IDs."""
    return {item["id"] for item in SAMPLE_ITEMS}


@pytest.fixture
def mock_firestore():
    """Create a mock Firestore client."""
    mock_db = MagicMock()

    # Mock collection -> document -> get pattern
    mock_collection = MagicMock()
    mock_db.collection.return_value = mock_collection

    return mock_db


@pytest.fixture
def mock_tool_context(sample_items):
    """Create a mock ToolContext with user state and inventory."""
    ctx = MagicMock()
    ctx.state = {
        "user_id": "test-user-001",
        "user:id": "test-user-001",
    }
    return ctx
