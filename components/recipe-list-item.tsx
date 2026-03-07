"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, BookOpen, ChevronRight, Check, PenLine, Sparkles, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

interface RecipeListItemProps {
  recipe: Recipe;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onReLike?: (id: string) => void;
}

export function RecipeListItem({
  recipe,
  selectionMode,
  selected,
  onToggleSelect,
  onReLike,
}: RecipeListItemProps) {
  const router = useRouter();
  const isThemeOnly = recipe.source === "theme";
  const isSkipped = recipe.theme_status === "skipped";
  const displayName = isThemeOnly ? (recipe.theme_title || recipe.recipe_name) : recipe.recipe_name;

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect?.();
      return;
    }
    if (isThemeOnly && !isSkipped) {
      const params = new URLSearchParams({
        theme_title: recipe.theme_title || recipe.recipe_name,
        theme_id: recipe.id,
      });
      router.push(`/chat?${params.toString()}`);
      return;
    }
    if (isThemeOnly && isSkipped) {
      onReLike?.(recipe.id);
      return;
    }
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white/60 hover:bg-white/80 transition-colors cursor-pointer",
        selected && "ring-2 ring-neon-accent",
        isSkipped && "opacity-60"
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0">
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            selected ? "bg-neon-accent border-neon-accent" : "bg-white/80 border-gray-300"
          )}>
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
        {recipe.preview_image_url ? (
          <img
            src={recipe.preview_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-accent/10 to-magic-pink/10 flex items-center justify-center">
            {isThemeOnly ? (
              <Sparkles className="h-5 w-5 text-magic-pink/60" />
            ) : (
              <BookOpen className="h-5 w-5 text-neon-accent/60" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-text-ink truncate">
            {displayName}
          </p>
          {isThemeOnly && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0",
              isSkipped
                ? "bg-gray-200 text-gray-500"
                : "bg-pink-100 text-pink-600"
            )}>
              {isSkipped ? "スキップ" : "LIKE"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
          {recipe.source === "manual" && (
            <span className="flex items-center gap-0.5 text-neon-accent">
              <PenLine className="h-2.5 w-2.5" />手動
            </span>
          )}
          {!isThemeOnly && <span>{recipe.steps?.length ?? 0}ステップ</span>}
          {!isThemeOnly && recipe.match_score != null && (
            <span className={
              recipe.match_score >= 80 ? "text-green-600" : recipe.match_score >= 50 ? "text-amber-600" : "text-red-500"
            }>
              再現度 {recipe.match_score}%
            </span>
          )}
          {recipe.style_keywords?.slice(0, 2).map((kw) => (
            <span key={kw} className="px-1.5 py-0.5 rounded-full bg-magic-pink/10 text-magic-pink">
              #{kw}
            </span>
          ))}
          {recipe.context?.occasion && (
            <span className="px-1.5 py-0.5 rounded-full bg-alcheme-rose/10 text-alcheme-rose">
              {recipe.context.occasion}
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {recipe.is_favorite && (
          <Heart className="h-3.5 w-3.5 text-pink-500 fill-current" />
        )}
        {!selectionMode && isThemeOnly && !isSkipped && (
          <span className="text-[10px] font-bold text-neon-accent">レシピを作る</span>
        )}
        {!selectionMode && isThemeOnly && isSkipped && (
          <span className="text-[10px] font-bold text-text-muted">気になる</span>
        )}
        {!selectionMode && (
          <ChevronRight className="h-4 w-4 text-text-muted" />
        )}
      </div>
    </div>
  );
}
