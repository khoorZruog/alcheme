"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThinkingIndicatorProps {
  /** Real-time status from SSE progress events */
  status?: string | null;
}

const FALLBACK_STATUS = "考え中...";

/** Rotating tips shown while the user waits */
const TIPS = [
  "手持ちコスメから最適な組み合わせを分析しています",
  "季節や気温に合わせたアドバイスを準備中",
  "似合うカラーの組み合わせを計算しています",
  "プロのテクニックを盛り込んだレシピを作成中",
  "仕上がりの持続力も考慮してレシピを最適化中",
];

export function ThinkingIndicator({ status }: ThinkingIndicatorProps) {
  const displayText = status || FALLBACK_STATUS;
  const [history, setHistory] = useState<string[]>([displayText]);
  const prevStatusRef = useRef(displayText);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Track history of statuses for progress dots
  useEffect(() => {
    if (displayText !== prevStatusRef.current) {
      prevStatusRef.current = displayText;
      setHistory((prev) => {
        if (prev[prev.length - 1] === displayText) return prev;
        return [...prev, displayText];
      });
    }
  }, [displayText]);

  // Timer + rotating tips
  useEffect(() => {
    setHistory([displayText]);
    setElapsed(0);
    setTipIndex(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    const tipTimer = setInterval(
      () => setTipIndex((i) => (i + 1) % TIPS.length),
      4000
    );
    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-[85%]">
      <div className="glass-card rounded-2xl p-4 border-l-4 border-l-neon-accent bg-white/40 relative overflow-hidden">
        {/* Shimmer animation overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "400%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Current status text */}
        <div className="h-5 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-bold text-neon-accent tracking-wider absolute inset-0 flex items-center gap-2"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-accent" />
              </span>
              {displayText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Rotating tip */}
        <div className="h-4 mt-2 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] text-text-ink/50 absolute inset-0 flex items-center"
            >
              {TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress: completed steps + elapsed time */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1.5">
            {history.map((_, i) => (
              <motion.div
                key={i}
                initial={{ width: 8, opacity: 0 }}
                animate={{
                  width: i === history.length - 1 ? 24 : 12,
                  opacity: 1,
                }}
                transition={{ duration: 0.3 }}
                className={`h-1.5 rounded-full ${
                  i === history.length - 1
                    ? "bg-neon-accent/80"
                    : "bg-neon-accent/30"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-text-ink/40 tabular-nums">
            {elapsed}s
          </span>
        </div>
      </div>
    </div>
  );
}
