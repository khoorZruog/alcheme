"use client";

import { cn } from "@/lib/utils";

export type CosmeSegment = "have" | "want";

interface CosmeSegmentTabsProps {
  value: CosmeSegment;
  onChange: (segment: CosmeSegment) => void;
  haveCount?: number;
  wantCount?: number;
}

const SEGMENTS: { value: CosmeSegment; label: string }[] = [
  { value: "have", label: "持ってる" },
  { value: "want", label: "欲しい" },
];

export function CosmeSegmentTabs({ value, onChange, haveCount, wantCount }: CosmeSegmentTabsProps) {
  const counts: Record<CosmeSegment, number | undefined> = { have: haveCount, want: wantCount };

  return (
    <div className="flex gap-1 p-1 rounded-full bg-white/50 border border-white/80">
      {SEGMENTS.map((seg) => (
        <button
          key={seg.value}
          onClick={() => onChange(seg.value)}
          className={cn(
            "flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all duration-200 btn-squishy",
            value === seg.value
              ? "bg-white text-neon-accent shadow-md"
              : "text-text-muted hover:text-text-ink"
          )}
        >
          {seg.label}
          {counts[seg.value] != null && (
            <span className={cn(
              "ml-1.5 text-[10px] font-bold",
              value === seg.value ? "text-neon-accent/70" : "text-text-muted/60"
            )}>
              {counts[seg.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
