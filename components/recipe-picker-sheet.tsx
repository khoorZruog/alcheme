"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter((r) => r.recipe_name.toLowerCase().includes(q));
  }, [recipes, search]);

  const handleSelect = (recipeId: string, recipeName: string) => {
    onSelect(recipeId, recipeName);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-4 pb-8">
        <SheetHeader className="pb-3">
          <SheetTitle className="text-sm font-medium text-alcheme-charcoal">
            使ったレシピを選択
          </SheetTitle>
          <SheetDescription className="sr-only">
            メイクログに記録するレシピを選んでください
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alcheme-muted" />
          <input
            type="text"
            placeholder="レシピ名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alcheme-rose/30"
          />
        </div>

        {/* Options */}
        <div className="overflow-y-auto max-h-[calc(70vh-140px)] space-y-1.5">
          {/* No recipe option */}
          <button
            type="button"
            onClick={() => handleSelect("", "")}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
              selectedId === ""
                ? "bg-alcheme-rose/10 border border-alcheme-rose/30"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-alcheme-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-alcheme-charcoal">
                レシピなし / 自由メイク
              </p>
              <p className="text-xs text-alcheme-muted">レシピを使わないメイク</p>
            </div>
          </button>

          {/* Recipe list */}
          {filtered.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => handleSelect(recipe.id, recipe.recipe_name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                selectedId === recipe.id
                  ? "bg-alcheme-rose/10 border border-alcheme-rose/30"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
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
                <p className="text-sm font-medium text-alcheme-charcoal truncate">
                  {recipe.recipe_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {recipe.character_theme && (
                    <span className="text-[10px] bg-alcheme-blush text-alcheme-rose px-1.5 py-0.5 rounded-full">
                      {THEME_LABELS[recipe.character_theme] ?? recipe.character_theme}
                    </span>
                  )}
                  <span className="text-[10px] text-alcheme-muted">
                    {recipe.steps?.length ?? 0}ステップ
                  </span>
                  <span className="text-[10px] text-alcheme-muted">
                    {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-alcheme-muted flex-shrink-0" />
            </button>
          ))}

          {filtered.length === 0 && search.trim() && (
            <p className="text-center text-sm text-alcheme-muted py-6">
              一致するレシピがありません
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
