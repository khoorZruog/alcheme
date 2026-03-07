"""Calendar tools for the TPO Tactician agent.

Fetches today's schedule from Google Calendar API (if connected),
manual input, or user session state.
Tokens are stored in Firestore users/{userId}.calendarIntegration.

Docstrings are used as tool descriptions by ADK.
"""

import datetime
import logging
import os
from typing import Any

from google.adk.tools import ToolContext
from google.cloud import firestore as firestore_lib
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firestore client (lazy init, same pattern as weather_tools)
# ---------------------------------------------------------------------------

_firestore_db: firestore_lib.Client | None = None


def _get_firestore() -> firestore_lib.Client:
    global _firestore_db
    if _firestore_db is None:
        _firestore_db = firestore_lib.Client()
    return _firestore_db


# ---------------------------------------------------------------------------
# Occasion → formality mapping for beauty advice
# ---------------------------------------------------------------------------

_FORMALITY_HINTS: dict[str, str] = {
    "会議": "フォーマル寄り：落ち着いたカラー、マット仕上げ推奨",
    "ミーティング": "フォーマル寄り：落ち着いたカラー、マット仕上げ推奨",
    "meeting": "フォーマル寄り：落ち着いたカラー、マット仕上げ推奨",
    "プレゼン": "きちんと感：ベースメイクしっかり、リップは上品な色味",
    "面接": "清潔感重視：ナチュラルメイク、派手な色味は控えめに",
    "デート": "柔らかい印象：ピンク系やコーラル系がおすすめ、ツヤ肌仕上げ",
    "パーティー": "華やかに：ラメやグリッター、大胆なリップカラーも◎",
    "飲み会": "崩れにくさ重視：ティントリップ＋セッティングパウダー",
    "ランチ": "ナチュラル：軽めのベースにポイントメイクで十分",
    "ジム": "最小限メイク：眉＋リップ程度、ウォータープルーフ推奨",
    "在宅": "気分転換に軽めのメイク：リップだけでも気分アップ",
    "ディナー": "上品で華やか：ツヤ肌ベース、目元をしっかりめに",
    "結婚式": "華やかかつ上品：ラメ控えめ、品のあるリップカラー",
    "授業参観": "きちんと清潔感：ナチュラルベース、主張しすぎない色味",
}


# ---------------------------------------------------------------------------
# Google Calendar API integration
# ---------------------------------------------------------------------------


def _fetch_google_calendar_events(
    access_token: str,
    refresh_token: str,
    calendar_ids: list[str],
    user_id: str,
) -> list[dict[str, Any]]:
    """Fetch today's events from Google Calendar API.

    Uses google-auth Credentials for automatic token refresh.
    Updates Firestore if the token was refreshed.
    """
    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CALENDAR_CLIENT_ID", ""),
        client_secret=os.environ.get("GOOGLE_CALENDAR_CLIENT_SECRET", ""),
    )

    service = build("calendar", "v3", credentials=creds, cache_discovery=False)

    # JST start/end of day
    jst = datetime.timezone(datetime.timedelta(hours=9))
    now = datetime.datetime.now(jst)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + datetime.timedelta(days=1)

    events: list[dict[str, Any]] = []
    for cal_id in calendar_ids:
        try:
            result = (
                service.events()
                .list(
                    calendarId=cal_id,
                    timeMin=start_of_day.isoformat(),
                    timeMax=end_of_day.isoformat(),
                    singleEvents=True,
                    orderBy="startTime",
                    maxResults=20,
                )
                .execute()
            )

            for item in result.get("items", []):
                start = item.get("start", {})
                is_all_day = "date" in start and "dateTime" not in start

                # Format time for display
                if is_all_day:
                    time_str = "終日"
                else:
                    try:
                        dt = datetime.datetime.fromisoformat(
                            start.get("dateTime", "")
                        )
                        time_str = dt.strftime("%H:%M")
                    except (ValueError, TypeError):
                        time_str = start.get("dateTime", "")

                events.append(
                    {
                        "title": item.get("summary", "（タイトルなし）"),
                        "time": time_str,
                        "location": item.get("location", ""),
                        "is_all_day": is_all_day,
                    }
                )
        except Exception as e:
            logger.warning(
                "Failed to fetch events from calendar %s: %s", cal_id, e
            )

    # If the token was refreshed, update Firestore
    if creds.token != access_token:
        try:
            db = _get_firestore()
            db.collection("users").document(user_id).update(
                {
                    "calendarIntegration.accessToken": creds.token,
                    "calendarIntegration.tokenExpiry": (
                        creds.expiry.isoformat() if creds.expiry else ""
                    ),
                    "calendarIntegration.lastSyncAt": datetime.datetime.now(
                        datetime.timezone.utc
                    ).isoformat(),
                }
            )
            logger.info("Refreshed calendar token for user %s", user_id)
        except Exception as e:
            logger.warning("Failed to update refreshed token: %s", e)

    # Sort by time
    events.sort(key=lambda e: e.get("time", ""))
    return events


