"use client";

import { useState, useCallback } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Heart, X } from "lucide-react";
import { ThemeCard } from "@/components/theme-card";
import type { ThemeSuggestion } from "@/types/theme";

interface ThemeCardStackProps {
  themes: ThemeSuggestion[];
  loadingImages: Set<string>;
  onLike: (theme: ThemeSuggestion) => void;
  onSkip: (theme: ThemeSuggestion) => void;
  onComplete: () => void;
}

export function ThemeCardStack({
  themes,
  loadingImages,
  onLike,
  onSkip,
  onComplete,
}: ThemeCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const skipOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 100;
      const velocityThreshold = 500;
      const currentTheme = themes[currentIndex];
      if (!currentTheme) return;

      if (
        info.offset.x > threshold ||
        info.velocity.x > velocityThreshold
      ) {
        // Right swipe — Like
        setExitDirection("right");
        onLike(currentTheme);
        setTimeout(() => {
          setExitDirection(null);
          const next = currentIndex + 1;
          setCurrentIndex(next);
          if (next >= themes.length) onComplete();
        }, 300);
      } else if (
        info.offset.x < -threshold ||
        info.velocity.x < -velocityThreshold
      ) {
        // Left swipe — Skip
        setExitDirection("left");
        onSkip(currentTheme);
        setTimeout(() => {
          setExitDirection(null);
          const next = currentIndex + 1;
          setCurrentIndex(next);
          if (next >= themes.length) onComplete();
        }, 300);
      }
    },
    [themes, currentIndex, onLike, onSkip, onComplete]
  );

  const handleButtonLike = useCallback(() => {
    const currentTheme = themes[currentIndex];
    if (!currentTheme) return;
    setExitDirection("right");
    onLike(currentTheme);
    setTimeout(() => {
      setExitDirection(null);
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next >= themes.length) onComplete();
    }, 300);
  }, [themes, currentIndex, onLike, onComplete]);

  const handleButtonSkip = useCallback(() => {
    const currentTheme = themes[currentIndex];
    if (!currentTheme) return;
    setExitDirection("left");
    onSkip(currentTheme);
    setTimeout(() => {
      setExitDirection(null);
      const next = currentIndex + 1;
      setCurrentIndex(next);
      if (next >= themes.length) onComplete();
    }, 300);
  }, [themes, currentIndex, onSkip, onComplete]);

  if (currentIndex >= themes.length) return null;

  // Visible cards: current + up to 2 behind
  const visibleThemes = themes.slice(currentIndex, currentIndex + 3);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card stack */}
      <div className="relative w-full max-w-75 aspect-3/5">
        <AnimatePresence>
          {visibleThemes
            .map((theme, stackIndex) => {
              const isTop = stackIndex === 0;
              const scale = 1 - stackIndex * 0.05;
              const yOffset = stackIndex * 12;

              if (isTop) {
                return (
                  <motion.div
                    key={theme.id}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                    style={{ x, rotate, zIndex: 10 - stackIndex }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                    exit={{
                      x: exitDirection === "right" ? 400 : -400,
                      opacity: 0,
                      rotate: exitDirection === "right" ? 20 : -20,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {/* Like overlay */}
                    <motion.div
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-green-400/20 pointer-events-none"
                      style={{ opacity: likeOpacity }}
                    >
                      <div className="px-6 py-3 rounded-2xl border-4 border-green-500 rotate-[-15deg]">
                        <span className="text-3xl font-black text-green-500">
                          LIKE
                        </span>
                      </div>
                    </motion.div>

                    {/* Skip overlay */}
                    <motion.div
                      className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-red-400/20 pointer-events-none"
                      style={{ opacity: skipOpacity }}
                    >
                      <div className="px-6 py-3 rounded-2xl border-4 border-red-500 rotate-[15deg]">
                        <span className="text-3xl font-black text-red-500">
                          SKIP
                        </span>
                      </div>
                    </motion.div>

                    <ThemeCard
                      theme={theme}
                      isImageLoading={loadingImages.has(theme.id)}
                    />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={theme.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 10 - stackIndex }}
                  animate={{
                    scale,
                    y: yOffset,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ThemeCard
                    theme={theme}
                    isImageLoading={loadingImages.has(theme.id)}
                  />
                </motion.div>
              );
            })
            .reverse()}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-8">
        <button
          onClick={handleButtonSkip}
          className="w-14 h-14 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center btn-squishy hover:shadow-xl transition-shadow active:scale-95"
          aria-label="スキップ"
        >
          <X size={24} className="text-red-400" />
        </button>
        <button
          onClick={handleButtonLike}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-accent to-magic-pink shadow-lg flex items-center justify-center btn-squishy hover:shadow-xl transition-shadow active:scale-95"
          aria-label="このテーマを選ぶ"
        >
          <Heart size={28} className="text-white fill-white" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {themes.map((t, i) => (
          <div
            key={t.id}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < currentIndex
                ? "bg-neon-accent"
                : i === currentIndex
                  ? "bg-neon-accent/60"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
