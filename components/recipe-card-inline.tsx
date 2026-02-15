"use client";

import Link from "next/link";
import { Play, ChevronRight, Heart } from "lucide-react";
import type { Recipe } from "@/types/recipe";

interface RecipeCardInlineProps {
  recipe: Pick<Recipe, "id" | "recipe_name" | "match_score" | "steps" | "is_favorite">;
  previewImageUrl?: string;
  onToggleFavorite?: (recipeId: string) => void;
}

/** Check if recipe ID is a real Firestore document ID (not a client-generated fallback) */
function hasValidRecipeId(id: string | undefined): boolean {
  return !!id && !id.startsWith("recipe-");
}

export function RecipeCardInline({ recipe, previewImageUrl, onToggleFavorite }: RecipeCardInlineProps) {
  const validId = hasValidRecipeId(recipe.id);
  const href = validId ? `/recipes/${recipe.id}` : "/recipes";

  return (
    <Link href={href}>
      <div className="glass-card bg-white/70 rounded-[24px] overflow-hidden border border-white shadow-soft-float hover:shadow-card-hover transition-shadow btn-squishy">
        {/* Preview Image */}
        {previewImageUrl && (
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <img
              src={previewImageUrl}
              alt={`${recipe.recipe_name} プレビュー`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/70 to-transparent" />
          </div>
        )}
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {recipe.match_score != null && (
                <span className="bg-neon-accent/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white border border-white/20">
                  MATCH {recipe.match_score}%
                </span>
              )}
            </div>
            {onToggleFavorite && validId && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(recipe.id);
                }}
                className="p-1.5 rounded-full hover:bg-pink-50 transition-colors"
                aria-label={recipe.is_favorite ? "お気に入り解除" : "お気に入り登録"}
              >
                <Heart
                  size={18}
                  className={recipe.is_favorite ? "fill-pink-500 text-pink-500" : "text-gray-400"}
                />
              </button>
            )}
          </div>
          <h3 className="font-display font-bold text-xl text-text-ink">
            {recipe.recipe_name}
          </h3>
        </div>

        {/* Steps preview */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="px-5 pb-3 space-y-2">
            {recipe.steps.slice(0, 2).map((step) => (
              <div key={step.step} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-white">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-muted border border-gray-200">
                  {step.area}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-text-muted font-bold">STEP {step.step}</p>
                  <p className="text-sm font-bold text-text-ink truncate">{step.item_name}</p>
                </div>
                {step.substitution_note && (
                  <span className="text-[10px] text-neon-accent font-bold px-2 py-1 bg-neon-accent/10 rounded-md shrink-0">
                    代用
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="px-5 pb-5">
          <button className="btn-squishy w-full h-[48px] rounded-2xl relative overflow-hidden shadow-neon-glow group">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-center gap-2 text-white font-body font-bold tracking-wider">
              <Play size={16} />
              {validId ? "詳しく見る" : "レシピ一覧で確認"}
              <ChevronRight size={14} />
            </div>
          </button>
        </div>
      </div>
    </Link>
  );
}
