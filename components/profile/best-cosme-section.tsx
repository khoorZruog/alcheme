"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import type { BestCosmeItem } from "@/types/social";

interface BestCosmeSectionProps {
  items: BestCosmeItem[];
  onEdit?: () => void;
}

export function BestCosmeSection({ items, onEdit }: BestCosmeSectionProps) {
  if (items.length === 0 && !onEdit) return null;

  return (
    <div className="px-4">
      <button
        onClick={onEdit}
        disabled={!onEdit}
        className="w-full glass-card rounded-2xl border border-magic-pink/40 p-4 flex items-center gap-3 text-left btn-squishy disabled:opacity-100"
      >
        {/* Label */}
        <div className="flex-shrink-0">
          <p className="text-sm font-bold text-magic-pink flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            ベストコスメ
          </p>
          <p className="text-[10px] text-text-muted mt-0.5">{items.length} 商品</p>
        </div>

        {/* Thumbnail row */}
        <div className="flex-1 flex items-center gap-1.5 overflow-hidden">
          {items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="w-12 h-12 rounded-lg bg-white/60 flex-shrink-0 overflow-hidden"
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.product_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-text-muted leading-tight text-center p-0.5">
                  {item.brand}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-text-muted flex-shrink-0" />
      </button>
    </div>
  );
}
