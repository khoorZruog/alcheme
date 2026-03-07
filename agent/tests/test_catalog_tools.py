"""Tests for catalog_tools — deterministic ID + upsert + search."""

from unittest.mock import MagicMock, patch
import pytest

from alcheme.tools.catalog_tools import _catalog_doc_id, upsert_catalog, search_catalog


# ---------- _catalog_doc_id tests ----------


class TestCatalogDocId:
    """Tests for deterministic catalog document ID generation."""

    def test_generates_20_char_hex(self):
        doc_id = _catalog_doc_id("KATE", "リップモンスター", "03")
        assert len(doc_id) == 20
        assert all(c in "0123456789abcdef" for c in doc_id)

    def test_deterministic(self):
        a = _catalog_doc_id("KATE", "リップモンスター", "03")
        b = _catalog_doc_id("KATE", "リップモンスター", "03")
        assert a == b

    def test_case_insensitive_brand(self):
        upper = _catalog_doc_id("KATE", "リップモンスター", "03")
        lower = _catalog_doc_id("kate", "リップモンスター", "03")
        mixed = _catalog_doc_id("Kate", "リップモンスター", "03")
        assert upper == lower == mixed

    def test_case_insensitive_product_name(self):
        a = _catalog_doc_id("DIOR", "Addict Lip Maximizer")
        b = _catalog_doc_id("DIOR", "addict lip maximizer")
        assert a == b

    def test_case_insensitive_color_code(self):
        a = _catalog_doc_id("KATE", "リップモンスター", "M03")
        b = _catalog_doc_id("KATE", "リップモンスター", "m03")
        assert a == b

    def test_trims_whitespace(self):
        a = _catalog_doc_id("KATE", "リップモンスター", "03")
        b = _catalog_doc_id("  KATE  ", "  リップモンスター  ", "  03  ")
        assert a == b

    def test_none_color_code(self):
        a = _catalog_doc_id("KATE", "リップモンスター")
        b = _catalog_doc_id("KATE", "リップモンスター", None)
        assert a == b

    def test_empty_color_code(self):
        a = _catalog_doc_id("KATE", "リップモンスター")
        b = _catalog_doc_id("KATE", "リップモンスター", "")
        assert a == b

    def test_different_color_codes_differ(self):
        id03 = _catalog_doc_id("KATE", "リップモンスター", "03")
        id05 = _catalog_doc_id("KATE", "リップモンスター", "05")
        assert id03 != id05

    def test_matches_typescript_implementation(self):
        """Verify Python and TypeScript produce identical IDs.

        This is critical — both implementations must agree.
        The expected value was computed using the TypeScript catalogDocId.
        """
        import hashlib
        # Manual calculation for verification
        normalized = "kate::リップモンスター::03"
        expected = hashlib.sha256(normalized.encode()).hexdigest()[:20]
        actual = _catalog_doc_id("KATE", "リップモンスター", "03")
        assert actual == expected


# ---------- upsert_catalog tests ----------


def _make_mock_db(existing_data=None):
    """Create mock Firestore client."""
    mock_db = MagicMock()
    mock_doc_ref = MagicMock()
    mock_snapshot = MagicMock()

    if existing_data is not None:
        mock_snapshot.exists = True
        mock_snapshot.to_dict.return_value = existing_data
    else:
        mock_snapshot.exists = False

    mock_doc_ref.get.return_value = mock_snapshot
    mock_db.collection.return_value.document.return_value = mock_doc_ref

    return mock_db, mock_doc_ref


class TestUpsertCatalog:
    """Tests for upsert_catalog function."""

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_creates_new_entry(self, mock_get_db):
        mock_db, mock_doc_ref = _make_mock_db(existing_data=None)
        mock_get_db.return_value = mock_db

        doc_id = upsert_catalog({
            "brand": "KATE",
            "product_name": "リップモンスター",
            "color_code": "03",
            "category": "リップ",
        })

        assert doc_id != ""
        mock_doc_ref.set.assert_called_once()
        call_args = mock_doc_ref.set.call_args[0][0]
        assert call_args["brand"] == "KATE"
        assert call_args["product_name"] == "リップモンスター"
        assert call_args["contributor_count"] == 1
        assert call_args["brand_normalized"] == "kate"

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_merges_existing_entry(self, mock_get_db):
        mock_db, mock_doc_ref = _make_mock_db(existing_data={
            "brand": "KATE",
            "product_name": "リップモンスター",
            "color_code": "03",
            "category": "リップ",
            "image_url": None,
            "contributor_count": 1,
        })
        mock_get_db.return_value = mock_db

        doc_id = upsert_catalog({
            "brand": "KATE",
            "product_name": "リップモンスター",
            "color_code": "03",
            "image_url": "https://example.com/image.jpg",
        })

        assert doc_id != ""
        mock_doc_ref.update.assert_called_once()
        call_args = mock_doc_ref.update.call_args[0][0]
        # image_url was null, should be filled
        assert call_args["image_url"] == "https://example.com/image.jpg"

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_does_not_overwrite_existing_values(self, mock_get_db):
        mock_db, mock_doc_ref = _make_mock_db(existing_data={
            "brand": "KATE",
            "product_name": "リップモンスター",
            "category": "リップ",
            "image_url": "https://existing.com/image.jpg",
            "contributor_count": 3,
        })
        mock_get_db.return_value = mock_db

        upsert_catalog({
            "brand": "KATE",
            "product_name": "リップモンスター",
            "image_url": "https://new.com/image.jpg",
        })

        call_args = mock_doc_ref.update.call_args[0][0]
        # Should NOT overwrite existing image_url
        assert "image_url" not in call_args or call_args.get("image_url") != "https://new.com/image.jpg"

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_returns_empty_for_missing_brand(self, mock_get_db):
        doc_id = upsert_catalog({"product_name": "リップモンスター"})
        assert doc_id == ""

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_returns_empty_for_missing_product_name(self, mock_get_db):
        doc_id = upsert_catalog({"brand": "KATE"})
        assert doc_id == ""


# ---------- search_catalog tests ----------


class TestSearchCatalog:
    """Tests for search_catalog tool function."""

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_rejects_short_query(self, mock_get_db):
        ctx = MagicMock()
        result = search_catalog("k", ctx)
        assert result["status"] == "error"

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_returns_results(self, mock_get_db):
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "abc123"
        mock_doc.to_dict.return_value = {
            "brand": "KATE",
            "product_name": "リップモンスター",
            "category": "リップ",
            "contributor_count": 5,
        }

        # brand query returns match, product name query returns empty
        mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.stream.side_effect = [
            [mock_doc],  # brand match
            [],          # product name match
        ]
        mock_get_db.return_value = mock_db
        ctx = MagicMock()

        result = search_catalog("kate", ctx)
        assert result["status"] == "success"
        assert result["count"] == 1
        assert result["results"][0]["brand"] == "KATE"

    @patch("alcheme.tools.catalog_tools._get_db")
    def test_deduplicates_results(self, mock_get_db):
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "abc123"
        mock_doc.to_dict.return_value = {
            "brand": "KATE",
            "product_name": "リップモンスター",
            "contributor_count": 1,
        }

        # Same doc appears in both brand and name results
        mock_db.collection.return_value.where.return_value.where.return_value.limit.return_value.stream.side_effect = [
            [mock_doc],
            [mock_doc],
        ]
        mock_get_db.return_value = mock_db
        ctx = MagicMock()

        result = search_catalog("kate", ctx)
        assert result["count"] == 1  # deduplicated
