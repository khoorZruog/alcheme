"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, ChevronDown, RefreshCw, Palette } from "lucide-react";
import { toast } from "sonner";
import { MainTabHeader } from "@/components/main-tab-header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import { CatalogDetailSheet } from "@/components/catalog-detail-sheet";
import { CatalogRankingCard } from "@/components/catalog-ranking-card";
import { ColorMatchCard } from "@/components/color-match-card";
import { ColorPicker } from "@/components/color-picker";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { useCatalogBrowse, type CatalogSortKey } from "@/hooks/use-catalog-browse";
import { useColorSearch } from "@/hooks/use-color-search";
import { useInventory } from "@/hooks/use-inventory";
import { cn } from "@/lib/utils";
import type { CatalogEntry } from "@/types/catalog";
import type { CosmeCategory, InventoryItem } from "@/types/inventory";

type BrowseCategory = CosmeCategory | "全て";

const BROWSE_CATEGORIES: { value: BrowseCategory; label: string }[] = [
  { value: "全て", label: "全て" },
  { value: "ベースメイク", label: "ベースメイク" },
  { value: "アイメイク", label: "アイメイク" },
  { value: "リップ", label: "リップ" },
  { value: "スキンケア", label: "スキンケア" },
  { value: "その他", label: "その他" },
];

const SORT_OPTIONS: { value: CatalogSortKey; label: string }[] = [
  { value: "have_count", label: "所有者数順" },
  { value: "use_count", label: "活用回数順" },
  { value: "want_count", label: "欲しい順" },
];

