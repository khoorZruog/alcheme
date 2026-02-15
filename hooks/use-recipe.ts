"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import type { Recipe } from "@/types/recipe";

export function useRecipe(recipeId: string) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ recipe: Recipe }>(
    recipeId ? `/api/recipes/${recipeId}` : null,
    fetcher
  );

  const submitFeedback = useCallback(
    async (rating: "liked" | "neutral" | "disliked") => {
      // Optimistic update
      mutate(
        (prev) =>
          prev
            ? {
                recipe: {
                  ...prev.recipe,
                  feedback: { user_rating: rating, created_at: new Date().toISOString() },
                },
              }
            : prev,
        false
      );

      try {
        const res = await fetch(`/api/recipes/${recipeId}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });
        if (!res.ok) throw new Error("Feedback request failed");
        toast.success("フィードバックを送信しました");
      } catch {
        toast.error("フィードバックの送信に失敗しました");
        // Revert optimistic update
        mutate();
        return;
      }

      mutate();
    },
    [recipeId, mutate]
  );

  const deleteRecipe = useCallback(async () => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("レシピを削除しました");
      router.push("/recipes");
    } catch {
      toast.error("削除に失敗しました");
    }
  }, [recipeId, router]);

  return {
    recipe: data?.recipe ?? null,
    isLoading,
    error,
    mutate: () => mutate(),
    submitFeedback,
    deleteRecipe,
  };
}
