"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { ItemEditSheet } from "@/components/item-edit-sheet";
import { CatalogRankingCard } from "@/components/catalog-ranking-card";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { useCatalogSearch } from "@/hooks/use-catalog-search";
import { useCatalogBrowse, type CatalogSortKey } from "@/hooks/use-catalog-browse";
import { cn } from "@/lib/utils";
import type { CatalogEntry } from "@/types/catalog";
import type { CosmeCategory, InventoryItem } from "@/types/inventory";

const BROWSE_CATEGORIES: { value: CosmeCategory; label: string }[] = [
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
  const [category, setCategory] = useState<CosmeCategory>("リップ");
  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState<CatalogSortKey>("have_count");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const isSearching = query.trim().length >= 2;

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
  } = useCatalogBrowse(isSearching ? null : category, brand, sort);

  const handleSelect = useCallback((entry: CatalogEntry) => {
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
      router.push("/inventory");
    } catch {
      toast.error("登録に失敗しました");
    }
  };

  return (
    <div>
      <PageHeader title="みんなのコスメから追加" backHref="/inventory" />

      <div className="px-4 py-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ブランド名、商品名で検索..."
            className="pl-10 rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
          />
        </div>

        {/* Browse mode controls (hidden during search) */}
        {!isSearching && (
          <>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {BROWSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setBrand(null); }}
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

            {/* Brand pills */}
            {topBrands.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                <button
                  onClick={() => setBrand(null)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                    !brand
                      ? "bg-neon-accent/10 text-neon-accent border-neon-accent/30"
                      : "bg-white text-text-muted border-gray-200"
                  )}
                >
                  全て
                </button>
                {topBrands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(brand === b ? null : b)}
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border",
                      brand === b
                        ? "bg-neon-accent/10 text-neon-accent border-neon-accent/30"
                        : "bg-white text-text-muted border-gray-200"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Browse mode content ── */}
        {!isSearching && (
          <>
            {browseLoading && <InventoryGridSkeleton />}

            {!browseLoading && browseEmpty && (
              <div className="py-12 text-center space-y-2">
                <Users className="h-10 w-10 text-text-muted/30 mx-auto" />
                <p className="text-sm text-text-muted">まだ商品が登録されていません</p>
              </div>
            )}

            {!browseLoading && browseResults.length > 0 && (
              <>
                <p className="text-xs text-text-muted">
                  {category} ランキング — {browseResults.length}件
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

      <ItemEditSheet
        item={editItem}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
