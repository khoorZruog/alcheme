"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, AlertCircle } from "lucide-react";
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
  className?: string;
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
  className,
}: CosmeCardProps) {
  const displayImage = imageUrl || rakutenImageUrl;
  return (
    <Link
      href={`/inventory/${itemId}`}
      className={cn(
        "block glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer",
        className
      )}
    >
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
    </Link>
  );
}
