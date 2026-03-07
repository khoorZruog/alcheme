"use client";

import { useMemo } from "react";
import type { BeautyLogEntry } from "@/types/beauty-log";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// Beauty Palette: cell background colors by rating (Daylio Year in Pixels inspired)
const RATING_BG: Record<number, string> = {
  1: "bg-gray-200",
  2: "bg-gray-300",
  3: "bg-alcheme-gold/30",
  4: "bg-alcheme-rose/30",
  5: "bg-alcheme-rose/60",
};

// Rating ring colors for cells with images
const RATING_RING: Record<number, string> = {
  1: "ring-gray-300",
  2: "ring-gray-400",
  3: "ring-alcheme-gold/50",
  4: "ring-alcheme-rose/50",
  5: "ring-alcheme-rose",
};

interface BeautyLogCalendarProps {
  year: number;
  month: number; // 1-12
  logs: BeautyLogEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: string) => void;
}

function computeMonthStats(logs: BeautyLogEntry[]) {
  if (logs.length === 0) return null;

  const daysRecorded = new Set(logs.map((l) => l.date)).size;
  const rated = logs.filter((l) => l.self_rating);
  const avgRating =
    rated.length > 0
      ? Math.round((rated.reduce((s, l) => s + l.self_rating!, 0) / rated.length) * 10) / 10
      : null;

  // Best streak within the month
  const dates = [...new Set(logs.map((l) => l.date))].sort();
  let bestStreak = 0;
  let streak = 0;
  let prev = "";
  for (const date of dates) {
    if (prev) {
      const prevDate = new Date(prev + "T00:00:00");
      prevDate.setDate(prevDate.getDate() + 1);
      const next = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
      streak = date === next ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    bestStreak = Math.max(bestStreak, streak);
    prev = date;
  }

  return { daysRecorded, avgRating, bestStreak };
}

export function BeautyLogCalendar({
  year,
  month,
  logs,
  onPrevMonth,
  onNextMonth,
  onDateClick,
}: BeautyLogCalendarProps) {
  const logsByDate = useMemo(() => {
    const map = new Map<string, BeautyLogEntry>();
    for (const log of logs) {
      map.set(log.date, log);
    }
    return map;
  }, [logs]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cells: Array<{
      day: number | null;
      dateStr: string;
      isToday: boolean;
      log: BeautyLogEntry | undefined;
    }> = [];

    // Leading blanks
    for (let i = 0; i < startDow; i++) {
      cells.push({ day: null, dateStr: "", isToday: false, log: undefined });
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        log: logsByDate.get(dateStr),
      });
    }

    return cells;
  }, [year, month, logsByDate]);

  const monthLabel = `${year}年${month}月`;
  const stats = useMemo(() => computeMonthStats(logs), [logs]);

  return (
    <div className="px-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={onPrevMonth}
          className="p-2 text-alcheme-muted hover:text-alcheme-charcoal transition-colors"
          aria-label="前月"
        >
          &lt;
        </button>
        <h2 className="text-sm font-medium text-alcheme-charcoal">{monthLabel}</h2>
        <button
          onClick={onNextMonth}
          className="p-2 text-alcheme-muted hover:text-alcheme-charcoal transition-colors"
          aria-label="翌月"
        >
          &gt;
        </button>
      </div>

      {/* Monthly summary */}
      {stats && (
        <div className="flex items-center justify-center gap-3 mb-2 text-xs text-text-muted">
          <span>
            📝 <span className="font-medium text-text-ink">{stats.daysRecorded}</span>日記録
          </span>
          {stats.avgRating != null && (
            <span>
              ⭐ <span className="font-medium text-text-ink">{stats.avgRating}</span>
            </span>
          )}
          {stats.bestStreak >= 2 && (
            <span>
              🔥 最長<span className="font-medium text-text-ink">{stats.bestStreak}</span>日連続
            </span>
          )}
        </div>
      )}

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-[10px] font-medium ${
              i === 0 ? "text-alcheme-rose" : i === 6 ? "text-blue-400" : "text-alcheme-muted"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid — Beauty Palette */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, i) => {
          const hasImage = cell.log?.preview_image_url;
          const rating = cell.log?.self_rating;

          return (
            <button
              key={i}
              disabled={cell.day === null}
              onClick={() => cell.dateStr && onDateClick(cell.dateStr)}
              className={`relative flex flex-col items-center justify-center rounded-lg text-xs transition-all overflow-hidden ${
                hasImage ? "h-14" : "h-10"
              } ${
                cell.day === null
                  ? ""
                  : cell.isToday
                    ? "ring-2 ring-neon-accent font-bold text-alcheme-rose"
                    : "hover:bg-gray-50 text-alcheme-charcoal"
              } ${
                cell.log && !hasImage && rating
                  ? RATING_BG[rating] ?? ""
                  : ""
              }`}
            >
              {cell.day !== null && (
                <>
                  {hasImage ? (
                    <>
                      <img
                        src={cell.log!.preview_image_url}
                        alt=""
                        className={`absolute inset-0 w-full h-full object-cover rounded-lg ${
                          rating ? `ring-2 ${RATING_RING[rating] ?? ""}` : ""
                        }`}
                      />
                      <div className="absolute inset-0 bg-black/20" />
                      <span className="relative z-10 text-white font-bold text-[11px] drop-shadow-sm">
                        {cell.day}
                      </span>
                    </>
                  ) : (
                    <span className={cell.log ? "font-medium" : ""}>
                      {cell.day}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
