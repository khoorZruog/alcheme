"use client";

import Image from "next/image";
import { Star, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RakutenCandidate } from "@/types/inventory";

interface ProductCandidatesProps {
  candidates: RakutenCandidate[];
  selectedIndex: number | null; // null = none selected, -1 = "該当なし"
  onSelect: (index: number) => void;
  onNone: () => void;
}

function formatPrice(price: number): string {
  return `¥${price.toLocaleString("ja-JP")}`;
}

function StarRating({ average }: { average: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {average.toFixed(1)}
    </span>
  );
}

export function ProductCandidates({
  candidates,
  selectedIndex,
  onSelect,
  onNone,
}: ProductCandidatesProps) {
  if (candidates.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium text-alcheme-charcoal">
        この商品ですか？
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {candidates.map((c, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "shrink-0 w-28 rounded-xl border p-2 text-left transition-all",
              selectedIndex === i
                ? "border-alcheme-rose ring-2 ring-alcheme-rose/30 bg-alcheme-rose/5"
                : "border-alcheme-sand bg-white hover:border-alcheme-rose/50"
            )}
          >
            {/* Image */}
            <div className="relative w-full h-20 rounded-lg bg-gray-50 mb-1.5 overflow-hidden">
              {c.image_url ? (
                <Image
                  src={c.image_url}
                  alt={c.name}
                  fill
                  className="object-contain"
                  sizes="112px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300 text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* Info */}
            <p className="text-[10px] text-alcheme-charcoal font-medium line-clamp-2 leading-tight mb-1">
              {c.name}
            </p>
            {c.color_code && (
              <p className="text-[9px] text-alcheme-muted">
                {c.color_code}{c.color_name ? ` ${c.color_name}` : ""}
              </p>
            )}
            <p className="text-xs font-bold text-alcheme-charcoal mt-0.5">
              {formatPrice(c.price)}
            </p>
            {(c.review_average ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <StarRating average={c.review_average!} />
                <span className="text-[9px] text-alcheme-muted">
                  ({c.review_count})
                </span>
              </div>
            )}
          </button>
        ))}

        {/* 該当なし button */}
        <button
          onClick={onNone}
          className={cn(
            "shrink-0 w-28 rounded-xl border p-2 text-center transition-all flex flex-col items-center justify-center gap-2",
            selectedIndex === -1
              ? "border-alcheme-muted ring-2 ring-alcheme-muted/30 bg-gray-50"
              : "border-alcheme-sand bg-white hover:border-alcheme-muted/50"
          )}
        >
          <HelpCircle className="h-8 w-8 text-alcheme-muted/40" />
          <span className="text-xs text-alcheme-muted font-medium">該当なし</span>
        </button>
      </div>

      {selectedIndex !== null && selectedIndex >= 0 && (
        <p className="text-[10px] text-alcheme-success font-medium">
          楽天で商品を確認しました
        </p>
      )}
    </div>
  );
}