export default function CommunitySearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BrowseCategory>("全て");
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<CatalogSortKey>("have_count");
  const [detailEntry, setDetailEntry] = useState<CatalogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [isColorMode, setIsColorMode] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#C24B5A");
  const [colorCategory, setColorCategory] = useState<BrowseCategory>("全て");

  const isSearching = query.trim().length >= 2;

  // Inventory for ownership check
  const { items: inventoryItems } = useInventory();

  // Search mode
  const { results: searchResults, isLoading: searchLoading } = useCatalogSearch(query);

  // Browse mode
  const {
    results: browseResults,
    topBrands,
    isLoading: browseLoading,
    isLoadingMore,
    hasMore,
    isEmpty: browseEmpty,
    loadMore,
    mutate: mutateBrowse,
  } = useCatalogBrowse(
    isSearching ? undefined : category === "全て" ? null : category,
    brand,
    sort,
  );

  // Color search mode
  const {
    results: colorResults,
    isLoading: colorLoading,
    isEmpty: colorEmpty,
    totalWithColor,
  } = useColorSearch(
    isColorMode ? selectedColor : null,
    colorCategory === "全て" ? null : colorCategory,
  );

  // Auto-backfill: when catalog is empty on first load, backfill user's products
  const backfillAttempted = useRef(false);
  const [isBackfilling, setIsBackfilling] = useState(false);

  useEffect(() => {
    if (backfillAttempted.current || browseLoading || isSearching || !browseEmpty) return;
    backfillAttempted.current = true;
    setIsBackfilling(true);
    fetch("/api/catalog/backfill", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.upserted > 0) {
          toast.success(`${data.upserted}件の商品をカタログに追加しました`);
          mutateBrowse();
        }
      })
      .catch(() => {})
      .finally(() => setIsBackfilling(false));
  }, [browseLoading, browseEmpty, isSearching, mutateBrowse]);

  const handleSelect = useCallback((entry: CatalogEntry) => {
    setDetailEntry(entry);
    setDetailOpen(true);
  }, []);

  const handleRegister = useCallback((entry: CatalogEntry) => {
    setDetailOpen(false);
    const item: InventoryItem = {
      id: "",
      category: (entry.category ?? "") as InventoryItem["category"],
      item_type: entry.item_type ?? "",
      brand: entry.brand,
      product_name: entry.product_name,
      color_code: entry.color_code,
      color_name: entry.color_name,
      color_description: entry.color_description ?? "",
      texture: (entry.texture ?? "") as InventoryItem["texture"],
      estimated_remaining: "100%",
      pao_months: entry.pao_months,
      price: entry.price,
      product_url: entry.product_url,
      image_url: entry.image_url,
      rakuten_image_url: entry.rakuten_image_url,
      confidence: "high",
      source: "カタログ",
      created_at: "",
      updated_at: "",
    };
    setEditItem(item);
    setEditOpen(true);
  }, []);

  const isEntryOwned = useCallback((entry: CatalogEntry | null) => {
    if (!entry) return false;
    const b = (entry.brand || "").toLowerCase();
    const p = (entry.product_name || "").toLowerCase();
    const c = (entry.color_code || "").toLowerCase();
    return inventoryItems.some((item) => {
      const ib = (item.brand || "").toLowerCase();
      const ip = (item.product_name || "").toLowerCase();
      const ic = (item.color_code || "").toLowerCase();
      return ib === b && ip === p && (!c || !ic || ic === c);
    });
  }, [inventoryItems]);

  const handleSave = async (updates: Partial<InventoryItem>) => {
    if (!editItem) return;
    const item = { ...editItem, ...updates };

    try {
      const res = await fetch("/api/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [item] }),
      });
      if (!res.ok) throw new Error();
      toast.success("コスメを登録しました！");
      mutateBrowse();
      router.push("/inventory");
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return (
    <div>
      <MainTabHeader title="発見" subtitle="DISCOVER" />

      <div className="px-4 py-4 space-y-3">
        {/* Search bar + Color mode toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (e.target.value) setIsColorMode(false); }}
              placeholder="ブランド名、商品名で検索..."
              className="pl-10 rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
              disabled={isColorMode}
            />
          </div>
          <button
            type="button"
            onClick={() => { setIsColorMode(!isColorMode); setQuery(""); }}
            className={cn(
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all btn-squishy",
              isColorMode
                ? "bg-neon-accent text-white border-neon-accent"
                : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
            )}
            aria-label="色で探す"
          >
            <Palette className="h-4 w-4" />
          </button>
        </div>

        {/* Color search mode */}
        {isColorMode && (
          <>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
            />
            {/* Category tabs for color mode */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {BROWSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setColorCategory(cat.value as BrowseCategory)}
                  className={cn(
                    "shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                    colorCategory === cat.value
                      ? "bg-text-ink text-white border-text-ink"
                      : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Color search results */}
            {colorLoading && <InventoryGridSkeleton />}

            {!colorLoading && colorEmpty && (
              <div className="py-12 text-center space-y-2">
                <Palette className="h-10 w-10 text-text-muted/30 mx-auto" />
                <p className="text-sm text-text-muted">
                  色データのある商品がまだありません
                </p>
                <p className="text-xs text-text-muted">
                  商品をスキャンすると自動的に色が登録されます
                </p>
              </div>
            )}

            {!colorLoading && colorResults.length > 0 && (
              <>
                <p className="text-xs text-text-muted">
                  {colorCategory === "全て" ? "全カテゴリ" : colorCategory} — {colorResults.length}件マッチ（{totalWithColor}件中）
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {colorResults.slice(0, 30).map((entry) => (
                    <ColorMatchCard
                      key={entry.id}
                      entry={entry}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Browse mode controls (hidden during search or color mode) */}
        {!isSearching && !isColorMode && (
          <>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {BROWSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value as BrowseCategory); setBrand(null); }}
                  className={cn(
                    "shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                    category === cat.value
                      ? "bg-text-ink text-white border-text-ink"
                      : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort tabs */}
            <div className="flex gap-3 border-b border-gray-100 pb-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSort(opt.value)}
                  className={cn(
                    "text-xs pb-1 transition-all",
                    sort === opt.value
                      ? "text-text-ink font-bold border-b-2 border-neon-accent"
                      : "text-text-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Brand filter */}
            {topBrands.length > 0 && (
              <Select value={brand ?? "__all__"} onValueChange={(v) => setBrand(v === "__all__" ? null : v)}>
                <SelectTrigger
                  className={cn(
                    "w-auto px-3 py-1.5 h-auto rounded-full text-xs font-bold border transition-all",
                    brand
                      ? "bg-neon-accent/10 text-neon-accent border-neon-accent/30"
                      : "bg-white text-text-muted border-gray-200"
                  )}
                >
                  <SelectValue placeholder="ブランド" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全てのブランド</SelectItem>
                  {topBrands.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        {/* ── Browse mode content ── */}
        {!isSearching && !isColorMode && (
          <>
            {browseLoading && <InventoryGridSkeleton />}

            {!browseLoading && browseEmpty && (
              <div className="py-12 text-center space-y-3">
                {isBackfilling ? (
                  <>
                    <Loader2 className="h-8 w-8 text-neon-accent animate-spin mx-auto" />
                    <p className="text-sm text-text-muted">既存のコスメをカタログに同期中...</p>
                  </>
                ) : (
                  <>
                    <Users className="h-10 w-10 text-text-muted/30 mx-auto" />
                    <p className="text-sm text-text-muted">まだ商品が登録されていません</p>
                    <button
                      onClick={() => {
                        setIsBackfilling(true);
                        fetch("/api/catalog/backfill", { method: "POST" })
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.upserted > 0) {
                              toast.success(`${data.upserted}件の商品をカタログに追加しました`);
                              mutateBrowse();
                            } else {
                              toast("新しい商品はありませんでした");
                            }
                          })
                          .catch(() => toast.error("同期に失敗しました"))
                          .finally(() => setIsBackfilling(false));
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-neon-accent border border-neon-accent/30 hover:bg-neon-accent/5 transition btn-squishy"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      カタログを同期
                    </button>
                  </>
                )}
              </div>
            )}

            {!browseLoading && browseResults.length > 0 && (
              <>
                <p className="text-xs text-text-muted">
                  {category === "全て" ? "全カテゴリ" : category} ランキング — {browseResults.length}件
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {browseResults.map((entry, idx) => (
                    <CatalogRankingCard
                      key={entry.id}
                      entry={entry}
                      rank={idx + 1}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full py-3 text-sm text-neon-accent font-bold flex items-center justify-center gap-1 btn-squishy"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        もっと見る
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* ── Search mode content ── */}
        {isSearching && (
          <>
            {searchLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-neon-accent animate-spin mx-auto" />
                  <p className="text-sm text-text-muted">カタログを検索中...</p>
                </div>
              </div>
            )}

            {!searchLoading && searchResults.length === 0 && (
              <div className="py-12 text-center space-y-2">
                <Users className="h-10 w-10 text-text-muted/30 mx-auto" />
                <p className="text-sm text-text-muted">該当する商品が見つかりませんでした</p>
                <p className="text-xs text-text-muted">
                  別のキーワードで検索するか、他の登録方法をお試しください
                </p>
              </div>
            )}

            {!searchLoading && searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">
                  {searchResults.length}件の商品 — タップして登録
                </p>
                {searchResults.map((entry) => {
                  const colorInfo = [entry.color_code, entry.color_name].filter(Boolean).join(" ");
                  return (
                    <button
                      key={entry.id}
                      onClick={() => handleSelect(entry)}
                      className="w-full glass-card rounded-2xl p-3 flex gap-3 text-left hover:bg-white/80 transition btn-squishy"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                        {entry.image_url || entry.rakuten_image_url ? (
                          <img
                            src={entry.image_url || entry.rakuten_image_url}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs text-text-muted">{entry.brand}</p>
                        <p className="text-sm font-medium text-text-ink line-clamp-1 leading-tight">
                          {entry.product_name}
                        </p>
                        {colorInfo && (
                          <p className="text-xs text-text-muted">{colorInfo}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          {entry.category && (
                            <span className="px-1.5 py-0.5 rounded-full bg-surface-cream/80 text-[10px]">
                              {entry.category}
                            </span>
                          )}
                          <span>
                            <Users className="inline h-3 w-3 mr-0.5" />
                            {entry.contributor_count}人が登録
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <CatalogDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRegister={handleRegister}
        isOwned={isEntryOwned(detailEntry)}
      />

      <ItemEditSheet
        item={editItem}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
