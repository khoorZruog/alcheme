import { describe, it, expect } from 'vitest';
import { computeWeeklyReport } from '@/lib/beauty-log-analytics';
import type { BeautyLogEntry } from '@/types/beauty-log';

function makeLog(overrides: Partial<BeautyLogEntry> & { date: string }): BeautyLogEntry {
  return {
    id: overrides.date,
    used_items: [],
    modifications: [],
    photos: [],
    auto_tags: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('computeWeeklyReport', () => {
  it('returns empty report for no logs', () => {
    const report = computeWeeklyReport([]);
    expect(report.daysRecorded).toBe(0);
    expect(report.averageRating).toBeNull();
    expect(report.currentStreak).toBe(0);
    expect(report.topRatedLog).toBeNull();
    expect(report.insights).toEqual([]);
  });

  it('calculates basic stats', () => {
    const logs = [
      makeLog({ date: '2026-02-17', self_rating: 4, mood: '元気', weather: '晴れ' }),
      makeLog({ date: '2026-02-18', self_rating: 3, mood: '落ち着き', weather: '曇り' }),
      makeLog({ date: '2026-02-19', self_rating: 5, mood: '元気', weather: '晴れ' }),
    ];
    const report = computeWeeklyReport(logs);
    expect(report.daysRecorded).toBe(3);
    expect(report.averageRating).toBe(4);
    expect(report.topRatedLog?.self_rating).toBe(5);
  });

  it('computes mood distribution with avgRating', () => {
    const logs = [
      makeLog({ date: '2026-02-17', self_rating: 5, mood: '元気' }),
      makeLog({ date: '2026-02-18', self_rating: 3, mood: '元気' }),
      makeLog({ date: '2026-02-19', self_rating: 4, mood: '落ち着き' }),
    ];
    const report = computeWeeklyReport(logs);
    expect(report.moodDistribution).toHaveLength(2);
    const genki = report.moodDistribution.find((m) => m.mood === '元気');
    expect(genki?.count).toBe(2);
    expect(genki?.avgRating).toBe(4);
  });

  it('computes weather correlation', () => {
    const logs = [
      makeLog({ date: '2026-02-17', self_rating: 5, weather: '雨' }),
      makeLog({ date: '2026-02-18', self_rating: 4, weather: '雨' }),
      makeLog({ date: '2026-02-19', self_rating: 3, weather: '晴れ' }),
    ];
    const report = computeWeeklyReport(logs);
    const rain = report.weatherCorrelation.find((w) => w.weather === '雨');
    expect(rain?.avgRating).toBe(4.5);
    expect(rain?.count).toBe(2);
  });

  it('computes avg temp and humidity', () => {
    const logs = [
      makeLog({ date: '2026-02-17', self_rating: 4, temp: 10, humidity: 40 }),
      makeLog({ date: '2026-02-18', self_rating: 3, temp: 14, humidity: 60 }),
    ];
    const report = computeWeeklyReport(logs);
    expect(report.avgTemp).toBe(12);
    expect(report.avgHumidity).toBe(50);
  });

  it('generates weather insight when there is a gap', () => {
    const logs = [
      makeLog({ date: '2026-02-15', self_rating: 5, weather: '雨' }),
      makeLog({ date: '2026-02-16', self_rating: 5, weather: '雨' }),
      makeLog({ date: '2026-02-17', self_rating: 3, weather: '晴れ' }),
      makeLog({ date: '2026-02-18', self_rating: 3, weather: '晴れ' }),
    ];
    const report = computeWeeklyReport(logs);
    expect(report.insights.some((i) => i.includes('雨') && i.includes('得意'))).toBe(true);
  });

  it('generates occasion dominance insight', () => {
    const logs = [
      makeLog({ date: '2026-02-13', self_rating: 4, occasion: '仕事' }),
      makeLog({ date: '2026-02-14', self_rating: 3, occasion: '仕事' }),
      makeLog({ date: '2026-02-15', self_rating: 4, occasion: '仕事' }),
      makeLog({ date: '2026-02-16', self_rating: 5, occasion: '仕事' }),
      makeLog({ date: '2026-02-17', self_rating: 3, occasion: 'デート' }),
    ];
    const report = computeWeeklyReport(logs);
    expect(report.insights.some((i) => i.includes('仕事メイクが中心'))).toBe(true);
  });
});
