"use client";

import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RemainingBar } from "@/components/remaining-bar";
import { CategoryBadge } from "@/components/category-badge";
import type { ProductGroup, InventoryItem } from "@/types/inventory";

interface VariantSheetProps {
  group: ProductGroup | null;
  open: boolean;
  onClose: () => void;
}

function parseRemaining(item: InventoryItem): number {
  if (!item.estimated_remaining) return 50;
  const num = parseInt(item.estimated_remaining.replace("%", ""), 10);
  return isNaN(num) ? 50 : num;
}

export function VariantSheet({ group, open, onClose }: VariantSheetProps) {
  if (!group) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[70dvh] overflow-y-auto shadow-xl"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <CategoryBadge category={group.category} />
            <span className="px-2 py-0.5 rounded-full bg-neon-accent/10 text-neon-accent text-[10px] font-bold">
              {group.variantCount}色
            </span>
          </div>
          <div className="mt-1">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              {group.brand}
            </p>
            <SheetTitle className="font-display italic text-xl text-text-ink">
              {group.productName}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Variant list */}
        <div className="mt-4 space-y-2">
          {group.variants.map((item) => {
            const displayImage = item.image_url || item.rakuten_image_url;
            const remaining = parseRemaining(item);

            return (
              <Link
                key={item.id}
                href={`/inventory/${item.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl glass-card bg-white hover:bg-white/80 transition btn-squishy"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                  {displayImage ? (
                    <Image
                      src={displayImage}
                      alt={item.color_name ?? item.product_name}
                      fill
                      className="object-cover"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-black/10" />
                    </div>
                  )}
                </div>

                {/* Color info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {item.color_code && (
                      <span className="text-xs font-bold text-neon-accent">
                        #{item.color_code}
                      </span>
                    )}
                    {item.color_name && (
                      <span className="text-sm font-bold text-text-ink truncate">
                        {item.color_name}
                      </span>
                    )}
                    {!item.color_code && !item.color_name && (
                      <span className="text-sm text-text-muted">色情報なし</span>
                    )}
                  </div>
                  <div className="mt-1">
                    <RemainingBar value={remaining} />
                  </div>
                </div>

                {/* Low alert + chevron */}
                <div className="flex items-center gap-1 shrink-0">
                  {remaining < 20 && <AlertCircle size={14} className="text-red-500" />}
                  <ChevronRight className="h-4 w-4 text-text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
