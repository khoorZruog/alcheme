"use client";

import { cn } from "@/lib/utils";
import type { CosmeCategory } from "@/types/inventory";

export type Category = "全て" | CosmeCategory;

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "全て",       label: "全て" },
  { value: "ベースメイク", label: "ベースメイク" },
  { value: "アイメイク",   label: "アイメイク" },
  { value: "リップ",       label: "リップ" },
  { value: "スキンケア",   label: "スキンケア" },
  { value: "その他",       label: "その他" },
];

interface CategoryFilterProps {
  value: Category;
  onChange: (category: Category) => void;
  className?: string;
}

export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto hide-scrollbar pb-2", className)}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            "shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all border btn-squishy",
            value === cat.value
              ? "bg-text-ink text-white border-text-ink"
              : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
