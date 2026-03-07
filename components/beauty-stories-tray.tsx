"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useWeeklyLogs } from "@/hooks/use-weekly-logs";
import type { BeautyLogEntry } from "@/types/beauty-log";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface DaySlot {
  date: string;
  weekday: string;
  isToday: boolean;
  log: BeautyLogEntry | null;
}

export function BeautyStoriesTray() {
  const { logs, isLoading } = useWeeklyLogs(7);

  const days = useMemo((): DaySlot[] => {
    const logMap = new Map(logs.map((l) => [l.date, l]));
    const today = new Date();
    const result: DaySlot[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      result.push({
        date: dateStr,
        weekday: WEEKDAY_LABELS[d.getDay()],
        isToday: i === 0,
        log: logMap.get(dateStr) ?? null,
      });
    }

    return result;
  }, [logs]);

  if (isLoading) return null;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1">
        {/* Add button */}
        <Link
          href="/beauty-log?new=true"
          className="flex flex-col items-center gap-1 shrink-0"
        >
          <div className="w-14 h-14 rounded-full bg-linear-to-br from-alcheme-rose/10 to-alcheme-gold/10 border-2 border-dashed border-alcheme-rose/30 flex items-center justify-center">
            <Plus className="h-5 w-5 text-alcheme-rose" />
          </div>
          <span className="text-[10px] text-text-muted">記録</span>
        </Link>

        {/* Day circles */}
        {days.map((day) => (
          <Link
            key={day.date}
            href={day.log ? `/beauty-log/${day.log.id}` : `/beauty-log?date=${day.date}`}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            {day.log ? (
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-alcheme-rose to-alcheme-gold p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  {day.log.photos?.[0] || day.log.preview_image_url ? (
                    <img
                      src={day.log.photos?.[0] || day.log.preview_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-alcheme-rose/10">
                      <span className="text-lg">
                        {"★".repeat(day.log.self_rating ?? 0).slice(0, 1) || "💄"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-gray-200 flex items-center justify-center">
                <span className="text-xs text-text-muted">{day.weekday}</span>
              </div>
            )}
            <span
              className={`text-[10px] ${
                day.isToday ? "text-alcheme-rose font-bold" : "text-text-muted"
              }`}
            >
              {day.isToday ? "今日" : day.weekday}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
