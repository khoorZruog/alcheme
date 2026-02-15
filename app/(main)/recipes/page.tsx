"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen, ChevronRight, Heart, Search, SlidersHorizontal,
  ArrowUpDown, X, Plus, PenLine, CheckSquare, LayoutGrid, List, Trash2, Package,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MainTabHeader } from "@/components/main-tab-header";
import { RecipeListItem } from "@/components/recipe-list-item";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { useRecipes, RECIPE_SORT_OPTIONS } from "@/hooks/use-recipes";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

function RecipeSummaryCard({
  recipe,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  recipe: Recipe;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const content = (
    <Card
      className={cn(
        "hover:shadow-card-hover transition-shadow",
        selected && "ring-2 ring-neon-accent"
      )}
      onClick={selectionMode ? onToggleSelect : undefined}
    >
      <CardContent className="p-3 space-y-1.5">
        {/* Thumbnail */}
        {recipe.preview_image_url ? (
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2">
            <img
              src={recipe.preview_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            {selectionMode && (
              <div className="absolute top-2 left-2">
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  selected ? "bg-neon-accent border-neon-accent" : "border-white bg-black/20"
                )}>
                  {selected && <CheckSquare className="h-3 w-3 text-white" />}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[4/3] rounded-lg bg-gradient-to-br from-neon-accent/10 to-magic-pink/10 flex items-center justify-center mb-2">
            <BookOpen className="h-8 w-8 text-neon-accent/40" />
            {selectionMode && (
              <div className="absolute top-2 left-2">
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                  selected ? "bg-neon-accent border-neon-accent" : "border-gray-300 bg-white"
                )}>
                  {selected && <CheckSquare className="h-3 w-3 text-white" />}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm font-medium text-text-ink truncate">
          {recipe.recipe_name}
        </p>

        <div className="flex items-center gap-2 text-[10px] text-text-muted flex-wrap">
          {recipe.source === "manual" && (
            <span className="flex items-center gap-0.5 text-neon-accent">
              <PenLine className="h-2.5 w-2.5" />手動
            </span>
          )}
          {recipe.match_score != null && (
            <span>再現度 {recipe.match_score}%</span>
          )}
          <span>{recipe.steps?.length ?? 0}ステップ</span>
          {recipe.is_favorite && (
            <Heart className="h-3 w-3 text-pink-500 fill-current" />
          )}
        </div>

        <p className="text-[10px] text-text-muted">
          {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
        </p>
      </CardContent>
    </Card>
  );

  if (selectionMode) return content;

  return <Link href={`/recipes/${recipe.id}`}>{content}</Link>;
}

export default function RecipesPage() {
  const {
    recipes, count, filteredCount, isLoading, error, mutate,
    searchQuery, setSearchQuery,
    sortBy, setSortBy,
    favoriteOnly, setFavoriteOnly,
    occasionFilter, setOccasionFilter,
    occasions, activeFilterCount,
    itemFilter, setItemFilter, usedItems,
  } = useRecipes();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("recipes-view") as "grid" | "list") || "list";
    }
    return "list";
  });

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "grid" ? "list" : "grid";
      localStorage.setItem("recipes-view", next);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = async () => {
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/recipes/${id}`, { method: "DELETE" })
        )
      );
      exitSelectionMode();
      mutate();
    } finally {
      setProcessing(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleBulkFavorite = async () => {
    setProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/recipes/${id}/favorite`, { method: "POST" })
        )
      );
      exitSelectionMode();
      mutate();
    } finally {
      setProcessing(false);
    }
  };

  const resetFilters = () => {
    setSortBy("newest");
    setFavoriteOnly(false);
    setOccasionFilter("全て");
    setItemFilter("全て");
  };

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <MainTabHeader
        title="レシピ"
        subtitle={`${count} レシピ${filteredCount !== count ? ` ・ ${filteredCount} 表示` : ""}`}
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
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition btn-squishy",
                selectionMode
                  ? "bg-neon-accent text-white"
                  : "bg-white/50 text-text-ink hover:bg-white"
              )}
              aria-label="管理"
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
              href="/recipes/create"
              className="w-10 h-10 rounded-full bg-neon-accent text-white flex items-center justify-center shadow-lg btn-squishy"
              aria-label="レシピ作成"
            >
              <Plus size={18} />
            </Link>
          </>
        }
      />

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 flex-wrap">
          {favoriteOnly && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <Heart className="h-3 w-3 fill-current" />
              お気に入り
              <button onClick={() => setFavoriteOnly(false)} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {occasionFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              {occasionFilter}
              <button onClick={() => setOccasionFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {itemFilter !== "全て" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <Package className="h-3 w-3" />
              {usedItems.find((i) => i.id === itemFilter)?.name}
              <button onClick={() => setItemFilter("全て")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {sortBy !== "newest" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <ArrowUpDown className="h-3 w-3" />
              {RECIPE_SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
              <button onClick={() => setSortBy("newest")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
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
            <p className="text-sm text-text-muted mb-3">レシピの読み込みに失敗しました</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
            >
              再読み込み
            </button>
          </div>
        ) : isLoading ? (
          <InventoryGridSkeleton />
        ) : recipes.length === 0 && count === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="レシピがありません"
            description="チャットでメイクの相談をすると、あなただけのレシピが作成されます"
            action={
              <Link href="/chat">
                <button className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors">
                  チャットで相談
                </button>
              </Link>
            }
          />
        ) : recipes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-text-muted">条件に一致するレシピがありません</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((recipe) => (
              <RecipeSummaryCard
                key={recipe.id}
                recipe={recipe}
                selectionMode={selectionMode}
                selected={selectedIds.has(recipe.id)}
                onToggleSelect={() => toggleSelect(recipe.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                recipe={recipe}
                selectionMode={selectionMode}
                selected={selectedIds.has(recipe.id)}
                onToggleSelect={() => toggleSelect(recipe.id)}
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
            <button
              onClick={handleBulkFavorite}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition btn-squishy"
            >
              <Heart className="h-3.5 w-3.5" />
              お気に入り
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/80 text-white text-xs font-bold hover:bg-red-500 transition btn-squishy"
            >
              <Trash2 className="h-3.5 w-3.5" />
              削除
            </button>
            <button onClick={exitSelectionMode} className="p-2 text-white/60 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedIds.size}件のレシピを削除しますか？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted">
            選択した{selectedIds.size}件のレシピを削除します。この操作は取り消せません。
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-2xl">
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={processing}
              className="rounded-2xl"
            >
              {processing ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter & Sort Sheet */}
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
                {RECIPE_SORT_OPTIONS.map((opt) => (
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

            {/* Favorite Toggle */}
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                お気に入り
              </p>
              <button
                onClick={() => setFavoriteOnly(!favoriteOnly)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                  favoriteOnly
                    ? "bg-text-ink text-white border-text-ink"
                    : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                )}
              >
                <Heart className="h-3 w-3 inline mr-1" />
                お気に入りのみ
              </button>
            </div>

            {/* Occasion Filter */}
            {occasions.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                  シーン
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setOccasionFilter("全て")}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                      occasionFilter === "全て"
                        ? "bg-text-ink text-white border-text-ink"
                        : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                    )}
                  >
                    全て
                  </button>
                  {occasions.map((occ) => (
                    <button
                      key={occ}
                      onClick={() => setOccasionFilter(occ)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                        occasionFilter === occ
                          ? "bg-text-ink text-white border-text-ink"
                          : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                      )}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Used Items Filter */}
            {usedItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                  <Package className="h-3 w-3 inline mr-1" />
                  使用コスメ
                </p>
                <div className="max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setItemFilter("全て")}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                        itemFilter === "全て"
                          ? "bg-text-ink text-white border-text-ink"
                          : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                      )}
                    >
                      全て
                    </button>
                    {usedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setItemFilter(item.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                          itemFilter === item.id
                            ? "bg-text-ink text-white border-text-ink"
                            : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                        )}
                      >
                        {item.name}
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
            placeholder="レシピ名、商品名、エリア..."
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