# ---------------------------------------------------------------------------
# Enrichment helpers
# ---------------------------------------------------------------------------


def _enrich_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Add formality hints to events based on title keywords."""
    enriched = []
    for event in events:
        title = event.get("title", "")
        hint = ""
        for keyword, advice in _FORMALITY_HINTS.items():
            if keyword.lower() in title.lower():
                hint = advice
                break
        enriched.append({**event, "formality_hint": hint})
    return enriched


def _parse_manual_schedule(schedule: str) -> list[dict[str, Any]]:
    """Parse a free-text manual schedule into event dicts."""
    # Split by common delimiters
    parts = [p.strip() for p in schedule.replace("、", "\n").split("\n") if p.strip()]
    events = []
    for part in parts:
        events.append({"title": part, "time": "終日", "is_all_day": True})
    return events


# ---------------------------------------------------------------------------
# Main tool function
# ---------------------------------------------------------------------------


def get_today_schedule(tool_context: ToolContext) -> dict:
    """Get today's schedule for TPO-aware makeup recommendations.

    Fetches the user's schedule from Google Calendar (if connected),
    manual input, or session state. Use this to understand what occasions
    the user has today and recommend appropriate makeup styles.

    Returns:
        dict with today's events, source, and formality hints.
    """
    try:
        user_id = tool_context.state.get("user:id")

        # Strategy 1: Google Calendar (if connected)
        if user_id and tool_context.state.get("user:calendar_connected"):
            try:
                db = _get_firestore()
                doc = db.collection("users").document(user_id).get()
                if doc.exists:
                    cal = (doc.to_dict() or {}).get("calendarIntegration", {})
                    if cal.get("connected") and cal.get("accessToken"):
                        raw_events = _fetch_google_calendar_events(
                            access_token=cal["accessToken"],
                            refresh_token=cal.get("refreshToken", ""),
                            calendar_ids=cal.get(
                                "selectedCalendars", ["primary"]
                            ),
                            user_id=user_id,
                        )
                        enriched = _enrich_events(raw_events)
                        return {
                            "status": "success",
                            "events": enriched,
                            "event_count": len(enriched),
                            "source": "google_calendar",
                        }
            except Exception as e:
                logger.warning("Google Calendar fetch failed: %s", e)

        # Strategy 2: Manual schedule (from settings)
        manual = tool_context.state.get("user:manual_schedule")
        if manual:
            events = _parse_manual_schedule(manual)
            enriched = _enrich_events(events)
            return {
                "status": "success",
                "events": enriched,
                "event_count": len(enriched),
                "source": "manual",
            }

        # Strategy 3: Session state (set by user in chat)
        schedule = tool_context.state.get("user:today_schedule")
        if schedule:
            if isinstance(schedule, str):
                events = [{"title": schedule, "time": "終日"}]
            elif isinstance(schedule, list):
                events = schedule
            else:
                events = [schedule] if isinstance(schedule, dict) else []
            enriched = _enrich_events(events)
            return {
                "status": "success",
                "events": enriched,
                "event_count": len(enriched),
                "source": "chat",
            }

        # Strategy 4: No schedule available
        return {
            "status": "success",
            "events": [],
            "note": (
                "今日の予定は登録されていません。"
                "予定を教えていただければ、シーンに合ったメイクを提案できます！"
            ),
            "suggestion": (
                "「今日は午後から会議がある」のように教えてください。"
                "設定画面からGoogle カレンダーを連携すると、自動で予定を取得できます。"
            ),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"予定の取得に失敗しました: {e}",
        }
