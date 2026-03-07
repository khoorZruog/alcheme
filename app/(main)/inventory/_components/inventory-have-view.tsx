"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Package, SlidersHorizontal, ArrowUpDown, X, CheckSquare, LayoutGrid, List, Search, Layers, LayoutList } from "lucide-react";
import { AddMethodSheet } from "@/components/add-method-sheet";
import { ProductGroupCard } from "@/components/product-group-card";
import { VariantSheet } from "@/components/variant-sheet";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { CosmeListItem, ProductGroupListItem } from "@/components/cosme-list-item";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInventory, SORT_OPTIONS } from "@/hooks/use-inventory";
import { useCosmeInsights } from "@/hooks/use-cosme-insights";
import { CosmeCard } from "@/components/cosme-card";
import { CosmeInsightsCard } from "@/components/cosme-insights-card";
import { CategoryFilter, type Category } from "@/components/category-filter";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { cn } from "@/lib/utils";
import type { CosmeTexture, ProductGroup } from "@/types/inventory";

const TEXTURES: { value: CosmeTexture | "全て"; label: string }[] = [
  { value: "全て", label: "全て" },
  { value: "マット", label: "マット" },
  { value: "ツヤ", label: "ツヤ" },
  { value: "サテン", label: "サテン" },
  { value: "シマー", label: "シマー" },
  { value: "クリーム", label: "クリーム" },
  { value: "パウダー", label: "パウダー" },
  { value: "リキッド", label: "リキッド" },
];

