// GET /api/auth/google-calendar/callback — OAuth コールバック
//
// Google OAuth から認証コードを受け取り、トークンに交換して Firestore に保存。
// Settings のカレンダー編集ページにリダイレクト。

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  exchangeCodeForTokens,
  fetchCalendarList,
} from "@/lib/api/google-calendar";
import type { CalendarIntegration } from "@/types/calendar";

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User denied access
  if (error) {
    return NextResponse.redirect(
      new URL("/settings/edit/calendar?error=denied", request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings/edit/calendar?error=missing_params", request.url),
    );
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("calendar_oauth_state")?.value;
  cookieStore.delete("calendar_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/settings/edit/calendar?error=invalid_state", request.url),
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/settings/edit/calendar?error=no_refresh_token", request.url),
      );
    }

    // Fetch calendar list to select primary as default
    const calendars = await fetchCalendarList(tokens.access_token);
    const primaryCalendar = calendars.find((c) => c.primary);
    const defaultSelected = primaryCalendar ? [primaryCalendar.id] : [];

    // Store integration data in Firestore
    const integration: CalendarIntegration = {
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(
        Date.now() + tokens.expires_in * 1000,
      ).toISOString(),
      selectedCalendars: defaultSelected,
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    };

    await adminDb.collection("users").doc(userId).update({
      calendarIntegration: integration,
    });

    return NextResponse.redirect(
      new URL("/settings/edit/calendar?connected=true", request.url),
    );
  } catch (err) {
    console.error("Calendar OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings/edit/calendar?error=token_exchange", request.url),
    );
  }
}
