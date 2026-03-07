"use client";

import { useState, useCallback } from "react";
import type { ThemeSuggestion } from "@/types/theme";

export function useThemeSuggestions() {
  const [themes, setThemes] = useState<ThemeSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const generateThemes = useCallback(async () => {
    setIsGenerating(true);
    setThemes([]);
    setLoadingImages(new Set());

    try {
      const res = await fetch("/api/themes", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate themes");
      const data = await res.json();
      const newThemes: ThemeSuggestion[] = data.themes || [];
      setThemes(newThemes);

      // Generate images sequentially to avoid Gemini rate limits (429)
      const imageIds = new Set(newThemes.map((t) => t.id));
      setLoadingImages(imageIds);

      const generateImage = async (theme: ThemeSuggestion) => {
        try {
          const imgRes = await fetch(`/api/themes/${theme.id}/image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              theme: {
                title: theme.title,
                description: theme.description,
                style_keywords: theme.style_keywords,
                character_theme: theme.character_theme,
              },
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData.image_url) {
              setThemes((prev) =>
                prev.map((t) =>
                  t.id === theme.id
                    ? { ...t, preview_image_url: imgData.image_url }
                    : t
                )
              );
            }
          }
        } catch (err) {
          console.error(`Failed to generate image for theme ${theme.id}:`, err);
        } finally {
          setLoadingImages((prev) => {
            const next = new Set(prev);
            next.delete(theme.id);
            return next;
          });
        }
      };

      // Run sequentially with delay to avoid Gemini 429 rate limits
      (async () => {
        for (let i = 0; i < newThemes.length; i++) {
          if (i > 0) await new Promise((r) => setTimeout(r, 2000));
          await generateImage(newThemes[i]);
        }
      })();
    } catch (err) {
      console.error("Failed to generate themes:", err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const updateStatus = useCallback(
    async (
      themeId: string,
      status: "liked" | "skipped",
      recipeId?: string
    ) => {
      try {
        await fetch(`/api/themes/${themeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...(recipeId ? { recipe_id: recipeId } : {}),
          }),
        });
        setThemes((prev) =>
          prev.map((t) => (t.id === themeId ? { ...t, status } : t))
        );
      } catch (err) {
        console.error("Failed to update theme status:", err);
      }
    },
    []
  );

  return {
    themes,
    isGenerating,
    loadingImages,
    generateThemes,
    updateStatus,
  };
}
