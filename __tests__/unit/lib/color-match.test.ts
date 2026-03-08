import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToLab,
  deltaE76,
  matchPercent,
  hexToLab,
  rankByColorMatch,
} from '@/lib/color-match';
import type { CatalogEntry } from '@/types/catalog';

describe('hexToRgb', () => {
  it('parses #RRGGBB format', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
  });

  it('parses without # prefix', () => {
    expect(hexToRgb('C24B5A')).toEqual([194, 75, 90]);
  });

  it('parses black and white', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
  });
});

describe('rgbToLab', () => {
  it('converts white correctly', () => {
    const [L, a, b] = rgbToLab(255, 255, 255);
    expect(L).toBeCloseTo(100, 0);
    expect(a).toBeCloseTo(0, 0);
    expect(b).toBeCloseTo(0, 0);
  });

  it('converts black correctly', () => {
    const [L] = rgbToLab(0, 0, 0);
    expect(L).toBeCloseTo(0, 0);
  });

  it('converts pure red to positive a*', () => {
    const [, a] = rgbToLab(255, 0, 0);
    expect(a).toBeGreaterThan(40);
  });
});

describe('deltaE76', () => {
  it('returns 0 for identical colors', () => {
    const lab: [number, number, number] = [50, 20, -10];
    expect(deltaE76(lab, lab)).toBe(0);
  });

  it('returns non-zero for different colors', () => {
    const lab1: [number, number, number] = [50, 20, -10];
    const lab2: [number, number, number] = [60, 30, 0];
    expect(deltaE76(lab1, lab2)).toBeGreaterThan(0);
  });

  it('is symmetric', () => {
    const lab1: [number, number, number] = [50, 20, -10];
    const lab2: [number, number, number] = [60, 30, 0];
    expect(deltaE76(lab1, lab2)).toBeCloseTo(deltaE76(lab2, lab1));
  });
});

describe('matchPercent', () => {
  it('returns 100 for deltaE = 0', () => {
    expect(matchPercent(0)).toBe(100);
  });

  it('returns 0 for deltaE >= 50', () => {
    expect(matchPercent(50)).toBe(0);
    expect(matchPercent(100)).toBe(0);
  });

  it('returns 80 for deltaE = 10', () => {
    expect(matchPercent(10)).toBe(80);
  });

  it('returns 50 for deltaE = 25', () => {
    expect(matchPercent(25)).toBe(50);
  });
});

describe('hexToLab', () => {
  it('converts hex to Lab in one step', () => {
    const lab = hexToLab('#FF0000');
    expect(lab[0]).toBeGreaterThan(50); // L > 50 for red
    expect(lab[1]).toBeGreaterThan(40); // a* positive for red
  });
});

describe('rankByColorMatch', () => {
  const makeCatalog = (hex: string | undefined): CatalogEntry => ({
    id: hex || 'no-color',
    brand: 'TEST',
    brand_normalized: 'test',
    product_name: 'テスト',
    product_name_normalized: 'テスト',
    hex_color: hex,
    contributor_count: 1,
    have_count: 1,
    want_count: 0,
    use_count: 0,
    total_rating: 0,
    rating_count: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  });

  it('ranks closest color first', () => {
    const target = '#FF0000'; // red
    const entries = [
      makeCatalog('#0000FF'), // blue - far
      makeCatalog('#FF3333'), // light red - close
      makeCatalog('#FF0000'), // exact match
    ];
    const ranked = rankByColorMatch(target, entries);
    expect(ranked[0].hex_color).toBe('#FF0000');
    expect(ranked[0].matchPercent).toBe(100);
    expect(ranked[0].deltaE).toBe(0);
  });

  it('filters out entries without hex_color', () => {
    const entries = [
      makeCatalog('#FF0000'),
      makeCatalog(undefined),
      makeCatalog('#00FF00'),
    ];
    const ranked = rankByColorMatch('#FF0000', entries);
    expect(ranked).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(rankByColorMatch('#FF0000', [])).toEqual([]);
  });

  it('returns empty if all entries lack hex_color', () => {
    const entries = [makeCatalog(undefined), makeCatalog(undefined)];
    expect(rankByColorMatch('#FF0000', entries)).toEqual([]);
  });

  it('includes matchPercent and deltaE in results', () => {
    const entries = [makeCatalog('#FF0000')];
    const [result] = rankByColorMatch('#FF0000', entries);
    expect(result).toHaveProperty('matchPercent');
    expect(result).toHaveProperty('deltaE');
    expect(result).toHaveProperty('brand');
  });
});
