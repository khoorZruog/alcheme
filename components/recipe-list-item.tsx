"use client";

import Link from "next/link";
import { Heart, BookOpen, ChevronRight, CheckSquare, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

interface RecipeListItemProps {
  recipe: Recipe;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function RecipeListItem({
  recipe,
  selectionMode,
  selected,
  onToggleSelect,
}: RecipeListItemProps) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow",
        selected && "ring-2 ring-neon-accent"
      )}
      onClick={selectionMode ? onToggleSelect : undefined}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            selected ? "bg-neon-accent border-neon-accent" : "border-gray-300 bg-white"
          )}>
            {selected && <CheckSquare className="h-3 w-3 text-white" />}
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
            <BookOpen className="h-5 w-5 text-neon-accent/60" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-ink truncate">
          {recipe.recipe_name}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-text-muted mt-0.5">
          {recipe.source === "manual" && (
            <span className="flex items-center gap-0.5 text-neon-accent">
              <PenLine className="h-2.5 w-2.5" />手動
            </span>
          )}
          <span>{recipe.steps?.length ?? 0}ステップ</span>
          {recipe.match_score != null && (
            <span>再現度 {recipe.match_score}%</span>
          )}
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
        {!selectionMode && (
          <ChevronRight className="h-4 w-4 text-text-muted" />
        )}
      </div>
    </div>
  );

  if (selectionMode) return content;

  return (
    <Link href={`/recipes/${recipe.id}`}>
      {content}
    </Link>
  );
}
