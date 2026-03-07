"use client";

import Link from "next/link";
import { CalendarHeart, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { BeautyLogEntry } from "@/types/beauty-log";

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊", 落ち着き: "😌", ウキウキ: "🥰", 疲れ: "😤",
};

export function BeautyLogPreview() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data, isLoading } = useSWR<{ logs: BeautyLogEntry[]; count: number }>(
    `/api/beauty-log?month=${month}`,
    fetcher
  );

  const logs = data?.logs ?? [];
  const loggedDates = new Set(logs.map((l) => new Date(l.date + "T00:00:00").getDate()));

  // Mini calendar for current month
  const year = now.getFullYear();
  const monthNum = now.getMonth();
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum, 1).getDay();
  const today = now.getDate();

  // Recent 3 logs (sorted by date desc)
  const recentLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="bg-white/60 rounded-2xl border border-white/80 p-4 animate-pulse">
          <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4">
      <div className="bg-white/60 rounded-2xl border border-white/80 p-4 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarHeart className="h-4 w-4 text-neon-accent" />
            <h3 className="text-sm font-bold text-text-ink">Beauty Log</h3>
            <span className="text-[10px] text-text-muted">{logs.length}件の記録</span>
          </div>
          <Link
            href="/beauty-log"
            className="flex items-center gap-0.5 text-xs text-neon-accent font-bold hover:underline"
          >
            もっと見る
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Mini Calendar */}
        <div className="mb-3">
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["日", "月", "火", "水", "木", "金", "土"].map((d) => (
              <div key={d} className="text-[9px] text-text-muted font-bold py-0.5">{d}</div>
            ))}
            {/* Empty cells for first week offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasLog = loggedDates.has(day);
              const isToday = day === today;
              return (
                <div
                  key={day}
                  className="relative flex items-center justify-center h-6"
                >
                  <span className={`text-[10px] ${isToday ? "font-bold text-text-ink" : "text-text-muted"}`}>
                    {day}
                  </span>
                  {hasLog && (
                    <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-neon-accent" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent entries */}
        {recentLogs.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-3">
            {recentLogs.map((log) => {
              const dateObj = new Date(log.date + "T00:00:00");
              const dateLabel = dateObj.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
              return (
                <Link
                  key={log.id}
                  href={`/beauty-log/${log.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/80 transition"
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {(log.preview_image_url || (log.photos && log.photos.length > 0)) ? (
                      <img
                        src={log.preview_image_url || log.photos?.[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {log.mood ? (MOOD_EMOJI[log.mood] || "✨") : "✨"}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-text-ink truncate">
                      {dateLabel} {log.mood && MOOD_EMOJI[log.mood]}
                    </p>
                    {log.user_note && (
                      <p className="text-[10px] text-text-muted truncate">{log.user_note}</p>
                    )}
                  </div>
                  {/* Rating */}
                  {log.self_rating && (
                    <span className="text-xs font-bold text-neon-accent flex-shrink-0">
                      {"★".repeat(log.self_rating)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {logs.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-text-muted">今月の記録はまだありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
