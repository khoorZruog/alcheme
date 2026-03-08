"use client";

import Image from "next/image";
import { Package, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColorMatchResult } from "@/lib/color-match";

interface ColorMatchCardProps {
  entry: ColorMatchResult;
  onSelect: (entry: ColorMatchResult) => void;
}

export function ColorMatchCard({ entry, onSelect }: ColorMatchCardProps) {
  const displayImage = entry.image_url || entry.rakuten_image_url;

  const matchBg =
    entry.matchPercent >= 80
      ? "bg-green-100 text-green-700"
      : entry.matchPercent >= 60
        ? "bg-yellow-100 text-yellow-700"
        : "bg-gray-100 text-gray-500";

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="block w-full text-left glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer"
    >
      {/* Match % badge */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-black",
          matchBg,
        )}
      >
        {entry.matchPercent}%
      </div>

      {/* Color swatch badge */}
      <div
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: entry.hex_color }}
      />

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
            {!entry.image_url && entry.rakuten_image_url && (
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(
                    entry.product_url ||
                      `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${entry.brand} ${entry.product_name}`)}/`,
                    "_blank",
                    "noopener,noreferrer",
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLElement).click();
                }}
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

        {/* Stats row */}
        <div className="flex items-center gap-1.5 text-[9px]">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-pink-50 text-pink-600 font-bold">
            {entry.have_count} 持ってる
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
            {entry.want_count} 欲しい
          </span>
        </div>
      </div>
    </button>
  );
}
