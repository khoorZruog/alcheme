"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ChipDef {
  text: string;
  emoji: string;
  action?: string; // "theme" opens overlay instead of sending chat message
}

const CHIPS: ChipDef[] = [
  { text: "メイクテーマ提案", emoji: "🎨", action: "theme" },
  { text: "今日のメイクおみくじ", emoji: "🎯", action: "omikuji" },
  { text: "おまかせ提案", emoji: "✨" },
  { text: "手持ちコスメで新コンビ", emoji: "💄", action: "cosme_picker" },
  { text: "眠ってるコスメ活用", emoji: "🔍" },
  { text: "今日の天気に合うメイク", emoji: "🌤️" },
];

interface QuickActionChipsProps {
  visible: boolean;
  onSelect: (text: string, action?: string) => void;
}

export function QuickActionChips({ visible, onSelect }: QuickActionChipsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap gap-2 justify-center px-2 py-2"
        >
          {CHIPS.map((chip) => (
            <button
              key={chip.text}
              className="glass-card bg-white/70 px-4 py-3 rounded-2xl text-sm font-bold text-text-ink border border-white/80 hover:shadow-md hover:border-neon-accent/30 transition-all btn-squishy basis-[calc(33.333%-8px)] min-w-25"
              onClick={() => onSelect(chip.text, chip.action)}
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