export function InventoryHaveView() {
  const {
    filteredItems, isLoading, error, filter, setFilter,
    filterMode, setFilterMode, itemTypeFilter, setItemTypeFilter, itemTypes,
    searchQuery, setSearchQuery, count,
    sortBy, setSortBy, textureFilter, setTextureFilter, activeFilterCount,
    gridEntries, brands, brandFilter, setBrandFilter,
    groupMode, setGroupMode,
  } = useInventory();

  const { insights } = useCosmeInsights();
  const router = useRouter();

  const handleInsightTap = useCallback(
    (insight: { item: { id: string } }) => {
      router.push(`/chat?suggest_item=${insight.item.id}`);
    },
    [router],
  );

  // Read category from URL params (from MyPage category badges)
  const searchParams = useSearchParams();
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setFilter(categoryParam as Category);
      setFilterMode("category");
    }
  }, [searchParams, setFilter, setFilterMode]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ProductGroup | null>(null);
  const [variantSheetOpen, setVariantSheetOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("inventory-view") as "grid" | "list") || "grid";
    }
    return "grid";
  });

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      localStorage.setItem("inventory-view", next);
      return next;
    });
  }, []);

  const toggleGroupMode = useCallback(() => {
    setGroupMode((prev) => {
      const next = prev === "grouped" ? "expanded" : "grouped";
      localStorage.setItem("inventory-group-mode", next);
      return next;
    });
  }, [setGroupMode]);

  const handleGroupTap = (group: ProductGroup) => {
    if (selectionMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const allSelected = group.variants.every((v) => next.has(v.id));
        group.variants.forEach((v) => {
          if (allSelected) next.delete(v.id); else next.add(v.id);
        });
        return next;
      });
      return;
    }
    setSelectedGroup(group);
    setVariantSheetOpen(true);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set<string>();
    for (const entry of gridEntries) {
      if (entry.type === "single") {
        allIds.add(entry.item.id);
      } else {
        entry.group.variants.forEach((v) => allIds.add(v.id));
      }
    }
    setSelectedIds(allIds);
  }, [gridEntries]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = async () => {
    await fetch("/api/inventory/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: Array.from(selectedIds) }),
    });
    exitSelectionMode();
    window.location.reload();
  };

  const handleBulkRemaining = async (value: string) => {
    await fetch("/api/inventory/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", ids: Array.from(selectedIds), updates: { estimated_remaining: value } }),
    });
    exitSelectionMode();
    window.location.reload();
  };

  const parseRemaining = (str: string | null | undefined): number => {
    if (!str) return 50;
    const num = parseInt(str.replace("%", ""), 10);
    return isNaN(num) ? 50 : num;
  };

  const resetFilters = () => {
    setSortBy("newest");
    setTextureFilter("全て");
    setBrandFilter("全て");
    setItemTypeFilter("全て");
  };

  return (
    <>
      {/* Cosme usage insights */}
      {insights.length > 0 && (
        <div className="px-4 pt-2">
          <CosmeInsightsCard insights={insights} onTap={handleInsightTap} />
        </div>
      )}

      {/* Filter mode toggle + action buttons */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-2">
        <div className="inline-flex rounded-full bg-white/50 p-0.5 text-[11px] shrink-0">
          <button onClick={() => setFilterMode("category")} className={cn("px-3 py-1 rounded-full font-bold transition-all", filterMode === "category" ? "bg-text-ink text-white shadow-sm" : "text-text-muted hover:text-text-ink")}>カテゴリ</button>
          <button onClick={() => setFilterMode("brand")} className={cn("px-3 py-1 rounded-full font-bold transition-all", filterMode === "brand" ? "bg-text-ink text-white shadow-sm" : "text-text-muted hover:text-text-ink")}>ブランド</button>
        </div>
        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <button onClick={toggleGroupMode} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition btn-squishy", groupMode === "expanded" ? "bg-neon-accent/15 text-neon-accent" : "bg-white/50 text-text-ink hover:bg-white")} aria-label={groupMode === "grouped" ? "展開表示" : "まとめ表示"} title={groupMode === "grouped" ? "色展開" : "型番まとめ"}>
            {groupMode === "grouped" ? <LayoutList className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
          </button>
          <button onClick={toggleViewMode} className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy" aria-label={viewMode === "grid" ? "リスト表示" : "グリッド表示"}>
            {viewMode === "grid" ? <List className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)} className={cn("w-8 h-8 rounded-full flex items-center justify-center transition btn-squishy", selectionMode ? "bg-neon-accent text-white" : "bg-white/50 text-text-ink hover:bg-white")} aria-label="管理">
            <CheckSquare className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setFilterOpen(true)} className="relative w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy" aria-label="フィルタ">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {activeFilterCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-neon-accent text-white text-[8px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
          </button>
          <button onClick={() => setSearchOpen(true)} className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy" aria-label="検索">
            <Search className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setAddOpen(true)} className="w-8 h-8 rounded-full bg-neon-accent text-white flex items-center justify-center shadow-lg btn-squishy" aria-label="追加">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Level 1 pills — category or brand */}
      <div className="px-4 pb-1">
        {filterMode === "category" ? (
          <CategoryFilter value={filter as Category} onChange={(c) => { setFilter(c); setItemTypeFilter("全て"); }} />
        ) : (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            <button onClick={() => setBrandFilter("全て")} className={cn("shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", brandFilter === "全て" ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>全て</button>
            {brands.map((b) => (
              <button key={b} onClick={() => setBrandFilter(b)} className={cn("shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", brandFilter === b ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>{b}</button>
            ))}
          </div>
        )}
      </div>

      {/* Level 2 chips — item_type sub-filter (category mode only) */}
      {filterMode === "category" && filter !== "全て" && itemTypes.length > 1 && (
        <div className="px-4 pb-1">
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
            <button onClick={() => setItemTypeFilter("全て")} className={cn("shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border btn-squishy", itemTypeFilter === "全て" ? "bg-neon-accent text-white border-neon-accent" : "bg-white/70 text-text-muted border-gray-200 hover:border-neon-accent")}>全て</button>
            {itemTypes.map((t) => (
              <button key={t} onClick={() => setItemTypeFilter(t)} className={cn("shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border btn-squishy", itemTypeFilter === t ? "bg-neon-accent text-white border-neon-accent" : "bg-white/70 text-text-muted border-gray-200 hover:border-neon-accent")}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="px-4 pt-1 flex items-center gap-2 flex-wrap">
          {filterMode === "category" && brandFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {brandFilter}
              <button onClick={() => setBrandFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {filterMode === "category" && itemTypeFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {itemTypeFilter}
              <button onClick={() => setItemTypeFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {textureFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {textureFilter}
              <button onClick={() => setTextureFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {sortBy !== "newest" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <ArrowUpDown className="h-3 w-3" />
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <button onClick={() => setSortBy("newest")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={resetFilters} className="text-xs text-text-muted hover:text-text-ink transition">すべて解除</button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-3">
        {error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted mb-3">コスメの読み込みに失敗しました</p>
            <button onClick={() => window.location.reload()} className="rounded-button bg-neon-accent px-6 py-2 text-sm font-medium text-white">再読み込み</button>
          </div>
        ) : isLoading ? (
          <InventoryGridSkeleton />
        ) : gridEntries.length === 0 ? (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="コスメが登録されていません"
            description="コスメをスキャンして、在庫に登録しましょう"
            action={
              <button onClick={() => setAddOpen(true)} className="btn-squishy h-12 px-8 rounded-2xl relative overflow-hidden shadow-neon-glow group">
                <div className="absolute inset-0 bg-linear-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 text-white font-body font-bold tracking-wider">コスメを追加</div>
              </button>
            }
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {gridEntries.map((entry) =>
              entry.type === "single" ? (
                <CosmeCard key={entry.item.id} itemId={entry.item.id} brand={entry.item.brand} productName={entry.item.product_name} imageUrl={entry.item.image_url} rakutenImageUrl={entry.item.rakuten_image_url} price={entry.item.price} category={entry.item.category} remainingPercent={parseRemaining(entry.item.estimated_remaining)} colorCode={entry.item.color_code} colorName={entry.item.color_name} selectionMode={selectionMode} selected={selectedIds.has(entry.item.id)} onSelect={() => toggleSelect(entry.item.id)} />
              ) : (
                <ProductGroupCard key={entry.group.groupKey} group={entry.group} onClick={() => handleGroupTap(entry.group)} selectionMode={selectionMode} selected={entry.group.variants.every((v) => selectedIds.has(v.id))} />
              )
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-white/40 divide-y divide-gray-100">
            {gridEntries.map((entry) =>
              entry.type === "single" ? (
                <CosmeListItem key={entry.item.id} itemId={entry.item.id} brand={entry.item.brand} productName={entry.item.product_name} imageUrl={entry.item.image_url} rakutenImageUrl={entry.item.rakuten_image_url} category={entry.item.category} remainingPercent={parseRemaining(entry.item.estimated_remaining)} colorCode={entry.item.color_code} colorName={entry.item.color_name} selectionMode={selectionMode} selected={selectedIds.has(entry.item.id)} onSelect={() => toggleSelect(entry.item.id)} />
              ) : (
                <ProductGroupListItem key={entry.group.groupKey} groupKey={entry.group.groupKey} brand={entry.group.representative.brand} productName={entry.group.representative.product_name} variantCount={entry.group.variants.length} imageUrl={entry.group.representative.image_url} rakutenImageUrl={entry.group.representative.rakuten_image_url} minRemaining={entry.group.minRemaining} onClick={() => handleGroupTap(entry.group)} selectionMode={selectionMode} selected={entry.group.variants.every((v) => selectedIds.has(v.id))} />
              )
            )}
          </div>
        )}
      </div>

      <AddMethodSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <VariantSheet group={selectedGroup} open={variantSheetOpen} onClose={() => setVariantSheetOpen(false)} />

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-3xl border-t border-gray-100 pb-10 max-h-[80dvh] overflow-y-auto shadow-xl">
          <SheetHeader><SheetTitle className="font-display italic text-2xl text-text-ink">フィルタ・並び替え</SheetTitle></SheetHeader>
          <div className="space-y-6 mt-4">
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3"><ArrowUpDown className="h-3 w-3 inline mr-1" />並び替え</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", sortBy === opt.value ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">テクスチャ</p>
              <div className="flex flex-wrap gap-2">
                {TEXTURES.map((t) => (
                  <button key={t.value} onClick={() => setTextureFilter(t.value)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", textureFilter === t.value ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>{t.label}</button>
                ))}
              </div>
            </div>
            {filterMode === "category" && brands.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">ブランド</p>
                <div className="max-h-32 overflow-y-auto"><div className="flex flex-wrap gap-2">
                  <button onClick={() => setBrandFilter("全て")} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", brandFilter === "全て" ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>全て</button>
                  {brands.map((b) => (<button key={b} onClick={() => setBrandFilter(b)} className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy", brandFilter === b ? "bg-text-ink text-white border-text-ink" : "bg-white text-text-muted border-gray-200 hover:border-neon-accent")}>{b}</button>))}
                </div></div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={resetFilters} className="flex-1 py-3 rounded-2xl text-sm font-bold text-text-ink border border-gray-200 hover:border-neon-accent transition btn-squishy">リセット</button>
              <button onClick={() => setFilterOpen(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-neon-accent shadow-lg btn-squishy">適用</button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {selectionMode && <BulkActionBar selectedCount={selectedIds.size} totalCount={filteredItems.length} onDelete={handleBulkDelete} onUpdateRemaining={handleBulkRemaining} onCancel={exitSelectionMode} onSelectAll={selectAll} onDeselectAll={deselectAll} />}

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-4 translate-y-0 glass-panel border-white/50 rounded-3xl">
          <DialogHeader><DialogTitle className="font-display italic text-2xl">Search</DialogTitle></DialogHeader>
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ブランド名、商品名、色..." className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent" autoFocus />
          {searchQuery && <p className="text-xs text-text-muted">{filteredItems.length}件の結果</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
