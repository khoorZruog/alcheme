import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar";

interface Props {
  events: CalendarEvent[];
  eventSource: "google_calendar" | "manual" | "none";
}

export function CalendarEventsPreview({ events, eventSource }: Props) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-text-muted py-2">
        今日の予定はありません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        {eventSource === "google_calendar"
          ? "Google カレンダーから取得"
          : "手動入力"}
      </p>
      {events.map((event) => (
        <div
          key={event.id}
          className="glass-card rounded-xl p-3 space-y-1"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 text-neon-accent shrink-0" />
            <span className="text-sm font-medium text-text-ink truncate">
              {event.title}
            </span>
          </div>
          {!event.isAllDay && event.startTime !== "allDay" && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {formatTime(event.startTime)}
                {event.endTime && ` – ${formatTime(event.endTime)}`}
              </span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
