// GET /api/calendar/list — ユーザーの Google Calendar 一覧取得

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import {
  getValidAccessToken,
  fetchCalendarList,
} from "@/lib/api/google-calendar";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenResult = await getValidAccessToken(userId);
  if (!tokenResult) {
    return NextResponse.json({ calendars: [], connected: false });
  }

  try {
    const calendars = await fetchCalendarList(tokenResult.accessToken);
    return NextResponse.json({
      calendars,
      connected: true,
      selectedCalendars: tokenResult.integration.selectedCalendars,
    });
  } catch (error) {
    console.error("Calendar list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar list" },
      { status: 500 },
    );
  }
}
