import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarEventsPreview } from "@/app/(main)/settings/_components/calendar-section";
import type { CalendarEvent } from "@/types/calendar";

describe("CalendarEventsPreview", () => {
  it("shows empty message when no events", () => {
    render(<CalendarEventsPreview events={[]} eventSource="none" />);
    expect(screen.getByText("今日の予定はありません")).toBeDefined();
  });

  it("shows Google Calendar source label", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "会議", startTime: "2026-03-07T14:00:00+09:00", endTime: "2026-03-07T15:00:00+09:00", isAllDay: false },
    ];
    render(<CalendarEventsPreview events={events} eventSource="google_calendar" />);
    expect(screen.getByText("Google カレンダーから取得")).toBeDefined();
    expect(screen.getByText("会議")).toBeDefined();
  });

  it("shows manual source label", () => {
    const events: CalendarEvent[] = [
      { id: "manual-1", title: "午後3時から会議", startTime: "allDay", endTime: "allDay", isAllDay: true },
    ];
    render(<CalendarEventsPreview events={events} eventSource="manual" />);
    expect(screen.getByText("手動入力")).toBeDefined();
    expect(screen.getByText("午後3時から会議")).toBeDefined();
  });

  it("shows location when present", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "ランチ", startTime: "2026-03-07T12:00:00+09:00", endTime: "2026-03-07T13:00:00+09:00", isAllDay: false, location: "渋谷カフェ" },
    ];
    render(<CalendarEventsPreview events={events} eventSource="google_calendar" />);
    expect(screen.getByText("渋谷カフェ")).toBeDefined();
  });

  it("does not show time for all-day events", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "休暇", startTime: "allDay", endTime: "allDay", isAllDay: true },
    ];
    const { container } = render(
      <CalendarEventsPreview events={events} eventSource="google_calendar" />
    );
    // Clock icon should not be present for all-day events
    const timeElements = container.querySelectorAll("[data-testid='event-time']");
    expect(timeElements).toHaveLength(0);
  });

  it("renders multiple events", () => {
    const events: CalendarEvent[] = [
      { id: "1", title: "朝会", startTime: "2026-03-07T09:00:00+09:00", endTime: "2026-03-07T09:30:00+09:00", isAllDay: false },
      { id: "2", title: "ランチ", startTime: "2026-03-07T12:00:00+09:00", endTime: "2026-03-07T13:00:00+09:00", isAllDay: false },
      { id: "3", title: "夕方ミーティング", startTime: "2026-03-07T17:00:00+09:00", endTime: "2026-03-07T18:00:00+09:00", isAllDay: false },
    ];
    render(<CalendarEventsPreview events={events} eventSource="google_calendar" />);
    expect(screen.getByText("朝会")).toBeDefined();
    expect(screen.getByText("ランチ")).toBeDefined();
    expect(screen.getByText("夕方ミーティング")).toBeDefined();
  });
});
