// GET /api/calendar/events — 今日のイベントプレビュー
//
// Google Calendar 連携済み → API から取得
// 手動スケジュールのみ → manual として返却
// どちらもなし → 空配列

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  getValidAccessToken,
  fetchTodayEvents,
} from "@/lib/api/google-calendar";
import type { TodayEventsResponse, CalendarEvent } from "@/types/calendar";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Try Google Calendar first
    const tokenResult = await getValidAccessToken(userId);
    if (tokenResult) {
      const calendarIds = tokenResult.integration.selectedCalendars;
      if (calendarIds.length > 0) {
        const events = await fetchTodayEvents(
          tokenResult.accessToken,
          calendarIds,
        );
        const resp: TodayEventsResponse = {
          events,
          source: "google_calendar",
          calendarConnected: true,
        };
        return NextResponse.json(resp);
      }
    }

    // Fall back to manual schedule
    const doc = await adminDb.collection("users").doc(userId).get();
    const manualSchedule = doc.data()?.manualSchedule as string | undefined;

    if (manualSchedule) {
      const manualEvent: CalendarEvent = {
        id: "manual-1",
        title: manualSchedule,
        startTime: "allDay",
        endTime: "allDay",
        isAllDay: true,
      };
      const resp: TodayEventsResponse = {
        events: [manualEvent],
        source: "manual",
        calendarConnected: !!tokenResult,
      };
      return NextResponse.json(resp);
    }

    // No schedule
    const resp: TodayEventsResponse = {
      events: [],
      source: "none",
      calendarConnected: false,
    };
    return NextResponse.json(resp);
  } catch (error) {
    console.error("Calendar events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
