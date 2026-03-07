"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useWeather } from "@/hooks/use-weather";
import { useWeeklyLogs } from "@/hooks/use-weekly-logs";
import type { BeautyLogEntry } from "@/types/beauty-log";

const WEATHER_EMOJI: Record<string, string> = {
  晴れ: "☀️",
  曇り: "☁️",
  雨: "🌧️",
  雪: "❄️",
};

function computeStreak(logs: BeautyLogEntry[]): number {
  if (logs.length === 0) return 0;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let expected = todayStr;
  for (const log of sorted) {
    if (log.date === expected) {
      streak++;
      const d = new Date(expected + "T00:00:00");
      d.setDate(d.getDate() - 1);
      expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (log.date < expected) {
      break;
    }
  }
  return streak;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ChatContextStrip() {
  const { data: weatherData, isLoading: weatherLoading } = useWeather();
  const { logs, isLoading: logsLoading } = useWeeklyLogs(7);

  const streak = useMemo(() => computeStreak(logs), [logs]);

  const days = useMemo(() => {
    const logDates = new Set(logs.map((l) => l.date));
    const today = new Date();
    const result: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      result.push(logDates.has(formatDate(d)));
    }
    return result;
  }, [logs]);

  if (weatherLoading && logsLoading) return null;

  const hasWeather = weatherData.weather !== null;
  const hasStreak = streak > 0;
  const hasDots = logs.length > 0;

  if (!hasWeather && !hasStreak && !hasDots) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-2 py-1 mb-2"
    >
      {/* Weather pill */}
      {hasWeather && (
        <Link
          href="/beauty-log"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 text-xs hover:bg-white/70 transition-colors"
        >
          <span>{WEATHER_EMOJI[weatherData.weather!] ?? "🌤️"}</span>
          <span className="font-medium text-text-ink">{weatherData.temp}°C</span>
          {weatherData.humidity != null && (
            <span className="text-text-muted">湿度{weatherData.humidity}%</span>
          )}
        </Link>
      )}

      {/* Streak pill */}
      {hasStreak && (
        <Link
          href="/beauty-log"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 text-xs hover:bg-white/70 transition-colors"
        >
          <Flame className="h-3 w-3 text-orange-500" />
          <span className="font-bold text-text-ink">{streak}日</span>
        </Link>
      )}

      {/* Weekly log dots with day labels */}
      {hasDots && (
        <Link
          href="/beauty-log"
          className="flex items-center gap-0.5 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 hover:bg-white/70 transition-colors"
        >
          {days.map((logged, i) => {
            const dayLabels = ["月", "火", "水", "木", "金", "土", "日"];
            const today = new Date();
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
            const label = dayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 w-4">
                <span className={`text-[8px] leading-none ${isToday ? "font-bold text-text-ink" : "text-text-muted"}`}>
                  {label}
                </span>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    logged
                      ? "bg-gradient-to-br from-neon-accent to-alcheme-rose"
                      : isToday
                        ? "border border-dashed border-gray-300"
                        : "bg-gray-200"
                  }`}
                />
              </div>
            );
          })}
        </Link>
      )}
    </motion.div>
  );
}
