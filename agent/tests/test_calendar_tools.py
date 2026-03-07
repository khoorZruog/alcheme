"""Tests for calendar_tools — Google Calendar, manual schedule, and fallback."""

from unittest.mock import MagicMock, patch, PropertyMock
import pytest

from alcheme.tools.calendar_tools import (
    get_today_schedule,
    _enrich_events,
    _parse_manual_schedule,
    _FORMALITY_HINTS,
)


# ---------- _enrich_events tests ----------


class TestEnrichEvents:
    """Tests for formality hint enrichment."""

    def test_adds_formality_hint_for_known_keyword(self):
        events = [{"title": "午後の会議", "time": "14:00"}]
        enriched = _enrich_events(events)
        assert len(enriched) == 1
        assert "フォーマル" in enriched[0]["formality_hint"]

    def test_case_insensitive_keyword_matching(self):
        events = [{"title": "Weekly Meeting", "time": "10:00"}]
        enriched = _enrich_events(events)
        assert len(enriched) == 1
        assert "フォーマル" in enriched[0]["formality_hint"]

    def test_no_hint_for_unknown_event(self):
        events = [{"title": "買い物", "time": "15:00"}]
        enriched = _enrich_events(events)
        assert enriched[0]["formality_hint"] == ""

    def test_preserves_existing_fields(self):
        events = [{"title": "デート", "time": "18:00", "location": "渋谷"}]
        enriched = _enrich_events(events)
        assert enriched[0]["location"] == "渋谷"
        assert enriched[0]["time"] == "18:00"

    def test_multiple_events(self):
        events = [
            {"title": "朝のジム", "time": "07:00"},
            {"title": "昼のランチ", "time": "12:00"},
            {"title": "夜のパーティー", "time": "19:00"},
        ]
        enriched = _enrich_events(events)
        assert len(enriched) == 3
        assert "ウォータープルーフ" in enriched[0]["formality_hint"]
        assert "ナチュラル" in enriched[1]["formality_hint"]
        assert "華やか" in enriched[2]["formality_hint"]


# ---------- _parse_manual_schedule tests ----------


class TestParseManualSchedule:
    """Tests for manual schedule text parsing."""

    def test_single_event(self):
        events = _parse_manual_schedule("午後3時から会議")
        assert len(events) == 1
        assert events[0]["title"] == "午後3時から会議"

    def test_comma_separated(self):
        events = _parse_manual_schedule("午前に会議、午後はランチ、夜はディナー")
        assert len(events) == 3
        assert events[0]["title"] == "午前に会議"
        assert events[1]["title"] == "午後はランチ"
        assert events[2]["title"] == "夜はディナー"

    def test_newline_separated(self):
        events = _parse_manual_schedule("朝ジム\n昼会議\n夜デート")
        assert len(events) == 3

    def test_empty_string(self):
        events = _parse_manual_schedule("")
        assert len(events) == 0

    def test_whitespace_only(self):
        events = _parse_manual_schedule("   ")
        assert len(events) == 0


# ---------- get_today_schedule tool tests ----------


class TestGetTodaySchedule:
    """Tests for the main get_today_schedule tool function."""

    def _make_context(self, state: dict) -> MagicMock:
        ctx = MagicMock()
        ctx.state = state
        return ctx

    def test_no_schedule_returns_empty(self):
        ctx = self._make_context({"user:id": "user123"})
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["events"] == []
        assert "note" in result
        assert "suggestion" in result

    def test_manual_schedule_from_state(self):
        ctx = self._make_context({
            "user:id": "user123",
            "user:manual_schedule": "午後3時から会議、夜はディナー",
        })
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["source"] == "manual"
        assert result["event_count"] == 2
        assert any("会議" in e["title"] for e in result["events"])

    def test_chat_schedule_string(self):
        ctx = self._make_context({
            "user:id": "user123",
            "user:today_schedule": "午後から会議",
        })
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["source"] == "chat"
        assert result["event_count"] == 1

    def test_chat_schedule_list(self):
        ctx = self._make_context({
            "user:id": "user123",
            "user:today_schedule": [
                {"title": "会議", "time": "14:00"},
                {"title": "ディナー", "time": "19:00"},
            ],
        })
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["source"] == "chat"
        assert result["event_count"] == 2

    def test_manual_schedule_has_formality_hints(self):
        ctx = self._make_context({
            "user:id": "user123",
            "user:manual_schedule": "午後から会議",
        })
        result = get_today_schedule(ctx)

        assert result["events"][0]["formality_hint"] != ""

    @patch("alcheme.tools.calendar_tools._get_firestore")
    @patch("alcheme.tools.calendar_tools._fetch_google_calendar_events")
    def test_google_calendar_connected(self, mock_fetch, mock_fs):
        """When Google Calendar is connected, fetches events from API."""
        mock_fetch.return_value = [
            {"title": "Team Meeting", "time": "10:00", "location": "", "is_all_day": False},
        ]

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "calendarIntegration": {
                "connected": True,
                "accessToken": "access-123",
                "refreshToken": "refresh-456",
                "selectedCalendars": ["primary"],
            }
        }
        mock_fs.return_value.collection.return_value.document.return_value.get.return_value = mock_doc

        ctx = self._make_context({
            "user:id": "user123",
            "user:calendar_connected": True,
        })
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["source"] == "google_calendar"
        assert result["event_count"] == 1
        mock_fetch.assert_called_once()

    @patch("alcheme.tools.calendar_tools._get_firestore")
    @patch("alcheme.tools.calendar_tools._fetch_google_calendar_events")
    def test_google_calendar_fails_falls_back_to_manual(self, mock_fetch, mock_fs):
        """If Google Calendar fetch fails, falls back to manual schedule."""
        mock_fetch.side_effect = Exception("API error")

        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "calendarIntegration": {
                "connected": True,
                "accessToken": "access-123",
                "refreshToken": "refresh-456",
                "selectedCalendars": ["primary"],
            }
        }
        mock_fs.return_value.collection.return_value.document.return_value.get.return_value = mock_doc

        ctx = self._make_context({
            "user:id": "user123",
            "user:calendar_connected": True,
            "user:manual_schedule": "バックアップ予定",
        })
        result = get_today_schedule(ctx)

        assert result["status"] == "success"
        assert result["source"] == "manual"

    def test_priority_order_google_over_manual(self):
        """Google Calendar takes priority over manual schedule."""
        # When calendar_connected is False, should use manual
        ctx = self._make_context({
            "user:id": "user123",
            "user:calendar_connected": False,
            "user:manual_schedule": "手動入力",
            "user:today_schedule": "チャット入力",
        })
        result = get_today_schedule(ctx)
        assert result["source"] == "manual"

    def test_priority_order_manual_over_chat(self):
        """Manual schedule takes priority over chat-set schedule."""
        ctx = self._make_context({
            "user:id": "user123",
            "user:manual_schedule": "手動入力",
            "user:today_schedule": "チャット入力",
        })
        result = get_today_schedule(ctx)
        assert result["source"] == "manual"
