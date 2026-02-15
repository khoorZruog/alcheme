"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, AlertCircle, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CosmeCategory } from "@/types/inventory";

interface CosmeListItemProps {
  itemId: string;
  brand: string;
  productName: string;
  imageUrl?: string;
  rakutenImageUrl?: string;
  category: CosmeCategory;
  remainingPercent: number;
  colorCode?: string;
  colorName?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function CosmeListItem({
  itemId,
  brand,
  productName,
  imageUrl,
  rakutenImageUrl,
  category,
  remainingPercent,
  colorCode,
  colorName,
  selectionMode,
  selected,
  onSelect,
}: CosmeListItemProps) {
  const displayImage = imageUrl || rakutenImageUrl;

  const Wrapper = selectionMode ? "button" as const : Link;
  const wrapperProps = selectionMode
    ? { onClick: onSelect, type: "button" as const }
    : { href: `/inventory/${itemId}` };

  return (
    <Wrapper
      {...wrapperProps as any}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2.5 bg-white/60 hover:bg-white/80 transition-colors text-left",
        selected && "bg-neon-accent/5",
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          selected ? "bg-neon-accent border-neon-accent" : "bg-white border-gray-300"
        )}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={`${brand} ${productName}`}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-4 w-4 text-black/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate">
          {brand}
        </p>
        <p className="text-sm font-bold text-text-ink leading-tight truncate">
          {productName}
        </p>
        {(colorCode || colorName) && (
          <p className="text-[10px] text-text-muted truncate">
            {colorCode && <span className="font-bold text-neon-accent">#{colorCode}</span>}
            {colorCode && colorName && " "}
            {colorName}
          </p>
        )}
      </div>

      {/* Remaining + Arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {remainingPercent < 20 && (
          <AlertCircle size={14} className="text-red-500" />
        )}
        <div className="w-8 flex flex-col items-center gap-0.5">
          <span className="text-[10px] text-text-muted font-bold">{remainingPercent}%</span>
          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                remainingPercent < 20 ? "bg-red-400" : "bg-green-400"
              )}
              style={{ width: `${Math.min(100, Math.max(0, remainingPercent))}%` }}
            />
          </div>
        </div>
        {!selectionMode && (
          <ChevronRight className="h-4 w-4 text-text-muted" />
        )}
      </div>
    </Wrapper>
  );
}

/** List item for product groups */
interface ProductGroupListItemProps {
  groupKey: string;
  brand: string;
  productName: string;
  variantCount: number;
  imageUrl?: string;
  rakutenImageUrl?: string;
  minRemaining: number;
  onClick: () => void;
  selectionMode?: boolean;
  selected?: boolean;
}

export function ProductGroupListItem({
  brand,
  productName,
  variantCount,
  imageUrl,
  rakutenImageUrl,
  minRemaining,
  onClick,
  selectionMode,
  selected,
}: ProductGroupListItemProps) {
  const displayImage = imageUrl || rakutenImageUrl;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-2.5 bg-white/60 hover:bg-white/80 transition-colors text-left",
        selected && "bg-neon-accent/5",
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          selected ? "bg-neon-accent border-neon-accent" : "bg-white border-gray-300"
        )}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 relative">
        {displayImage ? (
          <Image
            src={displayImage}
            alt={`${brand} ${productName}`}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-4 w-4 text-black/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate">
          {brand}
        </p>
        <p className="text-sm font-bold text-text-ink leading-tight truncate">
          {productName}
        </p>
        <p className="text-[10px] text-neon-accent font-bold">
          {variantCount}色
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {minRemaining < 20 && (
          <AlertCircle size={14} className="text-red-500" />
        )}
        <ChevronRight className="h-4 w-4 text-text-muted" />
      </div>
    </button>
  );
}
