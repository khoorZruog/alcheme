"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Play, ChevronRight, Sparkles } from "lucide-react";
import { useRecipeOmikuji } from "@/hooks/use-recipe-omikuji";
import type { Recipe } from "@/types/recipe";

type OverlayState = "drawing" | "reveal" | "exhausted" | "empty";

interface RecipeOmikujiOverlayProps {
  open: boolean;
  onClose: () => void;
  onRecipeSelected: (recipe: Recipe) => void;
  onRequestNewRecipe: () => void;
}

export function RecipeOmikujiOverlay({
  open,
  onClose,
  onRecipeSelected,
  onRequestNewRecipe,
}: RecipeOmikujiOverlayProps) {
  const {
    result,
    isDrawing,
    hasNoRecipes,
    allExhausted,
    drawRecipe,
    excludeAndRedraw,
    reset,
  } = useRecipeOmikuji();

  const [state, setState] = useState<OverlayState>("drawing");

  // Start draw when overlay opens
  useEffect(() => {
    if (open) {
      reset();
      setState("drawing");
      drawRecipe();
    }
  }, [open, drawRecipe, reset]);

  // Transition based on hook state
  useEffect(() => {
    if (isDrawing) {
      setState("drawing");
    } else if (hasNoRecipes) {
      setState("empty");
    } else if (allExhausted) {
      setState("exhausted");
    } else if (result) {
      setState("reveal");
    }
  }, [isDrawing, hasNoRecipes, allExhausted, result]);

  const handleRedraw = useCallback(async () => {
    setState("drawing");
    await excludeAndRedraw();
  }, [excludeAndRedraw]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[380px] max-h-[90dvh] overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
              aria-label="閉じる"
            >
              <X size={18} className="text-text-ink" />
            </button>

            {/* Drawing state */}
            {state === "drawing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 gap-4"
              >
                <motion.div
                  animate={{
                    rotate: [0, -15, 15, -10, 10, 0],
                    scale: [1, 1.1, 1, 1.1, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                  className="text-6xl"
                  role="img"
                  aria-label="おみくじ"
                >
                  🎯
                </motion.div>
                <p className="text-sm font-medium text-white">
                  おみくじを引いています...
                </p>
              </motion.div>
            )}

            {/* Reveal state */}
            {state === "reveal" && result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card bg-white/95 rounded-[24px] overflow-hidden shadow-xl"
              >
                {/* Preview image */}
                {result.recipe.preview_image_url && (
                  <div className="relative w-full aspect-square overflow-hidden">
                    <img
                      src={result.recipe.preview_image_url}
                      alt={`${result.recipe.recipe_name} プレビュー`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/70 to-transparent" />
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {/* Score badge + reasons */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {result.recipe.match_score != null && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${
                          result.recipe.match_score >= 80
                            ? "bg-green-500/80"
                            : result.recipe.match_score >= 50
                              ? "bg-amber-500/80"
                              : "bg-red-500/80"
                        }`}
                      >
                        一致率 {result.recipe.match_score}%
                      </span>
                    )}
                    {result.reasons.map((reason) => (
                      <span
                        key={reason}
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold text-neon-accent bg-neon-accent/10 border border-neon-accent/20"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Recipe name */}
                  <h3 className="font-display font-bold text-xl text-text-ink mb-2">
                    {result.recipe.recipe_name}
                  </h3>

                  {/* Steps preview */}
                  {result.recipe.steps && result.recipe.steps.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {result.recipe.steps.slice(0, 2).map((step) => (
                        <div
                          key={step.step}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-gray-100"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-text-muted border border-gray-200">
                            {step.area}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-text-muted font-bold">
                              STEP {step.step}
                            </p>
                            <p className="text-sm font-bold text-text-ink truncate">
                              {step.item_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => onRecipeSelected(result.recipe)}
                      className="btn-squishy w-full h-[48px] rounded-2xl relative overflow-hidden shadow-neon-glow group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10 flex items-center justify-center gap-2 text-white font-body font-bold tracking-wider">
                        <Play size={16} />
                        このレシピで始める
                        <ChevronRight size={14} />
                      </div>
                    </button>
                    <button
                      onClick={handleRedraw}
                      className="w-full py-2.5 rounded-2xl text-sm font-medium text-text-muted hover:text-text-ink hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} />
                      別のレシピを引く
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Exhausted state (all recipes tried) */}
            {state === "exhausted" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-5 py-20 px-4"
              >
                <p className="text-sm text-white/90 text-center">
                  保存済みレシピは全て試しました！
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    onRequestNewRecipe();
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon-accent to-magic-pink text-white font-bold shadow-lg btn-squishy hover:shadow-xl transition-shadow"
                >
                  <Sparkles size={16} />
                  新しいレシピを作る
                </button>
                <button
                  onClick={handleClose}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  閉じる
                </button>
              </motion.div>
            )}

            {/* Empty state (no recipes at all) */}
            {state === "empty" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-5 py-20 px-4"
              >
                <p className="text-sm text-white/90 text-center">
                  まだレシピがありません
                </p>
                <p className="text-xs text-white/60 text-center">
                  チャットでメイクレシピを作ってみましょう！
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    onRequestNewRecipe();
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon-accent to-magic-pink text-white font-bold shadow-lg btn-squishy hover:shadow-xl transition-shadow"
                >
                  <Sparkles size={16} />
                  新しいレシピを作る
                </button>
                <button
                  onClick={handleClose}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  閉じる
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
