"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { InventoryItem } from "@/types/inventory";
import { cn } from "@/lib/utils";

export interface PickedItem {
  item_id: string;
  item_name: string;
  brand: string;
  color_code?: string;
  color_name?: string;
}

interface InventoryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: PickedItem) => void;
}

const CATEGORIES = ["全て", "ベースメイク", "アイメイク", "リップ", "スキンケア", "その他"] as const;

export function InventoryPickerSheet({ open, onOpenChange, onSelect }: InventoryPickerSheetProps) {
  const { data } = useSWR<{ items: InventoryItem[] }>(open ? "/api/inventory" : null, fetcher);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("全て");

  const items = useMemo(() => {
    let result = data?.items ?? [];
    if (category !== "全て") {
      result = result.filter((item) => item.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.brand?.toLowerCase().includes(q) ||
          item.product_name?.toLowerCase().includes(q) ||
          item.color_code?.toLowerCase().includes(q) ||
          item.color_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data?.items, query, category]);

  const handleSelect = (item: InventoryItem) => {
    onSelect({
      item_id: item.id,
      item_name: item.product_name,
      brand: item.brand,
      color_code: item.color_code,
      color_name: item.color_name,
    });
    onOpenChange(false);
    setQuery("");
    setCategory("全て");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[85dvh] overflow-hidden shadow-xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display italic text-2xl text-text-ink">アイテムを選択</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ブランド名・商品名で検索..."
            className="pl-9 rounded-full bg-gray-50 border-gray-200 focus:border-neon-accent"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto py-2 flex-shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border btn-squishy",
                category === cat
                  ? "bg-text-ink text-white border-text-ink"
                  : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {items.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-8">
              {data ? "アイテムが見つかりません" : "読み込み中..."}
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {(item.image_url || item.rakuten_image_url) ? (
                    <img
                      src={item.image_url || item.rakuten_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-text-muted">
                      {item.category?.charAt(0)}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-muted font-bold">{item.brand}</p>
                  <p className="text-sm font-bold text-text-ink truncate">{item.product_name}</p>
                  {(item.color_code || item.color_name) && (
                    <p className="text-[10px] text-neon-accent">
                      {[item.color_code, item.color_name].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
