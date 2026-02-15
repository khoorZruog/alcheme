"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, Sparkles, Heart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

const THEME_LABELS: Record<string, string> = {
  cute: "キュート",
  cool: "クール",
  elegant: "エレガント",
};

interface RecipePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  selectedId: string;
  onSelect: (recipeId: string, recipeName: string) => void;
}

export function RecipePickerSheet({
  open,
  onOpenChange,
  recipes,
  selectedId,
  onSelect,
}: RecipePickerSheetProps) {
  const [search, setSearch] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = recipes;
    if (favoriteOnly) {
      result = result.filter((r) => r.is_favorite);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.recipe_name.toLowerCase().includes(q));
    }
    return result;
  }, [recipes, search, favoriteOnly]);

  const handleSelect = (recipeId: string, recipeName: string) => {
    onSelect(recipeId, recipeName);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-sm font-medium text-text-ink">
            レシピを選択
          </SheetTitle>
          <SheetDescription className="sr-only">
            メイク日記に記録するレシピを選んでください
          </SheetDescription>
        </SheetHeader>

        {/* Search + Filter */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="レシピ名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alcheme-rose/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={cn(
              "flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-bold transition-colors shrink-0",
              favoriteOnly
                ? "bg-pink-50 border-pink-200 text-pink-600"
                : "bg-white border-gray-200 text-text-muted hover:border-pink-200"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", favoriteOnly && "fill-current")} />
            お気に入り
          </button>
        </div>

        {/* Options */}
        <div className="overflow-y-auto max-h-[calc(70vh-160px)] space-y-1.5">
          {/* No recipe option */}
          <button
            type="button"
            onClick={() => handleSelect("", "")}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
              selectedId === ""
                ? "bg-alcheme-rose/10 border border-alcheme-rose/30"
                : "bg-gray-50 hover:bg-gray-100"
            )}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-ink">
                レシピなし / 自由メイク
              </p>
              <p className="text-xs text-text-muted">レシピを使わないメイク</p>
            </div>
          </button>

          {/* Recipe list */}
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => handleSelect(recipe.id, recipe.recipe_name)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                selectedId === recipe.id
                  ? "bg-alcheme-rose/10 border border-alcheme-rose/30"
                  : "bg-gray-50 hover:bg-gray-100"
              )}
            >
              {/* Thumbnail */}
              {recipe.preview_image_url ? (
                <img
                  src={recipe.preview_image_url}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-alcheme-sand/50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-alcheme-gold" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-ink truncate">
                  {recipe.recipe_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {recipe.character_theme && (
                    <span className="text-[10px] bg-alcheme-blush text-alcheme-rose px-1.5 py-0.5 rounded-full">
                      {THEME_LABELS[recipe.character_theme] ?? recipe.character_theme}
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted">
                    {recipe.steps?.length ?? 0}ステップ
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              {/* Favorite indicator + chevron */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {recipe.is_favorite && (
                  <Heart className="h-3.5 w-3.5 text-pink-500 fill-current" />
                )}
                <ChevronRight className="h-4 w-4 text-text-muted" />
              </div>
            </button>
          ))}

          {filtered.length === 0 && (search.trim() || favoriteOnly) && (
            <p className="text-center text-sm text-text-muted py-6">
              一致するレシピがありません
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
