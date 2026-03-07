"use client";

import { useMemo } from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

export type DuplicateType = "exact" | "color_variant" | null;

interface DuplicateWarningProps {
  brand: string;
  productName: string;
  colorCode?: string;
  items: InventoryItem[];
  /** Item ID being edited (exclude from check) */
  editingId?: string;
}

export function useDuplicateCheck(
  brand: string,
  productName: string,
  colorCode: string | undefined,
  items: InventoryItem[],
  editingId?: string,
): DuplicateType {
  return useMemo(() => {
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
          return "exact";
        }
        if (!c || !ic || ic !== c) {
          return "color_variant";
        }
      }
    }
    return null;
  }, [brand, productName, colorCode, items, editingId]);
}

export function DuplicateWarning({
  brand,
  productName,
  colorCode,
  items,
  editingId,
}: DuplicateWarningProps) {
  const warning = useDuplicateCheck(brand, productName, colorCode, items, editingId);

  if (!warning) return null;

  if (warning === "exact") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
        <div className="text-xs text-red-700">
          <p>このコスメはすでにMy Cosmeに登録されています</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
      <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
      <div className="text-xs text-blue-700">
        <p>同じ商品の別カラーがMy Cosmeにあります（登録可能）</p>
      </div>
    </div>
  );
}
