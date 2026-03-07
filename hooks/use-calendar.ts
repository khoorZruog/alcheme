"use client";

import useSWR from "swr";
import { useCallback, useState } from "react";
import { fetcher } from "@/lib/api/fetcher";
import type {
  GoogleCalendarEntry,
  TodayEventsResponse,
} from "@/types/calendar";

interface CalendarListResponse {
  calendars: GoogleCalendarEntry[];
  connected: boolean;
  selectedCalendars: string[];
}

export function useCalendar() {
  const {
    data: listData,
    mutate: mutateList,
  } = useSWR<CalendarListResponse>("/api/calendar/list", fetcher);

  const {
    data: eventsData,
    mutate: mutateEvents,
  } = useSWR<TodayEventsResponse>("/api/calendar/events", fetcher);

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const connected = listData?.connected ?? false;
  const calendars = listData?.calendars ?? [];
  const selectedCalendars = listData?.selectedCalendars ?? [];
  const events = eventsData?.events ?? [];
  const eventSource = eventsData?.source ?? "none";

  /** Start Google Calendar OAuth flow */
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/auth/google-calendar");
      if (!res.ok) throw new Error("Failed to get auth URL");
      const { authUrl } = await res.json();
      window.location.href = authUrl;
    } catch {
      setConnecting(false);
    }
  }, []);

  /** Disconnect Google Calendar */
  const disconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google-calendar/disconnect", {
        method: "DELETE",
      });
      mutateList();
      mutateEvents();
    } finally {
      setDisconnecting(false);
    }
  }, [mutateList, mutateEvents]);

  /** Update selected calendars */
  const selectCalendars = useCallback(
    async (ids: string[]) => {
      await fetch("/api/calendar/select", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedCalendars: ids }),
      });
      mutateList();
      mutateEvents();
    },
    [mutateList, mutateEvents],
  );

  return {
    connected,
    connecting,
    disconnecting,
    calendars,
    selectedCalendars,
    events,
    eventSource,
    connect,
    disconnect,
    selectCalendars,
    mutateEvents,
  };
}
