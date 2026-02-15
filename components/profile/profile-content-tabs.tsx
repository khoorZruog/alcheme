"use client";

import { LayoutGrid, BookOpen, CalendarHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileContentTab = "posts" | "recipes" | "beautyLogs";

interface TabDef {
  key: ProfileContentTab;
  icon: typeof LayoutGrid;
  label: string;
}

const ALL_TABS: TabDef[] = [
  { key: "posts", icon: LayoutGrid, label: "投稿" },
  { key: "recipes", icon: BookOpen, label: "レシピ" },
  { key: "beautyLogs", icon: CalendarHeart, label: "メイク日記" },
];

interface ProfileContentTabsProps {
  activeTab: ProfileContentTab;
  onTabChange: (tab: ProfileContentTab) => void;
  availableTabs?: ProfileContentTab[];
}

export function ProfileContentTabs({
  activeTab,
  onTabChange,
  availableTabs,
}: ProfileContentTabsProps) {
  const tabs = availableTabs
    ? ALL_TABS.filter((t) => availableTabs.includes(t.key))
    : ALL_TABS;

  return (
    <div className="flex border-b border-white/30">
      {tabs.map(({ key, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            "flex-1 flex items-center justify-center py-3 transition-colors relative",
            activeTab === key
              ? "text-text-ink"
              : "text-text-muted hover:text-text-ink/60"
          )}
        >
          <Icon className="h-5 w-5" />
          {activeTab === key && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-text-ink rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
