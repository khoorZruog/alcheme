"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { InventoryItem, Rarity } from "@/types/inventory";

interface AppraisalEffectProps {
  items: InventoryItem[];
  onComplete: () => void;
}

const RARITY_MESSAGES: Record<Rarity, { text: string; color: string }> = {
  SSR: { text: "✨✨ 伝説級アイテムを発見！！", color: "text-alcheme-ssr" },
  SR: { text: "✨ レアアイテムを発見！", color: "text-alcheme-sr" },
  R: { text: "頼れる定番アイテムですね！", color: "text-alcheme-r" },
  N: { text: "新しいアイテムを登録しました", color: "text-alcheme-muted" },
};

const RARITY_GLOW: Record<Rarity, string> = {
  SSR: "shadow-[0_0_40px_rgba(255,215,0,0.5)]",
  SR: "shadow-[0_0_30px_rgba(192,132,252,0.4)]",
  R: "shadow-[0_0_20px_rgba(96,165,250,0.3)]",
  N: "",
};

export function AppraisalEffect({ items, onComplete }: AppraisalEffectProps) {
  const [phase, setPhase] = useState<"loading" | "revealing" | "done">("loading");
  const [revealIndex, setRevealIndex] = useState(-1);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setPhase("revealing");
      setRevealIndex(0);
    }, 2000);

    return () => clearTimeout(loadTimer);
  }, []);

  useEffect(() => {
    if (phase !== "revealing") return;
    if (revealIndex >= items.length) {
      const doneTimer = setTimeout(() => {
        setPhase("done");
        onComplete();
      }, 800);
      return () => clearTimeout(doneTimer);
    }

    const revealTimer = setTimeout(
      () => setRevealIndex((i) => i + 1),
      1200
    );
    return () => clearTimeout(revealTimer);
  }, [phase, revealIndex, items.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-alcheme-cream">
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mx-auto mb-6"
            >
              <Sparkles className="h-16 w-16 text-alcheme-gold" />
            </motion.div>
            <p className="font-display text-xl font-bold text-alcheme-charcoal">
              鑑定中...
            </p>
            <p className="mt-2 text-sm text-alcheme-muted">
              アイテムを解析しています
            </p>
          </motion.div>
        )}

        {phase === "revealing" && revealIndex < items.length && (
          <motion.div
            key={`item-${revealIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="text-center px-8"
          >
            <motion.div
              className={`mx-auto mb-4 w-24 h-24 rounded-card bg-white flex items-center justify-center ${RARITY_GLOW[items[revealIndex].rarity ?? "N"]}`}
            >
              <Sparkles className="h-10 w-10 text-alcheme-gold" />
            </motion.div>

            <p className="text-xs text-alcheme-muted uppercase tracking-wider">
              {items[revealIndex].brand}
            </p>
            <p className="mt-1 font-display text-lg font-bold text-alcheme-charcoal">
              {items[revealIndex].product_name}
            </p>
            <p
              className={`mt-2 text-sm font-medium ${RARITY_MESSAGES[items[revealIndex].rarity ?? "N"].color}`}
            >
              {RARITY_MESSAGES[items[revealIndex].rarity ?? "N"].text}
            </p>

            <p className="mt-6 text-xs text-alcheme-muted">
              {revealIndex + 1} / {items.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
