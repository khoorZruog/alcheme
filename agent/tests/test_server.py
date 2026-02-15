"""Tests for server.py — FastAPI endpoint tests."""

import json
from unittest.mock import patch, MagicMock, AsyncMock

import pytest
from httpx import AsyncClient, ASGITransport

from server import app


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Create async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
class TestHealth:
    @pytest.mark.anyio
    async def test_health(self, client):
        """Health endpoint returns ok status."""
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["app"] == "alcheme"


# ---------------------------------------------------------------------------
# POST /scan — auth
# ---------------------------------------------------------------------------
class TestScanAuth:
    @pytest.mark.anyio
    @patch.dict("os.environ", {"AGENT_API_KEY": "secret-key"})
    async def test_scan_missing_api_key(self, client):
        """POST /scan without API key returns 401."""
        # We need to re-import or patch the module-level variable
        with patch("server.AGENT_API_KEY", "secret-key"):
            resp = await client.post(
                "/scan",
                json={
                    "image_base64": "dGVzdA==",
                    "image_mime_type": "image/png",
                    "user_id": "test-user",
                },
            )
            assert resp.status_code == 401

    @pytest.mark.anyio
    @patch.dict("os.environ", {"AGENT_API_KEY": "secret-key"})
    async def test_scan_wrong_api_key(self, client):
        """POST /scan with wrong API key returns 401."""
        with patch("server.AGENT_API_KEY", "secret-key"):
            resp = await client.post(
                "/scan",
                json={
                    "image_base64": "dGVzdA==",
                    "image_mime_type": "image/png",
                    "user_id": "test-user",
                },
                headers={"X-API-Key": "wrong-key"},
            )
            assert resp.status_code == 401


# ---------------------------------------------------------------------------
# POST /chat — auth
# ---------------------------------------------------------------------------
class TestChatAuth:
    @pytest.mark.anyio
    async def test_chat_missing_api_key(self, client):
        """POST /chat without API key returns 401 when key is required."""
        with patch("server.AGENT_API_KEY", "secret-key"):
            resp = await client.post(
                "/chat",
                json={"message": "hello", "user_id": "test-user"},
            )
            assert resp.status_code == 401


# ---------------------------------------------------------------------------
# POST /scan — success (mocked agent)
# ---------------------------------------------------------------------------
class TestScanSuccess:
    @pytest.mark.anyio
    async def test_scan_returns_items(self, client):
        """POST /scan returns parsed items from agent."""
        # Mock the runner to return a fake event with JSON items
        mock_event = MagicMock()
        mock_event.content = MagicMock()
        mock_part = MagicMock()
        mock_part.text = json.dumps({
            "items": [
                {
                    "id": "item_001",
                    "category": "Lip",
                    "brand": "KATE",
                    "product_name": "リップモンスター",
                    "color_description": "赤",
                    "texture": "matte",
                    "estimated_remaining": "80%",
                    "confidence": "high",
                }
            ]
        })
        mock_event.content.parts = [mock_part]

        async def mock_run_async(**kwargs):
            yield mock_event

        with patch("server.runner") as mock_runner, \
             patch("server.session_service") as mock_session, \
             patch("server.AGENT_API_KEY", ""):
            mock_runner.run_async = mock_run_async
            mock_session.create_session = AsyncMock()

            resp = await client.post(
                "/scan",
                json={
                    "image_base64": "dGVzdA==",
                    "image_mime_type": "image/png",
                    "user_id": "test-user",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is True
            assert data["count"] >= 1


# ---------------------------------------------------------------------------
# POST /chat — SSE format
# ---------------------------------------------------------------------------
class TestChatSSE:
    @pytest.mark.anyio
    async def test_chat_returns_sse(self, client):
        """POST /chat returns text/event-stream with proper SSE format."""
        mock_event = MagicMock()
        mock_event.content = MagicMock()
        mock_part = MagicMock()
        mock_part.text = "こんにちは！"
        mock_event.content.parts = [mock_part]

        async def mock_run_async(**kwargs):
            yield mock_event

        with patch("server.runner") as mock_runner, \
             patch("server.session_service") as mock_session, \
             patch("server.AGENT_API_KEY", ""):
            mock_runner.run_async = mock_run_async
            mock_session.get_session = AsyncMock(return_value=None)
            mock_session.create_session = AsyncMock()

            resp = await client.post(
                "/chat",
                json={"message": "hello", "user_id": "test-user"},
            )
            assert resp.status_code == 200
            assert "text/event-stream" in resp.headers["content-type"]

            # Parse SSE events
            body = resp.text
            lines = [l for l in body.split("\n") if l.startswith("data: ")]
            assert len(lines) >= 2  # At least text_delta + done

            # Check last event is "done"
            last_event = json.loads(lines[-1].replace("data: ", ""))
            assert last_event["type"] == "done"
