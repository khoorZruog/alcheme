"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flame, TrendingUp, Sparkles } from "lucide-react";
import { useWeeklyLogs } from "@/hooks/use-weekly-logs";
import { computeWeeklyReport } from "@/lib/beauty-log-analytics";

const WEATHER_EMOJI: Record<string, string> = {
  晴れ: "☀️",
  曇り: "☁️",
  雨: "🌧️",
  雪: "❄️",
};

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊",
  落ち着き: "😌",
  ウキウキ: "🥰",
  疲れ: "😤",
};

export function WeeklyBeautyReport() {
  const { logs, isLoading } = useWeeklyLogs(7);

  const report = useMemo(() => computeWeeklyReport(logs), [logs]);

  if (isLoading || logs.length === 0) return null;

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-alcheme-rose" />
          <h3 className="text-sm font-bold text-text-ink">今週のレポート</h3>
        </div>
      </div>

      {/* Summary Row */}
      <div className="px-4 py-2.5 flex items-center gap-4 text-xs">
        <span className="text-text-ink">
          <span className="font-bold text-base">{report.daysRecorded}</span>
          <span className="text-text-muted">/7日</span>
        </span>
        {report.averageRating != null && (
          <span className="text-text-ink flex items-center gap-0.5">
            <span className="text-alcheme-gold">⭐</span>
            <span className="font-bold">{report.averageRating}</span>
          </span>
        )}
        {report.currentStreak > 0 && (
          <span className="flex items-center gap-0.5 text-orange-600">
            <Flame className="h-3.5 w-3.5" />
            <span className="font-bold">{report.currentStreak}日連続</span>
          </span>
        )}
      </div>

      {/* Best Look */}
      {report.topRatedLog && (
        <Link href={`/beauty-log/${report.topRatedLog.id}`}>
          <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
            {(report.topRatedLog.photos?.[0] || report.topRatedLog.preview_image_url) ? (
              <img
                src={report.topRatedLog.photos?.[0] || report.topRatedLog.preview_image_url}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-alcheme-gold/10 flex items-center justify-center shrink-0">
                <span className="text-lg">🏆</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Best Look</p>
              <p className="text-xs font-medium text-text-ink truncate">
                {new Date(report.topRatedLog.date + "T00:00:00").toLocaleDateString("ja-JP", {
                  month: "short",
                  day: "numeric",
                  weekday: "short",
                })}
                {report.topRatedLog.recipe_name && ` — ${report.topRatedLog.recipe_name}`}
              </p>
            </div>
            <span className="text-alcheme-gold font-bold text-sm">
              ★{report.topRatedLog.self_rating}
            </span>
          </div>
        </Link>
      )}

      {/* Insights */}
      {report.insights.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-50 space-y-1">
          {report.insights.slice(0, 3).map((insight, i) => (
            <p key={i} className="text-xs text-text-muted flex items-start gap-1.5">
              <Sparkles className="h-3 w-3 text-alcheme-gold shrink-0 mt-0.5" />
              {insight}
            </p>
          ))}
        </div>
      )}

      {/* Mood + Weather distributions */}
      {(report.moodDistribution.length > 0 || report.weatherCorrelation.length > 0) && (
        <div className="px-4 py-2 border-t border-gray-50 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          {report.moodDistribution.slice(0, 3).map((m) => (
            <span key={m.mood} className="text-text-muted">
              {MOOD_EMOJI[m.mood] ?? "💄"} {m.mood} {m.count}回
            </span>
          ))}
          {report.weatherCorrelation.slice(0, 3).map((w) => (
            <span key={w.weather} className="text-text-muted">
              {WEATHER_EMOJI[w.weather] ?? ""} ★{w.avgRating}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
