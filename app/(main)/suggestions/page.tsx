"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, Search, SlidersHorizontal, ArrowUpDown, X, Package,
  Plus, CheckSquare, PenLine, Scale, LayoutGrid, List,
} from "lucide-react";
import { MainTabHeader } from "@/components/main-tab-header";
import { SuggestionListItem } from "@/components/suggestion-list-item";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { SuggestionHistorySheet } from "@/components/suggestion-history-sheet";
import { SuggestionCompareSheet } from "@/components/suggestion-compare-sheet";
import { useSuggestions, SUGGESTION_SORT_OPTIONS } from "@/hooks/use-suggestions";
import { cn } from "@/lib/utils";
import type { SuggestedItem } from "@/types/suggestion";

const STATUS_OPTIONS = [
  { value: "全て" as const, label: "全て" },
  { value: "候補" as const, label: "候補" },
  { value: "購入済み" as const, label: "購入済み" },
  { value: "見送り" as const, label: "見送り" },
];

const BULK_STATUS_OPTIONS: { value: "候補" | "購入済み" | "見送り"; label: string }[] = [
  { value: "候補", label: "候補" },
  { value: "購入済み", label: "購入済み" },
  { value: "見送り", label: "見送り" },
];

function SuggestionCard({
  item,
  onClick,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  item: SuggestedItem;
  onClick: () => void;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  return (
    <button
      onClick={selectionMode ? onToggleSelect : onClick}
      className={cn(
        "w-full glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer text-left",
        selected && "ring-2 ring-neon-accent"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-20">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            selected ? "bg-neon-accent border-neon-accent" : "border-gray-300 bg-white"
          )}>
            {selected && <CheckSquare className="h-3 w-3 text-white" />}
          </div>
        </div>
      )}

      {/* Recommendation badge */}
      {item.recommendation_count > 1 && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-neon-accent text-white text-[10px] font-bold shadow-lg">
            x{item.recommendation_count}
          </span>
        </div>
      )}

      {/* Status + source badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <span className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-bold",
          item.status === "候補" && "bg-blue-100 text-blue-700",
          item.status === "購入済み" && "bg-green-100 text-green-700",
          item.status === "見送り" && "bg-gray-100 text-gray-600",
        )}>
          {item.status}
        </span>
        {item.source === "manual" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-accent/10 text-neon-accent flex items-center gap-0.5">
            <PenLine className="h-2.5 w-2.5" />
            手動
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative w-full aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-8 w-8 text-black/10" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-1">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider truncate">
          {item.brand}
        </p>
        <h3 className="text-sm font-bold text-text-ink leading-tight mb-1 line-clamp-2">
          {item.product_name}
        </h3>
        {(item.color_code || item.color_name) && (
          <p className="text-[10px] text-text-muted truncate mb-1">
            {item.color_code && <span className="font-bold text-neon-accent">#{item.color_code}</span>}
            {item.color_code && item.color_name && " "}
            {item.color_name}
          </p>
        )}
        {item.price_range && (
          <p className="text-[10px] text-text-muted mb-1">{item.price_range}</p>
        )}
      </div>
    </button>
  );
}

export default function SuggestionsPage() {
  const {
    items, count, filteredCount, isLoading, error, mutate,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    statusFilter, setStatusFilter,
    brandFilter, setBrandFilter, brands,
    activeFilterCount,
  } = useSuggestions();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SuggestedItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Selection mode for compare & bulk actions
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("suggestions-view") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      localStorage.setItem("suggestions-view", next);
      return next;
    });
  }, []);

  const resetFilters = () => {
    setSortBy("recommendation");
    setStatusFilter("全て");
    setBrandFilter("全て");
  };

  const handleUpdateStatus = async (id: string, status: "候補" | "購入済み" | "見送り") => {
    await fetch(`/api/suggestions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setHistoryOpen(false);
    mutate();
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkStatus = async (status: "候補" | "購入済み" | "見送り") => {
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/suggestions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          })
        )
      );
      exitSelectionMode();
      mutate();
    } finally {
      setProcessing(false);
      setBulkStatusOpen(false);
    }
  };

  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <MainTabHeader
        title="買い足し"
        subtitle={`${count} 候補${filteredCount !== count ? ` ・ ${filteredCount} 表示` : ""}`}
        rightElement={
          <>
            <button
              onClick={toggleViewMode}
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy"
              aria-label={viewMode === "grid" ? "リスト表示" : "グリッド表示"}
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                if (selectionMode) {
                  exitSelectionMode();
                } else {
                  setSelectionMode(true);
                }
              }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition btn-squishy",
                selectionMode
                  ? "bg-neon-accent text-white"
                  : "bg-white/50 hover:bg-white text-text-ink"
              )}
              aria-label="選択モード"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="relative w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy"
              aria-label="フィルタ・並び替え"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-neon-accent text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy"
              aria-label="検索"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/suggestions/add"
              className="w-10 h-10 rounded-full bg-neon-accent text-white flex items-center justify-center shadow-lg btn-squishy"
              aria-label="候補を追加"
            >
              <Plus size={18} />
            </Link>
          </>
        }
      />

      {/* Selection mode bar */}
      {selectionMode && (
        <div className="sticky top-16 z-20 px-4 py-2 bg-neon-accent/10 backdrop-blur-lg border-b border-neon-accent/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neon-accent">
              {selectedIds.size}件選択中
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={exitSelectionMode}
                className="text-xs text-text-muted hover:text-text-ink transition"
              >
                キャンセル
              </button>
              {selectedIds.size >= 2 && selectedIds.size <= 3 && (
                <button
                  onClick={() => setCompareOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neon-accent text-white text-xs font-bold btn-squishy"
                >
                  <Scale className="h-3 w-3" />
                  比較
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          {statusFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {statusFilter}
              <button onClick={() => setStatusFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {brandFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {brandFilter}
              <button onClick={() => setBrandFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {sortBy !== "recommendation" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <ArrowUpDown className="h-3 w-3" />
              {SUGGESTION_SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <button onClick={() => setSortBy("recommendation")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={resetFilters} className="text-xs text-text-muted hover:text-text-ink transition">
            すべて解除
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted mb-3">読み込みに失敗しました</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-button bg-neon-accent px-6 py-2 text-sm font-medium text-white"
            >
              再読み込み
            </button>
          </div>
        ) : isLoading ? (
          <InventoryGridSkeleton />
        ) : items.length === 0 && count === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12" />}
            title="買い足し候補がありません"
            description="チャットでメイクの相談をすると候補が提案されます。手動でも追加できます"
            action={
              <Link href="/suggestions/add">
                <button className="rounded-button bg-neon-accent px-6 py-2 text-sm font-medium text-white">
                  候補を追加
                </button>
              </Link>
            }
          />
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted">条件に一致する候補がありません</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <SuggestionCard
                key={item.id}
                item={item}
                onClick={() => { setSelectedItem(item); setHistoryOpen(true); }}
                selectionMode={selectionMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <SuggestionListItem
                key={item.id}
                item={item}
                onClick={() => { setSelectedItem(item); setHistoryOpen(true); }}
                selectionMode={selectionMode}
                selected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelect(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
          <div className="mx-auto max-w-lg bg-text-ink rounded-2xl shadow-xl p-3 flex items-center gap-3">
            <span className="text-white text-sm font-bold ml-2 shrink-0">
              {selectedIds.size}件選択
            </span>
            <div className="flex-1" />
            {selectedIds.size >= 2 && selectedIds.size <= 3 && (
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition btn-squishy"
              >
                <Scale className="h-3.5 w-3.5" />
                比較
              </button>
            )}
            <button
              onClick={() => setBulkStatusOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition btn-squishy"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              ステータス
            </button>
            <button onClick={exitSelectionMode} className="p-2 text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Status Dialog */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ステータスを一括変更</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted">
            {selectedIds.size}件の候補のステータスを変更します
          </p>
          <div className="grid grid-cols-3 gap-2">
            {BULK_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleBulkStatus(opt.value)}
                disabled={processing}
                className={cn(
                  "py-3 rounded-xl text-sm font-bold border transition btn-squishy",
                  opt.value === "候補" && "border-blue-200 text-blue-700 hover:bg-blue-50",
                  opt.value === "購入済み" && "border-green-200 text-green-700 hover:bg-green-50",
                  opt.value === "見送り" && "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                {processing ? "..." : opt.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Sheet */}
      <SuggestionHistorySheet
        item={selectedItem}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Compare Sheet */}
      <SuggestionCompareSheet
        items={selectedItems}
        open={compareOpen}
        onClose={() => { setCompareOpen(false); exitSelectionMode(); }}
      />

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[80dvh] overflow-y-auto shadow-xl">
          <SheetHeader>
            <SheetTitle className="font-display italic text-2xl text-text-ink">フィルタ・並び替え</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-4">
            {/* Sort */}
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                <ArrowUpDown className="h-3 w-3 inline mr-1" />
                並び替え
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTION_SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                      sortBy === opt.value
                        ? "bg-text-ink text-white border-text-ink"
                        : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                ステータス
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                      statusFilter === opt.value
                        ? "bg-text-ink text-white border-text-ink"
                        : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                  ブランド
                </p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBrandFilter("全て")}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                        brandFilter === "全て"
                          ? "bg-text-ink text-white border-text-ink"
                          : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                      )}
                    >
                      全て
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBrandFilter(b)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                          brandFilter === b
                            ? "bg-text-ink text-white border-text-ink"
                            : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-text-ink border border-gray-200 hover:border-neon-accent transition btn-squishy"
              >
                リセット
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-neon-accent shadow-lg btn-squishy"
              >
                適用
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-4 translate-y-0 glass-panel border-white/50 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display italic text-2xl">Search</DialogTitle>
          </DialogHeader>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ブランド名、商品名、品番..."
            className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
            autoFocus
          />
          {searchQuery && (
            <p className="text-xs text-text-muted">
              {filteredCount}件の結果
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
