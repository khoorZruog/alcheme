"use client";

import Image from "next/image";
import { Package, Star, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogEntry } from "@/types/catalog";

const RANK_STYLES: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-yellow-100", text: "text-yellow-700" },
  2: { bg: "bg-gray-100", text: "text-gray-500" },
  3: { bg: "bg-orange-100", text: "text-orange-700" },
};

interface CatalogRankingCardProps {
  entry: CatalogEntry;
  rank: number;
  onSelect: (entry: CatalogEntry) => void;
}

export function CatalogRankingCard({ entry, rank, onSelect }: CatalogRankingCardProps) {
  const displayImage = entry.image_url || entry.rakuten_image_url;
  const avgRating =
    entry.rating_count > 0
      ? (entry.total_rating / entry.rating_count).toFixed(1)
      : null;

  const rankStyle = RANK_STYLES[rank] ?? { bg: "bg-gray-50", text: "text-text-muted" };

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="block w-full text-left glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer"
    >
      {/* Rank badge */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
          rankStyle.bg,
          rankStyle.text,
        )}
      >
        {rank}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt={`${entry.brand} ${entry.product_name}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            {/* Rakuten badge */}
            {!entry.image_url && entry.rakuten_image_url && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(
                    entry.product_url || `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${entry.brand} ${entry.product_name}`)}/`,
                    '_blank',
                    'noopener,noreferrer',
                  );
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLElement).click(); }}
                className="absolute bottom-1.5 right-1.5 z-10 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-bold cursor-pointer hover:bg-black/70 transition"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                楽天
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-black/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate mb-0.5">
          {entry.brand}
        </p>
        <h3 className="text-sm font-bold text-text-ink leading-tight mb-1 line-clamp-2">
          {entry.product_name}
        </h3>

        {(entry.color_code || entry.color_name) && (
          <p className="text-[10px] text-text-muted truncate mb-1">
            {entry.color_code && (
              <span className="font-bold text-neon-accent">#{entry.color_code}</span>
            )}
            {entry.color_code && entry.color_name && " "}
            {entry.color_name}
          </p>
        )}

        {/* Rating */}
        {avgRating && (
          <div className="flex items-center gap-0.5 mb-1.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-text-ink">{avgRating}</span>
            <span className="text-[9px] text-text-muted">({entry.rating_count})</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-1.5 text-[9px]">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 font-bold">
            {entry.have_count} 持ってる
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
            {entry.want_count} 欲しい
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-bold">
            {entry.use_count} 活用
          </span>
        </div>
      </div>
    </button>
  );
}
