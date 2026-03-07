"use client";

import Image from "next/image";
import { Check, Pencil, AlertTriangle, ExternalLink, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryBadge, getCategoryBorderClass } from "@/components/category-badge";
import { StatBarGroup } from "@/components/stat-bar";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/types/inventory";

interface AppraisalCardProps {
  item: InventoryItem;
  confirmed: boolean;
  onConfirm: (itemId: string) => void;
  onEdit: (item: InventoryItem) => void;
  onEditImage?: (item: InventoryItem) => void;
}

export function AppraisalCard({ item, confirmed, onConfirm, onEdit, onEditImage }: AppraisalCardProps) {
  const displayImage = item.image_url || item.rakuten_image_url;

  return (
    <Card
      className={cn(
        "border-l-4 p-4 transition-all",
        getCategoryBorderClass(item.category),
        confirmed && "bg-alcheme-success/5"
      )}
    >
      {/* Low confidence warning */}
      {item.confidence === "low" && (
        <div className="flex items-start gap-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            AIの認識精度が低いです。ブランド名・商品名・色番号を確認し、必要に応じて「修正」してください。
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Image thumbnail — tappable for photo editing */}
        {displayImage ? (
          <button
            type="button"
            onClick={() => onEditImage?.(item)}
            className="relative w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0 group"
          >
            <Image
              src={displayImage}
              alt={item.product_name}
              fill
              className="object-contain"
              sizes="56px"
              unoptimized
            />
            {onEditImage && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Pencil className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            {/* Rakuten badge */}
            {!item.image_url && item.rakuten_image_url && (
              <a
                href={item.product_url || `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(`${item.brand} ${item.product_name}`)}/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute -bottom-0.5 -right-0.5 z-10 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </button>
        ) : onEditImage ? (
          <button
            type="button"
            onClick={() => onEditImage(item)}
            className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
          >
            <Camera className="h-5 w-5 text-gray-300" />
          </button>
        ) : null}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <CategoryBadge category={item.category} size="sm" />
            {item.price != null && (
              <span className="ml-auto text-xs font-bold text-alcheme-charcoal">
                ¥{item.price.toLocaleString("ja-JP")}
              </span>
            )}
          </div>
          <p className="text-xs text-alcheme-muted uppercase tracking-wider">{item.brand}</p>
          <p className="text-base font-medium text-alcheme-charcoal">{item.product_name}</p>
          {item.color_code && (
            <p className="text-xs text-alcheme-charcoal">
              {item.color_code}{item.color_name ? ` ${item.color_name}` : ""}
            </p>
          )}
          <p className="text-sm text-alcheme-muted">{item.color_description}</p>
        </div>
      </div>

      {item.stats && (
        <div className="mt-3">
          <StatBarGroup stats={item.stats} />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="text-alcheme-muted">
          <Pencil className="mr-1 h-3.5 w-3.5" />
          修正
        </Button>
        <Button
          variant={confirmed ? "default" : "outline"}
          size="sm"
          onClick={() => onConfirm(item.id)}
          className={cn(
            confirmed
              ? "bg-alcheme-success hover:bg-alcheme-success/90 text-white"
              : "border-alcheme-sand"
          )}
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          OK
        </Button>
      </div>
    </Card>
  );
}
