"use client";

import Image from "next/image";
import { Check, Pencil, AlertTriangle } from "lucide-react";
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
}

export function AppraisalCard({ item, confirmed, onConfirm, onEdit }: AppraisalCardProps) {
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
        {/* Image thumbnail */}
        {displayImage && (
          <div className="relative w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0">
            <Image
              src={displayImage}
              alt={item.product_name}
              fill
              className="object-contain"
              sizes="56px"
              unoptimized
            />
          </div>
        )}
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
