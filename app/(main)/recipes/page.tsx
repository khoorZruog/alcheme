"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, ChevronRight, Heart, Search, SlidersHorizontal,
  ArrowUpDown, X, Plus, PenLine, Check, CheckSquare, LayoutGrid, List, Trash2, Package,
  Sparkles, SkipForward, Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BulkActionBar } from "@/components/bulk-action-bar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MainTabHeader } from "@/components/main-tab-header";
import { RecipeListItem } from "@/components/recipe-list-item";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { useRecipes, RECIPE_SORT_OPTIONS, MATCH_SCORE_FILTER_OPTIONS } from "@/hooks/use-recipes";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

const THEME_STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "すべて" },
  { value: "with_recipe" as const, label: "レシピ済み" },
  { value: "liked" as const, label: "LIKE済み" },
  { value: "skipped" as const, label: "スキップ" },
];

function RecipeSummaryCard({
  recipe,
  selectionMode,
  selected,
  onToggleSelect,
  onReLike,
}: {
  recipe: Recipe;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReLike?: (id: string) => void;
}) {
  const router = useRouter();
  const isThemeOnly = recipe.source === "theme";
  const isSkipped = recipe.theme_status === "skipped";
  const displayName = isThemeOnly ? (recipe.theme_title || recipe.recipe_name) : recipe.recipe_name;

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
      return;
    }
    if (isThemeOnly && !isSkipped) {
      // LIKED theme → go to chat to create recipe
      const params = new URLSearchParams({
        theme_title: recipe.theme_title || recipe.recipe_name,
        theme_id: recipe.id,
      });
      router.push(`/chat?${params.toString()}`);
      return;
    }
    if (isThemeOnly && isSkipped) {
      // Skipped theme → re-LIKE
      onReLike?.(recipe.id);
      return;
    }
    // Normal recipe → go to detail
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <div
      className={cn(
        "glass-card bg-white rounded-card p-3 relative overflow-hidden btn-squishy cursor-pointer text-left",
        selected && "ring-2 ring-neon-accent",
        isSkipped && "opacity-60"
      )}
      onClick={handleCardClick}
    >
      <div className="space-y-1.5">
        {/* Selection checkbox — top-right (matching inventory) */}
        {selectionMode && (
          <div className="absolute top-3 right-3 z-10">
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              selected ? "bg-neon-accent border-neon-accent" : "bg-white/80 border-gray-300"
            )}>
              {selected && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
          </div>
        )}

        {/* Status badge — top-left */}
        {isThemeOnly && (
          <div className="absolute top-3 left-3 z-10">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold",
              isSkipped
                ? "bg-gray-800/60 text-white"
                : "bg-pink-500/80 text-white"
            )}>
              {isSkipped ? "スキップ" : "LIKE"}
            </span>
          </div>
        )}
        {!isThemeOnly && recipe.steps?.length > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-accent/80 text-white">
              レシピ済み
            </span>
          </div>
        )}

        {/* Thumbnail — aspect-square */}
        {recipe.preview_image_url ? (
          <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
            <img
              src={recipe.preview_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-neon-accent/10 to-magic-pink/10 flex items-center justify-center mb-2">
            {isThemeOnly ? (
              <Sparkles className="h-8 w-8 text-magic-pink/40" />
            ) : (
              <BookOpen className="h-8 w-8 text-neon-accent/40" />
            )}
          </div>
        )}

        <p className="text-sm font-medium text-text-ink truncate">
          {displayName}
        </p>

        {/* Style keywords */}
        {recipe.style_keywords && recipe.style_keywords.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {recipe.style_keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="px-1.5 py-0.5 rounded-full bg-magic-pink/10 text-magic-pink text-[9px] font-medium">
                #{kw}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-text-muted flex-wrap">
          {recipe.source === "manual" && (
            <span className="flex items-center gap-0.5 text-neon-accent">
              <PenLine className="h-2.5 w-2.5" />手動
            </span>
          )}
          {!isThemeOnly && recipe.match_score != null && (
            <span className={
              recipe.match_score >= 80 ? "text-green-600" : recipe.match_score >= 50 ? "text-amber-600" : "text-red-500"
            }>
              再現度 {recipe.match_score}%
            </span>
          )}
          {!isThemeOnly && <span>{recipe.steps?.length ?? 0}ステップ</span>}
          {recipe.is_favorite && (
            <Heart className="h-3 w-3 text-pink-500 fill-current" />
          )}
        </div>

        {/* CTA for theme-only */}
        {isThemeOnly && !selectionMode && (
          <div className="pt-1">
            {isSkipped ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-text-muted">
                <Heart className="h-3 w-3" /> 気になる
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neon-accent">
                レシピを作る <ChevronRight className="h-3 w-3" />
              </span>
            )}
          </div>
        )}

        {!isThemeOnly && (
          <p className="text-[10px] text-text-muted">
            {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
          </p>
        )}
      </div>
    </div>
  );
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
    matchScoreFilter, setMatchScoreFilter,
    themeStatusFilter, setThemeStatusFilter,
  } = useRecipes();

  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("recipes-view") as "grid" | "list") || "grid";
    }
    return "grid";
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

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(recipes.map((r) => r.id)));
  }, [recipes]);

  const deselectAll = useCallback(() => {
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

  const handleReLike = useCallback(async (themeId: string) => {
    try {
      await fetch(`/api/themes/${themeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "liked" }),
      });
      mutate();
    } catch (err) {
      console.error("Failed to re-like theme:", err);
    }
  }, [mutate]);

  const resetFilters = () => {
    setSortBy("newest");
    setFavoriteOnly(false);
    setOccasionFilter("全て");
    setItemFilter("全て");
    setMatchScoreFilter("all");
    setThemeStatusFilter("all");
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

      {/* Quick filter bar */}
      {count > 0 && (
        <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy shrink-0",
              favoriteOnly
                ? "bg-neon-accent text-white border-neon-accent"
                : "bg-white/60 text-text-muted border-gray-200 hover:border-neon-accent"
            )}
          >
            <Heart className={cn("h-3 w-3", favoriteOnly && "fill-current")} />
            お気に入り
          </button>
          {THEME_STATUS_FILTER_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
            <button
              key={opt.value}
              onClick={() => setThemeStatusFilter(themeStatusFilter === opt.value ? "all" : opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy shrink-0",
                themeStatusFilter === opt.value
                  ? "bg-neon-accent text-white border-neon-accent"
                  : "bg-white/60 text-text-muted border-gray-200 hover:border-neon-accent"
              )}
            >
              {opt.value === "with_recipe" && <BookOpen className="h-3 w-3" />}
              {opt.value === "liked" && <Heart className="h-3 w-3" />}
              {opt.value === "skipped" && <SkipForward className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
          {MATCH_SCORE_FILTER_OPTIONS.filter((o) => o.value !== "all").map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMatchScoreFilter(matchScoreFilter === opt.value ? "all" : opt.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy shrink-0",
                matchScoreFilter === opt.value
                  ? "bg-neon-accent text-white border-neon-accent"
                  : "bg-white/60 text-text-muted border-gray-200 hover:border-neon-accent"
              )}
            >
              再現度 {opt.label}
            </button>
          ))}
          {occasions.length > 0 && occasions.slice(0, 3).map((occ) => (
            <button
              key={occ}
              onClick={() => setOccasionFilter(occasionFilter === occ ? "全て" : occ)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy shrink-0",
                occasionFilter === occ
                  ? "bg-neon-accent text-white border-neon-accent"
                  : "bg-white/60 text-text-muted border-gray-200 hover:border-neon-accent"
              )}
            >
              {occ}
            </button>
          ))}
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="px-4 pt-2 flex items-center gap-2 flex-wrap">
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
          {matchScoreFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              再現度 {MATCH_SCORE_FILTER_OPTIONS.find((o) => o.value === matchScoreFilter)?.label}
              <button onClick={() => setMatchScoreFilter("all")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
            </span>
          )}
          {themeStatusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-neon-accent/10 text-neon-accent text-xs font-bold">
              <Tag className="h-3 w-3" />
              {THEME_STATUS_FILTER_OPTIONS.find((o) => o.value === themeStatusFilter)?.label}
              <button onClick={() => setThemeStatusFilter("all")} className="hover:text-text-ink"><X className="h-3 w-3" /></button>
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
          <div className="space-y-3">
            {/* Hero CTA — AI recipe creation prompt */}
            {!selectionMode && !searchQuery && (
              <Link href="/chat" className="block">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-neon-accent/20 via-magic-pink/10 to-alcheme-rose/10 p-5">
                  <div className="relative z-10">
                    <p className="text-sm font-bold text-text-ink">
                      AIにメイクレシピを相談
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      手持ちコスメに合ったレシピを提案します
                    </p>
                    <span className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 rounded-full bg-neon-accent text-white text-xs font-bold btn-squishy">
                      チャットで相談 <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )}
            <div className="grid grid-cols-2 gap-3">
              {recipes.map((recipe) => (
                <RecipeSummaryCard
                  key={recipe.id}
                  recipe={recipe}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(recipe.id)}
                  onToggleSelect={() => toggleSelect(recipe.id)}
                  onReLike={handleReLike}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden bg-white/40 divide-y divide-gray-100">
            {recipes.map((recipe) => (
              <RecipeListItem
                key={recipe.id}
                recipe={recipe}
                selectionMode={selectionMode}
                selected={selectedIds.has(recipe.id)}
                onToggleSelect={() => toggleSelect(recipe.id)}
                onReLike={handleReLike}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={recipes.length}
          onCancel={exitSelectionMode}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
        >
          {selectedIds.size > 0 && (
            <>
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
            </>
          )}
        </BulkActionBar>
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

            {/* Match Score Filter */}
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                再現度
              </p>
              <div className="flex flex-wrap gap-2">
                {MATCH_SCORE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setMatchScoreFilter(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                      matchScoreFilter === opt.value
                        ? "bg-text-ink text-white border-text-ink"
                        : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Status Filter */}
            <div>
              <p className="text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
                <Tag className="h-3 w-3 inline mr-1" />
                ステータス
              </p>
              <div className="flex flex-wrap gap-2">
                {THEME_STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setThemeStatusFilter(opt.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
                      themeStatusFilter === opt.value
                        ? "bg-text-ink text-white border-text-ink"
                        : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
            placeholder="レシピ名、テーマ、タグ、商品名..."
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
