"use client";

import { ExternalLink, Package } from "lucide-react";
import type { ProductCardData } from "@/types/chat";

const RISK_BADGE: Record<ProductCardData["duplicate_risk"], { label: string; className: string }> = {
  none: { label: "相性◎", className: "bg-green-100 text-green-700" },
  low: { label: "相性◎", className: "bg-green-100 text-green-700" },
  medium: { label: "類似あり", className: "bg-amber-100 text-amber-700" },
  high: { label: "重複リスク", className: "bg-red-100 text-red-700" },
};

const GAP_TEXT: Record<ProductCardData["gap_analysis"], string> = {
  fills_gap: "新カテゴリ!",
  adds_variety: "バリエーション追加",
  near_duplicate: "ほぼ同じアイテムあり",
};

interface ProductCardInlineProps {
  data: ProductCardData;
  className?: string;
}

export function ProductCardInline({ data, className }: ProductCardInlineProps) {
  const badge = RISK_BADGE[data.duplicate_risk] ?? RISK_BADGE.none;
  const gap = GAP_TEXT[data.gap_analysis] ?? "";

  return (
    <div className={`glass-card bg-white/70 rounded-[20px] overflow-hidden border border-white shadow-soft-float p-4 ${className ?? ""}`}>
      <div className="flex gap-3">
        {/* Image or fallback */}
        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
          {data.image_url ? (
            <img src={data.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package className="h-6 w-6 text-text-muted" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {data.brand}
          </p>
          <p className="text-sm font-bold text-text-ink truncate">{data.product_name}</p>
          {data.price != null && (
            <p className="text-xs text-text-muted mt-0.5">¥{data.price.toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Compatibility info */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
          {badge.label}
        </span>
        {gap && (
          <span className="text-[10px] text-text-muted font-medium">{gap}</span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-text-muted">
          似たアイテム: {data.similar_items_count}個
        </span>
        {data.product_url && (
          <a
            href={data.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-neon-accent font-bold hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            楽天で見る
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
