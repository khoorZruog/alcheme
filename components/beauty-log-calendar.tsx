"use client";

import { useMemo } from "react";
import type { BeautyLogEntry } from "@/types/beauty-log";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const RATING_COLORS: Record<number, string> = {
  1: "bg-gray-300",
  2: "bg-alcheme-muted/50",
  3: "bg-alcheme-gold/50",
  4: "bg-alcheme-rose/50",
  5: "bg-alcheme-rose",
};

interface BeautyLogCalendarProps {
  year: number;
  month: number; // 1-12
  logs: BeautyLogEntry[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: string) => void;
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

  return (
    <div className="px-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((cell, i) => (
          <button
            key={i}
            disabled={cell.day === null}
            onClick={() => cell.dateStr && onDateClick(cell.dateStr)}
            className={`relative flex flex-col items-center justify-center h-10 rounded-lg text-xs transition-colors ${
              cell.day === null
                ? ""
                : cell.isToday
                  ? "bg-alcheme-rose/10 font-bold text-alcheme-rose"
                  : "hover:bg-gray-50 text-alcheme-charcoal"
            }`}
          >
            {cell.day !== null && (
              <>
                <span>{cell.day}</span>
                {cell.log && (
                  <div
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                      RATING_COLORS[cell.log.self_rating ?? 3]
                    }`}
                  />
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
