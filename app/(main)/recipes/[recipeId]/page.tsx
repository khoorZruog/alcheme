"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Brain, Lightbulb, Share2, Globe, Trash2, Heart, CalendarHeart, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { RecipeStepCard } from "@/components/recipe-step-card";
import { RecipeFeedback } from "@/components/recipe-feedback";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { useRecipe } from "@/hooks/use-recipe";
import { fetcher } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/types/inventory";
import type { RecipeStep } from "@/types/recipe";
import type { BeautyLogEntry } from "@/types/beauty-log";

const MOOD_EMOJI: Record<string, string> = {
  元気: "😊",
  落ち着き: "😌",
  ウキウキ: "🥰",
  疲れ: "😤",
};

export default function RecipeDetailPage({ params }: { params: Promise<{ recipeId: string }> }) {
  const { recipeId } = use(params);
  const { recipe, isLoading, error, submitFeedback, toggleFavorite, mutate, deleteRecipe } = useRecipe(recipeId);
  const { data: inventoryData } = useSWR<{ items: InventoryItem[] }>("/api/inventory", fetcher);
  const { data: usageData } = useSWR<{ logs: BeautyLogEntry[] }>(
    recipeId ? `/api/beauty-log?recipe_id=${recipeId}` : null,
    fetcher
  );

  // Enrich recipe steps with color info from inventory
  const enrichedSteps = useMemo(() => {
    if (!recipe?.steps || !inventoryData?.items) return recipe?.steps ?? [];
    const itemMap = new Map<string, InventoryItem>();
    inventoryData.items.forEach((item) => itemMap.set(item.id, item));
    return recipe.steps.map((step): RecipeStep => {
      const item = itemMap.get(step.item_id);
      if (!item) return step;
      return {
        ...step,
        color_code: step.color_code ?? item.color_code,
        color_name: step.color_name ?? item.color_name,
        brand: step.brand ?? item.brand,
      };
    });
  }, [recipe?.steps, inventoryData?.items]);

  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    const ok = window.confirm("このレシピを削除しますか？この操作は取り消せません。");
    if (!ok) return;
    setDeleting(true);
    await deleteRecipe();
    setDeleting(false);
  }, [deleting, deleteRecipe]);

  const handlePublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 409) {
        toast.info("このレシピは既に公開されています");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("レシピを公開しました！");
      mutate();
    } catch {
      toast.error("公開に失敗しました");
    } finally {
      setPublishing(false);
    }
  }, [recipeId, publishing, mutate]);

  const handleUnpublish = useCallback(async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/publish`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("レシピを非公開にしました");
      mutate();
    } catch {
      toast.error("非公開化に失敗しました");
    } finally {
      setPublishing(false);
    }
  }, [recipeId, publishing, mutate]);

  const handleGenerateImage = useCallback(async () => {
    if (generatingImage) return;
    setGeneratingImage(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/generate-image`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("画像を生成しました！");
      mutate();
    } catch {
      toast.error("画像の生成に失敗しました");
    } finally {
      setGeneratingImage(false);
    }
  }, [recipeId, generatingImage, mutate]);

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

  const usageLogs = usageData?.logs ?? [];

  return (
    <div>
      <PageHeader title="レシピ詳細" backHref="/recipes" />

      <div className="px-4 py-4 space-y-6">
        {/* Title & Meta */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-display font-bold text-alcheme-charcoal">
              {recipe.recipe_name}
            </h2>
            <button
              onClick={toggleFavorite}
              className="p-2 -mr-2 -mt-1 btn-squishy"
              aria-label={recipe.is_favorite ? "お気に入りを解除" : "お気に入りに追加"}
            >
              <Heart
                className={cn(
                  "h-6 w-6 transition-colors",
                  recipe.is_favorite
                    ? "fill-alcheme-rose text-alcheme-rose"
                    : "text-gray-300"
                )}
              />
            </button>
          </div>
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

          {/* Publish & Delete buttons */}
          <div className="flex items-center gap-2 pt-1">
            {(recipe as any).published_post_id ? (
              <button
                onClick={handleUnpublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-alcheme-sand text-xs text-alcheme-charcoal hover:bg-alcheme-sand/80 transition-colors btn-squishy disabled:opacity-50"
              >
                <Globe size={14} />
                <span>公開中</span>
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-neon-accent to-magic-pink text-xs text-white hover:opacity-90 transition-opacity btn-squishy disabled:opacity-50"
              >
                <Share2 size={14} />
                <span>フィードに公開</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-xs text-red-500 hover:bg-red-100 transition-colors btn-squishy disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{deleting ? "削除中..." : "削除"}</span>
            </button>
          </div>
        </div>

        {/* Preview Image */}
        {recipe.preview_image_url ? (
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
        ) : (
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-card border-2 border-dashed border-gray-200 text-sm text-text-muted hover:border-neon-accent hover:text-neon-accent transition-colors btn-squishy disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" />
            {generatingImage ? "画像を生成中..." : "イメージ画像を生成"}
          </button>
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
        {enrichedSteps.length > 0 && (
          <div>
            <p className="text-sm font-medium text-alcheme-charcoal mb-4">ステップ</p>
            <div>
              {enrichedSteps.map((step, i) => (
                <RecipeStepCard key={i} step={step} stepNumber={i + 1} />
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

        {/* Usage History */}
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-alcheme-charcoal mb-3">
            <CalendarHeart className="h-4 w-4 text-alcheme-gold" />
            使用履歴
          </p>
          {usageLogs.length === 0 ? (
            <p className="text-xs text-alcheme-muted">まだ使用されていません</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {usageLogs.map((log) => (
                <Link
                  key={log.id}
                  href={`/beauty-log/${log.id}`}
                  className="flex-shrink-0 w-24 rounded-xl bg-white p-3 text-center hover:shadow-md transition-shadow btn-squishy"
                >
                  <p className="text-xs font-bold text-alcheme-charcoal">
                    {new Date(log.date + "T00:00:00").toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </p>
                  {log.mood && (
                    <p className="text-sm mt-0.5">{MOOD_EMOJI[log.mood] ?? "💄"}</p>
                  )}
                  {log.self_rating && (
                    <p className="text-[10px] text-alcheme-gold mt-0.5">
                      {"★".repeat(log.self_rating)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Feedback */}
        <RecipeFeedback
          currentRating={recipe.feedback?.user_rating}
          onSubmit={submitFeedback}
        />
      </div>
    </div>
  );
}
