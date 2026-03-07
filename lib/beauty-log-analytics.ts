/**
 * Client-side beauty log analytics — pure functions.
 * Mirrors Profiler agent pattern detection for frontend Weekly Report.
 */

import type { BeautyLogEntry } from '@/types/beauty-log';

export interface WeeklyReport {
  daysRecorded: number;
  averageRating: number | null;
  currentStreak: number;
  bestStreak: number;
  topRatedLog: BeautyLogEntry | null;
  moodDistribution: Array<{ mood: string; count: number; avgRating: number }>;
  weatherCorrelation: Array<{ weather: string; avgRating: number; count: number }>;
  occasionDistribution: Array<{ occasion: string; count: number; avgRating: number }>;
  avgTemp: number | null;
  avgHumidity: number | null;
  insights: string[];
}

function computeStreak(logs: BeautyLogEntry[]): { current: number; best: number } {
  if (logs.length === 0) return { current: 0, best: 0 };

  const dates = new Set(logs.map((l) => l.date));
  const sorted = [...dates].sort().reverse();

  // Current streak from today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let current = 0;
  let expected = todayStr;
  for (const date of sorted) {
    if (date === expected) {
      current++;
      const d = new Date(expected + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (date < expected) {
      break;
    }
  }

  // Best streak in the dataset
  const allSorted = [...dates].sort();
  let best = 0;
  let streak = 0;
  let prev = '';
  for (const date of allSorted) {
    if (prev) {
      const prevDate = new Date(prev + 'T00:00:00');
      prevDate.setDate(prevDate.getDate() + 1);
      const nextExpected = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
      streak = date === nextExpected ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    best = Math.max(best, streak);
    prev = date;
  }

  return { current, best };
}

function groupBy<T>(items: T[], key: (item: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    const arr = map.get(k) ?? [];
    arr.push(item);
    map.set(k, arr);
  }
  return map;
}

function avgRatingOf(logs: BeautyLogEntry[]): number {
  const rated = logs.filter((l) => l.self_rating);
  if (rated.length === 0) return 0;
  return rated.reduce((s, l) => s + l.self_rating!, 0) / rated.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function generateInsights(
  logs: BeautyLogEntry[],
  weatherCorr: WeeklyReport['weatherCorrelation'],
  moodDist: WeeklyReport['moodDistribution'],
  occasionDist: WeeklyReport['occasionDistribution'],
  streak: number,
  topLog: BeautyLogEntry | null,
): string[] {
  const insights: string[] = [];

  // Streak insight
  if (streak >= 3) {
    insights.push(`${streak}日連続記録中！素晴らしい継続力です`);
  }

  // Weather × rating correlation
  if (weatherCorr.length >= 2) {
    const sorted = [...weatherCorr].sort((a, b) => b.avgRating - a.avgRating);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best.avgRating - worst.avgRating >= 0.5) {
      insights.push(
        `${best.weather}の日の平均★${best.avgRating} — ${best.weather}メイクが得意！`,
      );
    }
  }

  // Mood × rating insight
  if (moodDist.length >= 2) {
    const best = [...moodDist].sort((a, b) => b.avgRating - a.avgRating)[0];
    if (best.avgRating >= 4) {
      insights.push(
        `「${best.mood}」の日は平均★${best.avgRating} — 気分がメイクに反映されていますね`,
      );
    }
  }

  // Occasion dominance
  if (occasionDist.length > 0) {
    const total = occasionDist.reduce((s, o) => s + o.count, 0);
    const top = occasionDist[0];
    if (total >= 5 && top.count / total >= 0.6) {
      insights.push(
        `今週は${top.occasion}メイクが中心でした。たまには違うスタイルも楽しいかも`,
      );
    }
  }

  // Top look
  if (topLog && topLog.self_rating && topLog.self_rating >= 4) {
    const dateLabel = new Date(topLog.date + 'T00:00:00').toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
    const recipe = topLog.recipe_name ? `の${topLog.recipe_name}` : '';
    insights.push(
      `${dateLabel}${recipe}が今週のベストルック ★${topLog.self_rating}`,
    );
  }

  return insights;
}

export function computeWeeklyReport(logs: BeautyLogEntry[]): WeeklyReport {
  const daysRecorded = new Set(logs.map((l) => l.date)).size;

  // Average rating
  const rated = logs.filter((l) => l.self_rating);
  const averageRating = rated.length > 0
    ? round1(rated.reduce((s, l) => s + l.self_rating!, 0) / rated.length)
    : null;

  // Streak
  const { current: currentStreak, best: bestStreak } = computeStreak(logs);

  // Top rated log
  const topRatedLog = rated.length > 0
    ? rated.reduce((best, l) =>
        (l.self_rating ?? 0) > (best.self_rating ?? 0) ? l : best,
      )
    : null;

  // Mood distribution
  const moodGroups = groupBy(logs, (l) => l.mood);
  const moodDistribution = [...moodGroups.entries()]
    .map(([mood, items]) => ({
      mood,
      count: items.length,
      avgRating: round1(avgRatingOf(items)),
    }))
    .sort((a, b) => b.count - a.count);

  // Weather correlation
  const weatherGroups = groupBy(logs, (l) => l.weather);
  const weatherCorrelation = [...weatherGroups.entries()]
    .map(([weather, items]) => ({
      weather,
      avgRating: round1(avgRatingOf(items)),
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count);

  // Occasion distribution
  const occasionGroups = groupBy(logs, (l) => l.occasion);
  const occasionDistribution = [...occasionGroups.entries()]
    .map(([occasion, items]) => ({
      occasion,
      count: items.length,
      avgRating: round1(avgRatingOf(items)),
    }))
    .sort((a, b) => b.count - a.count);

  // Avg temp/humidity
  const withTemp = logs.filter((l) => l.temp != null);
  const avgTemp = withTemp.length > 0
    ? round1(withTemp.reduce((s, l) => s + l.temp!, 0) / withTemp.length)
    : null;

  const withHumidity = logs.filter((l) => l.humidity != null);
  const avgHumidity = withHumidity.length > 0
    ? round1(withHumidity.reduce((s, l) => s + l.humidity!, 0) / withHumidity.length)
    : null;

  // Generate insights
  const insights = generateInsights(
    logs,
    weatherCorrelation,
    moodDistribution,
    occasionDistribution,
    currentStreak,
    topRatedLog,
  );

  return {
    daysRecorded,
    averageRating,
    currentStreak,
    bestStreak,
    topRatedLog,
    moodDistribution,
    weatherCorrelation,
    occasionDistribution,
    avgTemp,
    avgHumidity,
    insights,
  };
}
