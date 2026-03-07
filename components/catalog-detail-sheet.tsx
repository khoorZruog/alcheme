"use client";

import Image from "next/image";
import { Package, Star, Users, ExternalLink, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { CatalogEntry } from "@/types/catalog";

interface CatalogDetailSheetProps {
  entry: CatalogEntry | null;
  open: boolean;
  onClose: () => void;
  onRegister: (entry: CatalogEntry) => void;
  isOwned: boolean;
}

export function CatalogDetailSheet({
  entry,
  open,
  onClose,
  onRegister,
  isOwned,
}: CatalogDetailSheetProps) {
  if (!entry) return null;

  const displayImage = entry.image_url || entry.rakuten_image_url;
  const avgRating =
    entry.rating_count > 0
      ? (entry.total_rating / entry.rating_count).toFixed(1)
      : null;
  const colorInfo = [entry.color_code, entry.color_name].filter(Boolean).join(" ");

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-card max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">コスメ詳細</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Image */}
          <div className="relative w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={`${entry.brand} ${entry.product_name}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Package className="h-12 w-12 text-black/10" />
              </div>
            )}
          </div>

          {/* Rakuten link */}
          {(entry.product_url || entry.rakuten_image_url) && (
            <div className="flex flex-col gap-1.5">
              {entry.product_url && entry.product_url.includes('rakuten.co.jp') && (
                <a
                  href={entry.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-neon-accent font-bold hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  楽天で見る
                </a>
              )}
              <a
                href={`https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${entry.brand} ${entry.product_name}${entry.color_name ? ` ${entry.color_name}` : ''}`)}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-ink transition"
              >
                <Search className="h-3.5 w-3.5" />
                楽天で探す
              </a>
            </div>
          )}

          {/* Product info */}
          <div className="space-y-1">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              {entry.brand}
            </p>
            <h3 className="text-lg font-bold text-text-ink leading-tight">
              {entry.product_name}
            </h3>
            {colorInfo && (
              <p className="text-sm text-text-muted">
                {entry.color_code && (
                  <span className="font-bold text-neon-accent">#{entry.color_code}</span>
                )}
                {entry.color_code && entry.color_name && " "}
                {entry.color_name}
              </p>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {entry.category && (
              <span className="px-2.5 py-1 rounded-full bg-surface-cream/80 text-xs font-bold text-text-muted">
                {entry.category}
              </span>
            )}
            {entry.texture && (
              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-xs font-bold text-purple-600">
                {entry.texture}
              </span>
            )}
            {entry.item_type && (
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                {entry.item_type}
              </span>
            )}
          </div>

          {/* Rating */}
          {avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-text-ink">{avgRating}</span>
              <span className="text-xs text-text-muted">({entry.rating_count}件の評価)</span>
            </div>
          )}

          {/* Community stats */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pink-50 text-xs font-bold text-pink-600">
              <Users className="h-3 w-3" />
              {entry.have_count} 持ってる
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-bold text-blue-600">
              {entry.want_count} 欲しい
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-50 text-xs font-bold text-green-600">
              {entry.use_count} 活用
            </span>
          </div>

          {/* Action button */}
          {isOwned ? (
            <Button
              disabled
              className="w-full rounded-button bg-gray-200 text-gray-500 cursor-not-allowed"
            >
              すでにMy Cosmeに登録済み ✓
            </Button>
          ) : (
            <Button
              onClick={() => onRegister(entry)}
              className="w-full bg-alcheme-rose hover:bg-alcheme-rose/90 text-white rounded-button"
            >
              My Cosmeに追加
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
