import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCalendar } from "@/hooks/use-calendar";

// Mock SWR
vi.mock("swr", () => ({
  default: vi.fn((key: string) => {
    if (key === "/api/calendar/list") {
      return {
        data: {
          calendars: [
            { id: "primary", summary: "My Calendar", backgroundColor: "#4285f4", primary: true, accessRole: "owner" },
          ],
          connected: true,
          selectedCalendars: ["primary"],
        },
        mutate: vi.fn(),
      };
    }
    if (key === "/api/calendar/events") {
      return {
        data: {
          events: [
            { id: "e1", title: "会議", startTime: "2026-03-07T14:00:00+09:00", endTime: "2026-03-07T15:00:00+09:00", isAllDay: false },
          ],
          source: "google_calendar" as const,
          calendarConnected: true,
        },
        mutate: vi.fn(),
      };
    }
    return { data: undefined, mutate: vi.fn() };
  }),
}));

// Mock fetcher
vi.mock("@/lib/api/fetcher", () => ({
  fetcher: vi.fn(),
}));

describe("useCalendar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    }));
  });

  it("returns connected state from SWR data", () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.connected).toBe(true);
    expect(result.current.calendars).toHaveLength(1);
    expect(result.current.selectedCalendars).toEqual(["primary"]);
  });

  it("returns events from SWR data", () => {
    const { result } = renderHook(() => useCalendar());
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0].title).toBe("会議");
    expect(result.current.eventSource).toBe("google_calendar");
  });

  it("connect() fetches auth URL and triggers redirect", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ authUrl: "https://accounts.google.com/auth?..." }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useCalendar());

    // connect() sets window.location.href which jsdom doesn't fully support;
    // verify the fetch was called correctly
    await act(async () => {
      try {
        await result.current.connect();
      } catch {
        // jsdom may throw on location assignment
      }
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/google-calendar");
  });

  it("disconnect() calls DELETE endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useCalendar());

    await act(async () => {
      await result.current.disconnect();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/google-calendar/disconnect", {
      method: "DELETE",
    });
  });

  it("selectCalendars() sends PATCH with selected IDs", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useCalendar());

    await act(async () => {
      await result.current.selectCalendars(["primary", "work"]);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/calendar/select", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedCalendars: ["primary", "work"] }),
    });
  });
});
