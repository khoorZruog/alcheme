"use client";

import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, RefreshCw, Heart, Check } from "lucide-react";
import Image from "next/image";
import { ThemeCardStack } from "@/components/theme-card-stack";
import { useThemeSuggestions } from "@/hooks/use-theme-suggestions";
import type { ThemeSuggestion } from "@/types/theme";

type OverlayState = "generating" | "swiping" | "selected" | "empty";

interface ThemeOverlayProps {
  open: boolean;
  onClose: () => void;
  onThemeSelected: (theme: ThemeSuggestion) => void;
}

export function ThemeOverlay({
  open,
  onClose,
  onThemeSelected,
}: ThemeOverlayProps) {
  const { themes, isGenerating, loadingImages, generateThemes, updateStatus } =
    useThemeSuggestions();
  const [state, setState] = useState<OverlayState>("generating");
  const [likedThemes, setLikedThemes] = useState<ThemeSuggestion[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ThemeSuggestion | null>(null);

  // Start generation when overlay opens
  useEffect(() => {
    if (open) {
      setState("generating");
      setLikedThemes([]);
      setSelectedTheme(null);
      generateThemes();
    }
  }, [open, generateThemes]);

  // Transition from generating → swiping when themes arrive
  useEffect(() => {
    if (!isGenerating && themes.length > 0 && state === "generating") {
      setState("swiping");
    }
  }, [isGenerating, themes, state]);

  const handleLike = useCallback(
    (theme: ThemeSuggestion) => {
      updateStatus(theme.id, "liked");
      setLikedThemes((prev) => [...prev, theme]);
      // Continue swiping — don't change state
    },
    [updateStatus]
  );

  const handleSkip = useCallback(
    (theme: ThemeSuggestion) => {
      updateStatus(theme.id, "skipped");
    },
    [updateStatus]
  );

  const handleComplete = useCallback(() => {
    // All cards swiped — show results based on liked themes
    // Use setTimeout to access latest likedThemes via ref-like pattern
    setLikedThemes((prev) => {
      if (prev.length > 0) {
        setState("selected");
      } else {
        setState("empty");
      }
      return prev;
    });
  }, []);

  const handleSelectTheme = useCallback(
    (theme: ThemeSuggestion) => {
      setSelectedTheme(theme);
    },
    []
  );

  const handleConfirmSelection = useCallback(() => {
    if (selectedTheme) {
      onThemeSelected(selectedTheme);
      onClose();
    }
  }, [selectedTheme, onThemeSelected, onClose]);

  const handleRetry = useCallback(() => {
    setState("generating");
    setLikedThemes([]);
    setSelectedTheme(null);
    generateThemes();
  }, [generateThemes]);

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
            className="relative w-full max-w-85 max-h-[90dvh] overflow-visible"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
              aria-label="閉じる"
            >
              <X size={18} className="text-text-ink" />
            </button>

            {/* Generating state */}
            {state === "generating" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-32 gap-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                >
                  <Sparkles size={40} className="text-neon-accent" />
                </motion.div>
                <p className="text-sm font-medium text-white">
                  あなたにぴったりのテーマを考え中...
                </p>
              </motion.div>
            )}

            {/* Swiping state */}
            {state === "swiping" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ThemeCardStack
                  themes={themes}
                  loadingImages={loadingImages}
                  onLike={handleLike}
                  onSkip={handleSkip}
                  onComplete={handleComplete}
                />
              </motion.div>
            )}

            {/* Selected state — show liked themes to pick from */}
            {state === "selected" && likedThemes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8 px-4"
              >
                <div className="flex items-center gap-2">
                  <Heart size={18} className="text-neon-accent fill-neon-accent" />
                  <p className="text-sm font-bold text-white">
                    {likedThemes.length === 1
                      ? "このテーマが気に入りました！"
                      : `${likedThemes.length}つのテーマが気に入りました！`}
                  </p>
                </div>
                <p className="text-xs text-white/60">
                  レシピを作りたいテーマを選んでください
                </p>

                <div className="w-full flex flex-col gap-2 max-h-[50dvh] overflow-y-auto">
                  {likedThemes.map((theme) => {
                    const isSelected = selectedTheme?.id === theme.id;
                    return (
                      <motion.button
                        key={theme.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelectTheme(theme)}
                        className={`relative flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                          isSelected
                            ? "bg-white/30 ring-2 ring-neon-accent shadow-lg"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10">
                          {theme.preview_image_url ? (
                            <Image
                              src={theme.preview_image_url}
                              alt={theme.title}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles size={16} className="text-white/40" />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {theme.title}
                          </p>
                          <p className="text-xs text-white/60 line-clamp-1 mt-0.5">
                            {theme.description}
                          </p>
                        </div>

                        {/* Check mark */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-neon-accent flex items-center justify-center shrink-0"
                          >
                            <Check size={14} className="text-white" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedTheme}
                  className="mt-2 px-8 py-3 rounded-full bg-linear-to-r from-neon-accent to-magic-pink text-white font-bold shadow-lg btn-squishy hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  レシピを提案してもらう
                </button>
              </motion.div>
            )}

            {/* Empty state (all skipped) */}
            {state === "empty" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-5 py-20 px-4"
              >
                <p className="text-sm text-white/70">
                  全てスキップしました
                </p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-medium hover:bg-white/30 transition-colors btn-squishy"
                >
                  <RefreshCw size={16} />
                  もう一度提案してもらう
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
