"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";
import { useRecipes } from "@/hooks/use-recipes";
import type { Recipe } from "@/types/recipe";

function RecipeSummaryCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="hover:shadow-card-hover transition-shadow">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {recipe.preview_image_url ? (
                <img
                  src={recipe.preview_image_url}
                  alt=""
                  className="h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <BookOpen className="h-4 w-4 text-alcheme-gold" />
              )}
              <span className="text-sm font-medium text-alcheme-charcoal">
                {recipe.recipe_name}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-alcheme-muted" />
          </div>

          <p className="text-xs text-alcheme-muted line-clamp-1">
            {recipe.user_request}
          </p>

          <div className="flex items-center gap-3 text-xs text-alcheme-muted">
            {recipe.match_score != null && (
              <span>再現度 {recipe.match_score}%</span>
            )}
            <span>{recipe.steps?.length ?? 0}ステップ</span>
            {recipe.feedback?.user_rating === "liked" && (
              <span className="flex items-center gap-0.5 text-alcheme-rose">
                <Heart className="h-3 w-3 fill-current" />
                お気に入り
              </span>
            )}
          </div>

          <p className="text-[10px] text-alcheme-muted">
            {new Date(recipe.created_at).toLocaleDateString("ja-JP")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function RecipesPage() {
  const { recipes, count, isLoading, error } = useRecipes();

  return (
    <div>
      <PageHeader title={`レシピ (${count})`} />

      {error ? (
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted mb-3">レシピの読み込みに失敗しました</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
          >
            再読み込み
          </button>
        </div>
      ) : isLoading ? (
        <InventoryGridSkeleton />
      ) : recipes.length === 0 ? (
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
      ) : (
        <div className="space-y-3 px-4 py-4">
          {recipes.map((recipe) => (
            <RecipeSummaryCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
