"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";

interface CategoryCount {
  category: string;
  count: number;
}

interface ProfileCategoryBadgesProps {
  categories: CategoryCount[];
}

export function ProfileCategoryBadges({ categories }: ProfileCategoryBadgesProps) {
  if (categories.length === 0) return null;

  return (
    <div className="px-4 space-y-2">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-bold text-text-ink">マスターカテゴリ</h3>
        <div className="relative group">
          <HelpCircle className="h-3.5 w-3.5 text-text-muted cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-text-ink text-white text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
            登録されたコスメのカテゴリ分布
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-ink" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(({ category, count }) => (
          <Link
            key={category}
            href={`/inventory?category=${encodeURIComponent(category)}`}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white/50 border border-white/60 text-center min-w-[80px] hover:border-neon-accent hover:bg-white/80 transition-colors btn-squishy"
          >
            <p className="text-xs font-bold text-text-ink">{category}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{count} 件</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
