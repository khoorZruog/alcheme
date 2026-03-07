/**
 * Google Calendar OAuth 2.0 ヘルパー関数
 *
 * 外部依存なし — raw fetch で Google OAuth/Calendar API を直接呼ぶ。
 * BFF (Next.js API Routes) 専用。
 */

import { adminDb } from "@/lib/firebase/admin";
import type {
  CalendarIntegration,
  GoogleCalendarEntry,
  CalendarEvent,
} from "@/types/calendar";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly",
].join(" ");

function clientId() {
  return process.env.GOOGLE_CALENDAR_CLIENT_ID ?? "";
}
function clientSecret() {
  return process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? "";
}
function redirectUri() {
  return process.env.GOOGLE_CALENDAR_REDIRECT_URI ?? "";
}

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

/** Generate Google OAuth 2.0 authorization URL */
export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/** Exchange authorization code for access + refresh tokens */
export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  return res.json();
}

/** Refresh an expired access token */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }
  return res.json();
}

/** Revoke a token (access or refresh) */
export async function revokeToken(token: string): Promise<void> {
  await fetch(`${GOOGLE_REVOKE_ENDPOINT}?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  // Best-effort — ignore failures (token may already be invalid)
}

// ---------------------------------------------------------------------------
// Token management (Firestore)
// ---------------------------------------------------------------------------

/**
 * Get a valid access token for a user, refreshing if needed.
 * Returns null if user has no calendar integration.
 */
export async function getValidAccessToken(
  userId: string,
): Promise<{ accessToken: string; integration: CalendarIntegration } | null> {
  const doc = await adminDb.collection("users").doc(userId).get();
  if (!doc.exists) return null;

  const cal = doc.data()?.calendarIntegration as
    | CalendarIntegration
    | undefined;
  if (!cal?.connected || !cal.accessToken) return null;

  // Check if token is expired (5-minute buffer)
  const expiryMs = new Date(cal.tokenExpiry).getTime();
  const now = Date.now();
  if (expiryMs - now > 5 * 60 * 1000) {
    return { accessToken: cal.accessToken, integration: cal };
  }

  // Refresh token
  try {
    const tokens = await refreshAccessToken(cal.refreshToken);
    const newExpiry = new Date(
      Date.now() + tokens.expires_in * 1000,
    ).toISOString();

    const updated: Partial<CalendarIntegration> = {
      accessToken: tokens.access_token,
      tokenExpiry: newExpiry,
      lastSyncAt: new Date().toISOString(),
    };

    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        "calendarIntegration.accessToken": updated.accessToken,
        "calendarIntegration.tokenExpiry": updated.tokenExpiry,
        "calendarIntegration.lastSyncAt": updated.lastSyncAt,
      });

    return {
      accessToken: tokens.access_token,
      integration: { ...cal, ...updated } as CalendarIntegration,
    };
  } catch {
    // Refresh failed — mark as disconnected
    await adminDb.collection("users").doc(userId).update({
      "calendarIntegration.connected": false,
    });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Calendar API helpers
// ---------------------------------------------------------------------------

/** Fetch the user's calendar list */
export async function fetchCalendarList(
  accessToken: string,
): Promise<GoogleCalendarEntry[]> {
  const res = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Calendar list fetch failed: ${res.status}`);
  }
  const data = await res.json();
  return (data.items ?? []).map(
    (item: Record<string, unknown>): GoogleCalendarEntry => ({
      id: item.id as string,
      summary: (item.summary as string) ?? "",
      backgroundColor: (item.backgroundColor as string) ?? "#4285f4",
      primary: (item.primary as boolean) ?? false,
      accessRole: (item.accessRole as string) ?? "reader",
    }),
  );
}

/** Fetch today's events from selected calendars */
export async function fetchTodayEvents(
  accessToken: string,
  calendarIds: string[],
): Promise<CalendarEvent[]> {
  // JST (UTC+9) start/end of day
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstNow = new Date(now.getTime() + jstOffset);
  const startOfDay = new Date(jstNow);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Shift back to UTC for API query
  const timeMin = new Date(startOfDay.getTime() - jstOffset).toISOString();
  const timeMax = new Date(endOfDay.getTime() - jstOffset).toISOString();

  const events: CalendarEvent[] = [];

  for (const calId of calendarIds) {
    try {
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "20",
      });
      const res = await fetch(
        `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calId)}/events?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.items ?? []) {
        const start = item.start ?? {};
        const end = item.end ?? {};
        const isAllDay = !!start.date && !start.dateTime;
        events.push({
          id: item.id ?? "",
          title: item.summary ?? "(タイトルなし)",
          startTime: start.dateTime ?? start.date ?? "",
          endTime: end.dateTime ?? end.date ?? "",
          location: item.location,
          isAllDay,
        });
      }
    } catch {
      // Skip failing calendar, continue with others
    }
  }

  // Sort by start time
  events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return events;
}
