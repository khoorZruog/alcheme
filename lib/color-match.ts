/**
 * Color matching utility — CIELAB Delta E (CIE76)
 *
 * クライアント側で hex カラー同士の類似度を計算し、
 * カタログエントリをマッチ度順にランキングする。
 */

import type { CatalogEntry } from '@/types/catalog';

// ---------------------------------------------------------------------------
//  Hex → RGB
// ---------------------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ---------------------------------------------------------------------------
//  sRGB → CIELAB (via XYZ, D65 illuminant)
// ---------------------------------------------------------------------------

export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB → linear
  let rl = r / 255;
  let gl = g / 255;
  let bl = b / 255;
  rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
  gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
  bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;

  // linear RGB → XYZ (D65)
  let x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  let y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750);
  let z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;

  // XYZ → Lab
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);

  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// ---------------------------------------------------------------------------
//  Delta E (CIE76) — Euclidean distance in Lab space
// ---------------------------------------------------------------------------

export function deltaE76(
  lab1: [number, number, number],
  lab2: [number, number, number],
): number {
  return Math.sqrt(
    (lab1[0] - lab2[0]) ** 2 +
    (lab1[1] - lab2[1]) ** 2 +
    (lab1[2] - lab2[2]) ** 2,
  );
}

// ---------------------------------------------------------------------------
//  Delta E → match percentage (0–100)
// ---------------------------------------------------------------------------

export function matchPercent(deltaE: number): number {
  // deltaE 0 = perfect match (100%), deltaE 50+ = 0%
  return Math.max(0, Math.round(100 - deltaE * 2));
}

// ---------------------------------------------------------------------------
//  Convenience: hex → Lab
// ---------------------------------------------------------------------------

export function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToLab(r, g, b);
}

// ---------------------------------------------------------------------------
//  Rank catalog entries by color similarity
// ---------------------------------------------------------------------------

export interface ColorMatchResult extends CatalogEntry {
  matchPercent: number;
  deltaE: number;
}

export function rankByColorMatch(
  targetHex: string,
  entries: CatalogEntry[],
): ColorMatchResult[] {
  const targetLab = hexToLab(targetHex);

  return entries
    .filter((e): e is CatalogEntry & { hex_color: string } => !!e.hex_color)
    .map((entry) => {
      const entryLab = hexToLab(entry.hex_color);
      const de = deltaE76(targetLab, entryLab);
      return { ...entry, deltaE: de, matchPercent: matchPercent(de) };
    })
    .sort((a, b) => a.deltaE - b.deltaE);
}
