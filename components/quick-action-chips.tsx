"use client";

import { motion, AnimatePresence } from "framer-motion";

const CHIPS = [
  { text: "今日のメイク", emoji: "💄" },
  { text: "時短5分", emoji: "⏱️" },
  { text: "デートメイク", emoji: "💕" },
];

interface QuickActionChipsProps {
  visible: boolean;
  onSelect: (text: string) => void;
}

export function QuickActionChips({ visible, onSelect }: QuickActionChipsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2"
        >
          {CHIPS.map((chip) => (
            <button
              key={chip.text}
              className="shrink-0 glass-card bg-white/70 px-4 py-2.5 rounded-full text-sm font-bold text-text-ink border border-white/80 hover:shadow-md hover:border-neon-accent/30 transition-all btn-squishy"
              onClick={() => onSelect(chip.text)}
            >
              <span className="mr-1.5">{chip.emoji}</span>
              {chip.text}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
