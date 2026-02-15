"use client";

import { useState, useMemo } from "react";
import { Search, X, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { InventoryItem } from "@/types/inventory";
import { cn } from "@/lib/utils";

const MAX_BEST_COSME = 10;

interface BestCosmePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSave: (itemIds: string[]) => void;
}

export function BestCosmePickerSheet({
  open,
  onOpenChange,
  selectedIds,
  onSave,
}: BestCosmePickerSheetProps) {
  const { data } = useSWR<{ items: InventoryItem[] }>(
    open ? "/api/inventory" : null,
    fetcher
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  // Reset selection when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelected(new Set(selectedIds));
      setQuery("");
    }
    onOpenChange(isOpen);
  };

  const items = useMemo(() => {
    let result = data?.items ?? [];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (item) =>
          item.brand?.toLowerCase().includes(q) ||
          item.product_name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data?.items, query]);

  const toggleItem = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else if (next.size < MAX_BEST_COSME) {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[85dvh] overflow-hidden shadow-xl flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="font-display italic text-2xl text-text-ink">
            ベストコスメを選択
          </SheetTitle>
          <p className="text-xs text-text-muted">
            最大{MAX_BEST_COSME}点まで選択できます（{selected.size}/{MAX_BEST_COSME}）
          </p>
        </SheetHeader>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ブランド名・商品名で検索..."
            className="pl-9 rounded-full bg-gray-50 border-gray-200 focus:border-neon-accent"
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

        {/* Item list */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mt-2">
          {items.length === 0 ? (
            <p className="text-center text-sm text-text-muted py-8">
              {data ? "アイテムが見つかりません" : "読み込み中..."}
            </p>
          ) : (
            items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                    isSelected
                      ? "bg-neon-accent/5 border border-neon-accent/20"
                      : "hover:bg-gray-50"
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-neon-accent border-neon-accent"
                        : "border-gray-300"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

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
                    <p className="text-sm font-bold text-text-ink truncate">
                      {item.product_name}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="mt-3 w-full py-3 rounded-full bg-gradient-to-r from-neon-accent to-magic-pink text-white font-medium text-sm btn-squishy"
        >
          保存する
        </button>
      </SheetContent>
    </Sheet>
  );
}
