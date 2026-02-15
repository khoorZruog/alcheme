"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import type { CosmeCategory } from "@/types/inventory";

interface CosmeCardProps {
  itemId: string;
  brand: string;
  productName: string;
  imageUrl?: string;
  rakutenImageUrl?: string;
  price?: number;
  category: CosmeCategory;
  remainingPercent: number;
  colorCode?: string;
  colorName?: string;
  className?: string;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function CosmeCard({
  itemId,
  brand,
  productName,
  imageUrl,
  rakutenImageUrl,
  price,
  category,
  remainingPercent,
  colorCode,
  colorName,
  className,
  selectionMode,
  selected,
  onSelect,
}: CosmeCardProps) {
  const displayImage = imageUrl || rakutenImageUrl;

  const Wrapper = selectionMode ? "button" as const : Link;
  const wrapperProps = selectionMode
    ? { onClick: onSelect, type: "button" as const }
    : { href: `/inventory/${itemId}` };

  return (
    <Wrapper
      {...wrapperProps as any}
      className={cn(
        "block glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer text-left",
        selected && "ring-2 ring-neon-accent",
        className
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-3 right-3 z-10">
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            selected ? "bg-neon-accent border-neon-accent" : "bg-white/80 border-gray-300"
          )}>
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
      )}

      {/* Category Tag */}
      <div className="absolute top-3 left-3 z-10">
        <CategoryBadge category={category} />
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt={`${brand} ${productName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 200px"
              unoptimized
            />
            {/* Gloss overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-black/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate">
            {brand}
          </p>
          {remainingPercent < 20 && (
            <AlertCircle size={12} className="text-red-500 shrink-0" />
          )}
        </div>
        <h3 className="text-sm font-bold text-text-ink leading-tight mb-1 line-clamp-2">
          {productName}
        </h3>
        {(colorCode || colorName) && (
          <p className="text-[10px] text-text-muted truncate mb-1">
            {colorCode && <span className="font-bold text-neon-accent">#{colorCode}</span>}
            {colorCode && colorName && " "}
            {colorName}
          </p>
        )}
        {price != null && (
          <p className="text-[10px] text-alcheme-muted mb-1">¥{price.toLocaleString("ja-JP")}</p>
        )}

        {/* Remaining Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              remainingPercent < 20 ? "bg-red-400" : "bg-green-400"
            )}
            style={{ width: `${Math.min(100, Math.max(0, remainingPercent))}%` }}
          />
        </div>
      </div>
    </Wrapper>
  );
}
