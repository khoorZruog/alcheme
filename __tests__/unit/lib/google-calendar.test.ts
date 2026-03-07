import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for Google Calendar OAuth helper functions.
 * Tests the URL generation and token exchange logic.
 */

// Mock env vars
vi.stubEnv("GOOGLE_CALENDAR_CLIENT_ID", "test-client-id.apps.googleusercontent.com");
vi.stubEnv("GOOGLE_CALENDAR_CLIENT_SECRET", "test-secret");
vi.stubEnv("GOOGLE_CALENDAR_REDIRECT_URI", "http://localhost:3000/api/auth/google-calendar/callback");

// Mock firebase admin to avoid initialization errors
vi.mock("@/lib/firebase/admin", () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({
        get: vi.fn().mockResolvedValue({ exists: false }),
        update: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

describe("Google Calendar OAuth helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateAuthUrl", () => {
    it("generates a valid Google OAuth URL with required params", async () => {
      const { generateAuthUrl } = await import("@/lib/api/google-calendar");
      const url = generateAuthUrl("test-state-123");

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("client_id=test-client-id.apps.googleusercontent.com");
      expect(url).toContain("response_type=code");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("prompt=consent");
      expect(url).toContain("state=test-state-123");
      expect(url).toContain("calendar.readonly");
      expect(url).toContain("calendar.events.readonly");
    });

    it("includes the redirect URI", async () => {
      const { generateAuthUrl } = await import("@/lib/api/google-calendar");
      const url = generateAuthUrl("state");
      expect(url).toContain(
        encodeURIComponent("http://localhost:3000/api/auth/google-calendar/callback")
      );
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("calls Google token endpoint with correct params", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "access-123",
            refresh_token: "refresh-456",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "calendar.readonly",
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { exchangeCodeForTokens } = await import("@/lib/api/google-calendar");
      const result = await exchangeCodeForTokens("auth-code-789");

      expect(result.access_token).toBe("access-123");
      expect(result.refresh_token).toBe("refresh-456");
      expect(result.expires_in).toBe(3600);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://oauth2.googleapis.com/token");
      expect(options.method).toBe("POST");
      const body = options.body as URLSearchParams;
      expect(body.get("code")).toBe("auth-code-789");
      expect(body.get("grant_type")).toBe("authorization_code");
    });

    it("throws on failed token exchange", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: () => Promise.resolve("invalid_grant"),
        })
      );

      const { exchangeCodeForTokens } = await import("@/lib/api/google-calendar");
      await expect(exchangeCodeForTokens("bad-code")).rejects.toThrow("Token exchange failed");
    });
  });

  describe("fetchCalendarList", () => {
    it("transforms Google Calendar API response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "primary",
                  summary: "My Calendar",
                  backgroundColor: "#4285f4",
                  primary: true,
                  accessRole: "owner",
                },
                {
                  id: "work@group.calendar.google.com",
                  summary: "Work",
                  backgroundColor: "#e67c73",
                  accessRole: "writer",
                },
              ],
            }),
        })
      );

      const { fetchCalendarList } = await import("@/lib/api/google-calendar");
      const calendars = await fetchCalendarList("token-123");

      expect(calendars).toHaveLength(2);
      expect(calendars[0].id).toBe("primary");
      expect(calendars[0].primary).toBe(true);
      expect(calendars[1].summary).toBe("Work");
      expect(calendars[1].primary).toBe(false);
    });
  });

  describe("fetchTodayEvents", () => {
    it("fetches and sorts events from multiple calendars", async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("calendarList")) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
        }
        // Events endpoint
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "event-1",
                  summary: "午後会議",
                  start: { dateTime: "2026-03-07T14:00:00+09:00" },
                  end: { dateTime: "2026-03-07T15:00:00+09:00" },
                },
                {
                  id: "event-2",
                  summary: "朝のミーティング",
                  start: { dateTime: "2026-03-07T09:00:00+09:00" },
                  end: { dateTime: "2026-03-07T10:00:00+09:00" },
                },
              ],
            }),
        });
      });
      vi.stubGlobal("fetch", mockFetch);

      const { fetchTodayEvents } = await import("@/lib/api/google-calendar");
      const events = await fetchTodayEvents("token", ["primary"]);

      expect(events).toHaveLength(2);
      // Should be sorted by start time
      expect(events[0].title).toBe("朝のミーティング");
      expect(events[1].title).toBe("午後会議");
    });

    it("handles all-day events", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              items: [
                {
                  id: "allday-1",
                  summary: "休暇",
                  start: { date: "2026-03-07" },
                  end: { date: "2026-03-08" },
                },
              ],
            }),
        })
      );

      const { fetchTodayEvents } = await import("@/lib/api/google-calendar");
      const events = await fetchTodayEvents("token", ["primary"]);

      expect(events).toHaveLength(1);
      expect(events[0].isAllDay).toBe(true);
      expect(events[0].title).toBe("休暇");
    });
  });
});
