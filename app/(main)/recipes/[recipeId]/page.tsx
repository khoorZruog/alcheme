"use client";

import { use, useState } from "react";
import { ChevronDown, ChevronUp, Brain, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { RecipeStepCard } from "@/components/recipe-step-card";
import { RecipeFeedback } from "@/components/recipe-feedback";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { useRecipe } from "@/hooks/use-recipe";

export default function RecipeDetailPage({ params }: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = use(params);
  const { recipe, isLoading, error, submitFeedback } = useRecipe(recipeId);
  const [thinkingOpen, setThinkingOpen] = useState(false);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="レシピ詳細" backHref="/recipes" />
        <DetailSkeleton />
      </div>
    );
  }

  if (error) {
    const is404 = (error as any)?.status === 404;
    return (
      <div>
        <PageHeader title="レシピ詳細" backHref="/recipes" />
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted mb-3">
            {is404 ? "レシピが見つかりません" : "レシピの読み込みに失敗しました"}
          </p>
          {!is404 && (
            <button
              onClick={() => window.location.reload()}
              className="rounded-button bg-alcheme-rose px-6 py-2 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors"
            >
              再読み込み
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div>
        <PageHeader title="レシピ詳細" backHref="/recipes" />
        <p className="p-8 text-center text-alcheme-muted">レシピが見つかりません</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="レシピ詳細" backHref="/recipes" />

      <div className="px-4 py-4 space-y-6">
        {/* Title & Meta */}
        <div className="space-y-2">
          <h2 className="text-lg font-display font-bold text-alcheme-charcoal">
            {recipe.recipe_name}
          </h2>
          <p className="text-sm text-alcheme-muted">{recipe.user_request}</p>
          <div className="flex items-center gap-3 text-xs text-alcheme-muted">
            {recipe.match_score != null && (
              <span className="text-alcheme-gold font-medium">
                再現度 {recipe.match_score}%
              </span>
            )}
            <span>{(recipe.steps?.length ?? 0)}ステップ</span>
            <span>{new Date(recipe.created_at).toLocaleDateString("ja-JP")}</span>
          </div>
          {recipe.context && (
            <div className="flex flex-wrap gap-2 mt-1">
              {recipe.context.occasion && (
                <span className="text-xs bg-alcheme-blush text-alcheme-rose px-2 py-0.5 rounded-full">
                  {recipe.context.occasion}
                </span>
              )}
              {recipe.context.weather && (
                <span className="text-xs bg-alcheme-sand text-alcheme-charcoal px-2 py-0.5 rounded-full">
                  {recipe.context.weather}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Preview Image */}
        {recipe.preview_image_url && (
          <div className="rounded-card overflow-hidden border border-alcheme-sand">
            <img
              src={recipe.preview_image_url}
              alt={`${recipe.recipe_name} プレビュー`}
              className="w-full object-cover"
            />
            {recipe.character_theme && (
              <div className="px-3 py-2 bg-alcheme-sand/30 text-xs text-alcheme-muted text-center">
                テーマ: {recipe.character_theme === "cute" ? "キュート" : recipe.character_theme === "cool" ? "クール" : "エレガント"}
              </div>
            )}
          </div>
        )}

        {/* Thinking Process (collapsible) */}
        {recipe.thinking_process && recipe.thinking_process.length > 0 && (
          <div className="rounded-card border border-alcheme-sand">
            <button
              onClick={() => setThinkingOpen(!thinkingOpen)}
              className="flex w-full items-center justify-between p-3 text-sm font-medium text-alcheme-charcoal"
            >
              <span className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-alcheme-gold" />
                AIの思考プロセス
              </span>
              {thinkingOpen ? (
                <ChevronUp className="h-4 w-4 text-alcheme-muted" />
              ) : (
                <ChevronDown className="h-4 w-4 text-alcheme-muted" />
              )}
            </button>
            {thinkingOpen && (
              <div className="border-t border-alcheme-sand px-3 py-3 space-y-2">
                {recipe.thinking_process.map((thought, i) => (
                  <p key={i} className="text-xs text-alcheme-muted leading-relaxed">
                    {thought}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Steps */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-alcheme-charcoal mb-4">ステップ</p>
            <div>
              {recipe.steps.map((step, i) => (
                <RecipeStepCard key={step.step} step={step} stepNumber={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Pro Tips */}
        {recipe.pro_tips && recipe.pro_tips.length > 0 && (
          <div className="rounded-card bg-alcheme-sand/50 p-4 space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-alcheme-charcoal">
              <Lightbulb className="h-4 w-4 text-alcheme-gold" />
              プロのコツ
            </p>
            <ul className="space-y-1">
              {recipe.pro_tips.map((tip, i) => (
                <li key={i} className="text-xs text-alcheme-muted leading-relaxed">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feedback */}
        <RecipeFeedback
          currentRating={recipe.feedback?.user_rating}
          onSubmit={submitFeedback}
        />
      </div>
    </div>
  );
}
