"use client";

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
        <HelpCircle className="h-3.5 w-3.5 text-text-muted" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(({ category, count }) => (
          <div
            key={category}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white/50 border border-white/60 text-center min-w-[80px]"
          >
            <p className="text-xs font-bold text-text-ink">{category}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{count} 件</p>
          </div>
        ))}
      </div>
    </div>
  );
}
