"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Preset swatches — cosmetic color families                          */
/* ------------------------------------------------------------------ */

interface SwatchGroup {
  label: string;
  colors: string[];
}

const SWATCH_GROUPS: SwatchGroup[] = [
  { label: "レッド", colors: ["#C24B5A", "#B22222", "#DC143C", "#A52A2A"] },
  { label: "ピンク", colors: ["#E8909C", "#DB7093", "#FF69B4", "#FFB6C1"] },
  { label: "コーラル", colors: ["#FF7F50", "#E9967A", "#FA8072", "#F08080"] },
  { label: "オレンジ", colors: ["#FF8C00", "#E56B2F", "#D2691E", "#CD853F"] },
  { label: "ベージュ", colors: ["#F5DEB3", "#DEB887", "#D2B48C", "#C4A882"] },
  { label: "ブラウン", colors: ["#8B4513", "#A0522D", "#6B3A2A", "#3E2723"] },
  { label: "パープル", colors: ["#9370DB", "#8B008B", "#DA70D6", "#9B59B6"] },
];

/* ------------------------------------------------------------------ */
/*  Hue slider helpers                                                 */
/* ------------------------------------------------------------------ */

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [showSliders, setShowSliders] = useState(false);
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value));
  const hueRef = useRef<HTMLDivElement>(null);

  const handleSwatchClick = useCallback(
    (hex: string) => {
      onChange(hex);
      setHsl(hexToHsl(hex));
    },
    [onChange],
  );

  const updateFromHsl = useCallback(
    (h: number, s: number, l: number) => {
      setHsl([h, s, l]);
      onChange(hslToHex(h, s, l));
    },
    [onChange],
  );

  const handleHueTouch = useCallback(
    (clientX: number) => {
      if (!hueRef.current) return;
      const rect = hueRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      updateFromHsl(Math.round(ratio * 360), hsl[1], hsl[2]);
    },
    [hsl, updateFromHsl],
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selected color preview + hex */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full border-2 border-white shadow-md shrink-0"
          style={{ backgroundColor: value }}
        />
        <div>
          <p className="text-sm font-bold text-text-primary">{value}</p>
          <button
            type="button"
            className="text-xs text-neon-accent hover:underline"
            onClick={() => setShowSliders(!showSliders)}
          >
            {showSliders ? "スウォッチに戻る" : "色を微調整"}
          </button>
        </div>
      </div>

      {showSliders ? (
        /* HSL sliders */
        <div className="space-y-2">
          {/* Hue bar */}
          <div className="space-y-1">
            <label className="text-xs text-text-muted">色相</label>
            <div
              ref={hueRef}
              className="relative h-8 rounded-full cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
              }}
              onClick={(e) => handleHueTouch(e.clientX)}
              onTouchMove={(e) => handleHueTouch(e.touches[0].clientX)}
            >
              <div
                className="absolute top-0.5 w-7 h-7 rounded-full border-2 border-white shadow-md"
                style={{
                  left: `calc(${(hsl[0] / 360) * 100}% - 14px)`,
                  backgroundColor: hslToHex(hsl[0], 100, 50),
                }}
              />
            </div>
          </div>
          {/* Saturation */}
          <div className="space-y-1">
            <label className="text-xs text-text-muted">彩度</label>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl[1]}
              onChange={(e) => updateFromHsl(hsl[0], Number(e.target.value), hsl[2])}
              className="w-full accent-neon-accent"
            />
          </div>
          {/* Lightness */}
          <div className="space-y-1">
            <label className="text-xs text-text-muted">明度</label>
            <input
              type="range"
              min={10}
              max={90}
              value={hsl[2]}
              onChange={(e) => updateFromHsl(hsl[0], hsl[1], Number(e.target.value))}
              className="w-full accent-neon-accent"
            />
          </div>
        </div>
      ) : (
        /* Preset swatches */
        <div className="space-y-2">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.label} className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted w-12 shrink-0">
                {group.label}
              </span>
              <div className="flex gap-1.5">
                {group.colors.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform active:scale-90",
                      value === hex
                        ? "border-neon-accent scale-110 shadow-md"
                        : "border-white/30",
                    )}
                    style={{ backgroundColor: hex }}
                    onClick={() => handleSwatchClick(hex)}
                    aria-label={`${group.label} ${hex}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
