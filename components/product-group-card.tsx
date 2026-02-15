"use client";

import Image from "next/image";
import { Package, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import type { ProductGroup } from "@/types/inventory";

interface ProductGroupCardProps {
  group: ProductGroup;
  onClick: () => void;
  className?: string;
  selectionMode?: boolean;
  selected?: boolean;
}

export function ProductGroupCard({ group, onClick, className, selectionMode, selected }: ProductGroupCardProps) {
  const displayImage =
    group.representative.image_url || group.representative.rakuten_image_url;

  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full text-left relative btn-squishy cursor-pointer",
        className
      )}
    >
      {/* Stacked card effect: 2 pseudo-cards behind */}
      <div className="absolute inset-0 glass-card bg-white rounded-card translate-x-1 translate-y-1 opacity-40" />
      <div className="absolute inset-0 glass-card bg-white rounded-card translate-x-0.5 translate-y-0.5 opacity-60" />

      {/* Main card (foreground) */}
      <div className={cn(
        "relative glass-card bg-white rounded-card p-3 overflow-hidden",
        selected && "ring-2 ring-neon-accent"
      )}>
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-3 right-12 z-10">
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
          <CategoryBadge category={group.category} />
        </div>

        {/* Variant count badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-neon-accent text-white text-[10px] font-bold shadow-lg">
            {group.variantCount}色
          </span>
        </div>

        {/* Image */}
        <div className="relative w-full aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
          {displayImage ? (
            <>
              <Image
                src={displayImage}
                alt={`${group.brand} ${group.productName}`}
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
              {group.brand}
            </p>
            {group.minRemaining < 20 && (
              <AlertCircle size={12} className="text-red-500 shrink-0" />
            )}
          </div>
          <h3 className="text-sm font-bold text-text-ink leading-tight mb-1 line-clamp-2">
            {group.productName}
          </h3>
          {group.representative.price != null && (
            <p className="text-[10px] text-alcheme-muted mb-1">
              ¥{group.representative.price.toLocaleString("ja-JP")}
            </p>
          )}

          {/* Remaining Bar (shows minimum across variants) */}
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                group.minRemaining < 20 ? "bg-red-400" : "bg-green-400"
              )}
              style={{ width: `${Math.min(100, Math.max(0, group.minRemaining))}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
