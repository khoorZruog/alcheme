"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/chat";
import { RecipeCardInline } from "@/components/recipe-card-inline";
import type { RecipeResult, Recipe } from "@/types/recipe";

interface ChatMessageProps {
  message: ChatMessageType;
}

/** Strip ```json ... ``` and bare JSON blocks from text, extract recipe if found */
function parseMessageContent(raw: string): { text: string; recipe: Recipe | null } {
  let recipe: Recipe | null = null;
  const jsonBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;

  // Try to extract recipe from JSON code blocks
  let match;
  while ((match = jsonBlockPattern.exec(raw)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed?.recipe && !recipe) {
        recipe = normalizeRecipe(parsed.recipe);
      }
    } catch {
      // Not valid JSON
    }
  }

  // Strip JSON code blocks from displayed text
  let text = raw.replace(jsonBlockPattern, "");

  // Also strip bare JSON objects that look like recipe/inventory dumps
  text = text.replace(/\{[\s\S]*?"(?:recipe|items|used_items|validation)"[\s\S]*?\}\s*$/gm, "");

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  return { text, recipe };
}

function normalizeRecipe(r: Record<string, unknown>): Recipe {
  return {
    id: (r.id as string) || `recipe-${Date.now()}`,
    recipe_name: (r.recipe_name || r.title || "メイクレシピ") as string,
    match_score: r.match_score as number | undefined,
    steps: ((r.steps || []) as Record<string, unknown>[]).map((s, i) => ({
      step: (s.step as number) ?? i + 1,
      area: (s.area || "") as string,
      item_id: (s.item_id || "") as string,
      item_name: (s.item_name || "") as string,
      instruction: (s.instruction || "") as string,
      substitution_note: s.substitution_note as string | undefined,
    })),
    user_request: (r.user_request || "") as string,
    thinking_process: (r.thinking_process || []) as string[],
    pro_tips: (r.pro_tips || []) as string[],
    is_favorite: false,
    created_at: new Date().toISOString(),
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const { text, recipe } = useMemo(
    () => (isUser ? { text: message.content, recipe: null } : parseMessageContent(message.content)),
    [message.content, isUser]
  );

  // Use recipe from SSE event data, or fall back to extracted from text
  // Always normalize to ensure id fallback exists
  const recipeData = message.data && "recipe" in message.data
    ? normalizeRecipe((message.data as RecipeResult).recipe as unknown as Record<string, unknown>)
    : recipe;

  // Preview image URL from SSE event
  const previewUrl = message.preview_image_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "text-sm leading-relaxed",
          isUser
            ? "max-w-[85%] glass-card bg-white/80 border-none text-text-ink px-5 py-4 rounded-[20px] rounded-tr-sm shadow-sm"
            : "max-w-[85%] glass-card bg-white/60 text-text-ink px-5 py-4 rounded-[20px] rounded-bl-sm shadow-glass"
        )}
      >
        {message.image_url && (
          <div className="mb-3 overflow-hidden rounded-xl">
            <Image
              src={message.image_url}
              alt="添付画像"
              width={200}
              height={200}
              className="object-cover rounded-xl"
            />
          </div>
        )}

        {text && (
          <p className="whitespace-pre-wrap leading-[1.75]">
            {text}
            {message.is_streaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-neon-accent/60 animate-pulse rounded-sm" />
            )}
          </p>
        )}

        {!text && message.is_streaming && (
          <span className="inline-block w-1.5 h-4 bg-neon-accent/60 animate-pulse rounded-sm" />
        )}

        {recipeData && (
          <div className="mt-4">
            <RecipeCardInline recipe={recipeData} previewImageUrl={previewUrl} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
