"""Tests for simulator_tools.py — AI preview image generation."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# generate_preview_image
# ---------------------------------------------------------------------------
class TestGeneratePreviewImage:
    @pytest.fixture
    def sample_steps(self):
        return [
            {"category": "リップ", "color_description": "coral pink", "brand": "KATE", "product_name": "リップモンスター"},
            {"category": "アイシャドウ", "color_description": "brown", "brand": "EXCEL", "product_name": "スキニーリッチシャドウ"},
        ]

    def _mock_genai_success(self, mock_genai_cls):
        """Set up genai mock to return a response with image data."""
        mock_client = MagicMock()
        mock_genai_cls.return_value = mock_client

        mock_part = MagicMock()
        mock_part.inline_data.mime_type = "image/webp"
        mock_part.inline_data.data = b"fake_image_bytes"

        mock_response = MagicMock()
        mock_response.candidates = [MagicMock(content=MagicMock(parts=[mock_part]))]
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        return mock_client

    def _mock_storage_success(self, mock_get_storage):
        """Set up storage mock to return a blob with public_url."""
        mock_blob = MagicMock()
        mock_blob.public_url = "https://storage.googleapis.com/alcheme-previews/test-user/recipe-1.webp"
        mock_get_storage.return_value.bucket.return_value.blob.return_value = mock_blob
        return mock_blob

    @patch("alcheme.tools.simulator_tools._get_firestore")
    @patch("alcheme.tools.simulator_tools._get_storage")
    @patch("alcheme.tools.simulator_tools.genai.Client")
    async def test_success(self, mock_genai_cls, mock_get_storage, mock_get_firestore, sample_steps):
        """Successful generation returns image_url and updates Firestore."""
        from alcheme.tools.simulator_tools import generate_preview_image

        self._mock_genai_success(mock_genai_cls)
        mock_blob = self._mock_storage_success(mock_get_storage)

        result = await generate_preview_image(
            recipe_id="recipe-1",
            user_id="test-user",
            steps=sample_steps,
            theme="cute",
        )

        assert result["status"] == "success"
        assert "image_url" in result
        assert result["image_url"] == mock_blob.public_url

        # Verify blob upload was called
        mock_blob.upload_from_string.assert_called_once_with(b"fake_image_bytes", content_type="image/webp")
        mock_blob.make_public.assert_called_once()

        # Verify Firestore update
        mock_get_firestore.return_value.collection.assert_called_with("users")

    @patch("alcheme.tools.simulator_tools._get_firestore")
    @patch("alcheme.tools.simulator_tools._get_storage")
    @patch("alcheme.tools.simulator_tools.genai.Client")
    async def test_no_image_in_response(self, mock_genai_cls, mock_get_storage, mock_get_firestore, sample_steps):
        """Model response without image data returns error."""
        from alcheme.tools.simulator_tools import generate_preview_image

        mock_client = MagicMock()
        mock_genai_cls.return_value = mock_client

        # Response with text part only, no image
        mock_text_part = MagicMock()
        mock_text_part.inline_data = None
        mock_response = MagicMock()
        mock_response.candidates = [MagicMock(content=MagicMock(parts=[mock_text_part]))]
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        result = await generate_preview_image(
            recipe_id="recipe-1",
            user_id="test-user",
            steps=sample_steps,
        )

        assert result["status"] == "error"
        assert "No image" in result["error"]

    @patch("alcheme.tools.simulator_tools._get_firestore")
    @patch("alcheme.tools.simulator_tools._get_storage")
    @patch("alcheme.tools.simulator_tools.genai.Client")
    async def test_empty_candidates(self, mock_genai_cls, mock_get_storage, mock_get_firestore, sample_steps):
        """Model response with empty candidates returns error."""
        from alcheme.tools.simulator_tools import generate_preview_image

        mock_client = MagicMock()
        mock_genai_cls.return_value = mock_client

        mock_response = MagicMock()
        mock_response.candidates = []
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        result = await generate_preview_image(
            recipe_id="recipe-1",
            user_id="test-user",
            steps=sample_steps,
        )

        assert result["status"] == "error"

    @patch("alcheme.tools.simulator_tools._get_firestore")
    @patch("alcheme.tools.simulator_tools._get_storage")
    @patch("alcheme.tools.simulator_tools.genai.Client")
    async def test_storage_upload_failure(self, mock_genai_cls, mock_get_storage, mock_get_firestore, sample_steps):
        """GCS upload failure returns error gracefully."""
        from alcheme.tools.simulator_tools import generate_preview_image

        self._mock_genai_success(mock_genai_cls)

        # Storage raises an exception on upload
        mock_blob = MagicMock()
        mock_blob.upload_from_string.side_effect = Exception("Storage unavailable")
        mock_get_storage.return_value.bucket.return_value.blob.return_value = mock_blob

        result = await generate_preview_image(
            recipe_id="recipe-1",
            user_id="test-user",
            steps=sample_steps,
        )

        assert result["status"] == "error"
        assert "Storage unavailable" in result["error"]

    @patch("alcheme.tools.simulator_tools._get_firestore")
    @patch("alcheme.tools.simulator_tools._get_storage")
    @patch("alcheme.tools.simulator_tools.genai.Client")
    async def test_firestore_update_fields(self, mock_genai_cls, mock_get_storage, mock_get_firestore, sample_steps):
        """Firestore update includes preview_image_url and character_theme."""
        from alcheme.tools.simulator_tools import generate_preview_image

        self._mock_genai_success(mock_genai_cls)
        self._mock_storage_success(mock_get_storage)

        mock_doc_ref = MagicMock()
        mock_get_firestore.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref

        await generate_preview_image(
            recipe_id="recipe-1",
            user_id="test-user",
            steps=sample_steps,
            theme="cool",
        )

        mock_doc_ref.update.assert_called_once()
        update_args = mock_doc_ref.update.call_args[0][0]
        assert "preview_image_url" in update_args
        assert update_args["character_theme"] == "cool"
