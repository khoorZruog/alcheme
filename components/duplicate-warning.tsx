"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface DuplicateWarningProps {
  brand: string;
  productName: string;
  colorCode?: string;
  items: InventoryItem[];
  /** Item ID being edited (exclude from check) */
  editingId?: string;
}

export function DuplicateWarning({
  brand,
  productName,
  colorCode,
  items,
  editingId,
}: DuplicateWarningProps) {
  const warning = useMemo(() => {
    const b = (brand || "").toLowerCase();
    const p = (productName || "").toLowerCase();
    const c = (colorCode || "").toLowerCase();
    if (!b || !p) return null;

    for (const item of items) {
      if (editingId && item.id === editingId) continue;
      const ib = (item.brand || "").toLowerCase();
      const ip = (item.product_name || "").toLowerCase();
      const ic = (item.color_code || "").toLowerCase();

      if (ib === b && ip === p) {
        if (c && ic === c) {
          return { type: "exact" as const, item };
        }
        if (!c || !ic || ic !== c) {
          return { type: "color_variant" as const, item };
        }
      }
    }
    return null;
  }, [brand, productName, colorCode, items, editingId]);

  if (!warning) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
      <div className="text-xs text-amber-700">
        {warning.type === "exact" ? (
          <p>この商品はすでに登録されています</p>
        ) : (
          <p>同じ商品の別カラーとして登録されます</p>
        )}
      </div>
    </div>
  );
}
