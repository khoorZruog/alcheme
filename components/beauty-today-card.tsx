"use client";

import { useMemo } from "react";
import { CloudSun, Flame, Sparkles } from "lucide-react";
import { useWeeklyLogs } from "@/hooks/use-weekly-logs";
import { useWeather } from "@/hooks/use-weather";
import { getBeautyTip } from "@/lib/beauty-weather-tips";
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

  // Sort by date descending
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  let expected = todayStr;

  for (const log of sorted) {
    if (log.date === expected) {
      streak++;
      // Move to previous day
      const d = new Date(expected + "T00:00:00");
      d.setDate(d.getDate() - 1);
      expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } else if (log.date < expected) {
      break;
    }
  }

  return streak;
}

function findRecommendedRecipe(
  logs: BeautyLogEntry[],
  currentWeather: string | null,
): { recipeName: string; avgRating: number; count: number } | null {
  if (!currentWeather || logs.length === 0) return null;

  // Find logs with same weather and a rating
  const matching = logs.filter(
    (l) => l.weather === currentWeather && l.self_rating && l.recipe_name,
  );
  if (matching.length === 0) return null;

  // Group by recipe name
  const byRecipe = new Map<string, { total: number; count: number }>();
  for (const log of matching) {
    const name = log.recipe_name!;
    const entry = byRecipe.get(name) ?? { total: 0, count: 0 };
    entry.total += log.self_rating!;
    entry.count++;
    byRecipe.set(name, entry);
  }

  // Find best rated recipe
  let best: { recipeName: string; avgRating: number; count: number } | null = null;
  for (const [name, { total, count }] of byRecipe) {
    const avg = total / count;
    if (!best || avg > best.avgRating) {
      best = { recipeName: name, avgRating: Math.round(avg * 10) / 10, count };
    }
  }

  return best;
}

export function BeautyTodayCard() {
  const { logs, isLoading } = useWeeklyLogs(30); // Get 30 days for better weather correlation
  const { data: weatherData, isLoading: weatherLoading } = useWeather();

  const streak = useMemo(() => computeStreak(logs), [logs]);
  const recommendation = useMemo(
    () => findRecommendedRecipe(logs, weatherData.weather),
    [logs, weatherData.weather],
  );
  const beautyTip = useMemo(
    () => getBeautyTip(weatherData.weather, weatherData.temp, weatherData.humidity),
    [weatherData],
  );

  // Weather correlation: avg rating for current weather
  const weatherStats = useMemo(() => {
    if (!weatherData.weather) return null;
    const matching = logs.filter(
      (l) => l.weather === weatherData.weather && l.self_rating,
    );
    if (matching.length === 0) return null;
    const avg = matching.reduce((s, l) => s + l.self_rating!, 0) / matching.length;
    return { avgRating: Math.round(avg * 10) / 10, count: matching.length };
  }, [logs, weatherData.weather]);

  if (weatherLoading && isLoading) return null;
  if (!weatherData.weather && !streak && !recommendation) return null;

  const todayLabel = new Date().toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="mb-4 rounded-2xl bg-linear-to-br from-white to-alcheme-rose/5 border border-gray-100 overflow-hidden shadow-sm">
      {/* Header: Weather + Date */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {weatherData.weather ? (
            <span className="text-lg">{WEATHER_EMOJI[weatherData.weather] ?? ""}</span>
          ) : (
            <CloudSun className="h-5 w-5 text-alcheme-muted" />
          )}
          <div className="text-sm">
            {weatherData.weather && (
              <span className="font-medium text-text-ink">{weatherData.weather}</span>
            )}
            {weatherData.temp != null && (
              <span className="text-text-muted ml-1">{weatherData.temp}°C</span>
            )}
            {weatherData.humidity != null && (
              <span className="text-text-muted ml-1">湿度{weatherData.humidity}%</span>
            )}
          </div>
        </div>
        <span className="text-xs text-text-muted">{todayLabel}</span>
      </div>

      {/* Beauty Tip */}
      {beautyTip && (
        <div className="px-4 pb-2">
          <p className="text-xs text-text-muted flex items-start gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-alcheme-gold shrink-0 mt-0.5" />
            {beautyTip}
          </p>
        </div>
      )}

      {/* Recommendation + Stats */}
      {(recommendation || weatherStats || streak > 0) && (
        <div className="px-4 pb-3 space-y-1.5">
          {recommendation && (
            <p className="text-xs text-text-ink">
              <span className="text-alcheme-gold">⭐</span>{" "}
              おすすめ: <span className="font-medium">{recommendation.recipeName}</span>
              <span className="text-text-muted ml-1">
                (★{recommendation.avgRating} / {recommendation.count}回)
              </span>
            </p>
          )}
          {weatherStats && !recommendation && (
            <p className="text-xs text-text-muted">
              {WEATHER_EMOJI[weatherData.weather!] ?? ""}{" "}
              {weatherData.weather}の日の平均 ★{weatherStats.avgRating} ({weatherStats.count}回中)
            </p>
          )}
          {streak > 0 && (
            <p className="text-xs text-text-ink flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="font-medium">{streak}日連続</span>
              <span className="text-text-muted">記録中！</span>
            </p>
          )}
        </div>
      )}

    </div>
  );
}
