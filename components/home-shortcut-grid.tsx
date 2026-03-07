"use client";

import Link from "next/link";
import {
  Sparkles, Crown, BookOpen, Camera, CalendarHeart, LayoutGrid,
} from "lucide-react";

const SHORTCUTS = [
  {
    icon: Sparkles,
    label: "AI診断",
    href: "/chat",
    gradient: "from-neon-accent to-magic-pink",
  },
  {
    icon: Crown,
    label: "ランキング",
    href: "/add/community",
    gradient: "from-alchemy-gold to-alchemy-gold-light",
  },
  {
    icon: BookOpen,
    label: "レシピ",
    href: "/recipes",
    gradient: "from-magic-purple to-neon-accent",
  },
  {
    icon: Camera,
    label: "スキャン",
    href: "/scan",
    gradient: "from-magic-pink to-neon-accent",
  },
  {
    icon: CalendarHeart,
    label: "メイク日記",
    href: "/beauty-log",
    gradient: "from-neon-accent to-magic-purple",
  },
  {
    icon: LayoutGrid,
    label: "My Cosme",
    href: "/inventory",
    gradient: "from-alchemy-gold-light to-magic-pink",
  },
] as const;

export function HomeShortcutGrid() {
  return (
    <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3">
      {SHORTCUTS.map(({ icon: Icon, label, href, gradient }) => (
        <Link
          key={href}
          href={href}
          className="shrink-0 flex flex-col items-center gap-1.5 w-[60px] btn-squishy"
        >
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
          >
            <Icon size={20} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium text-text-muted text-center leading-tight">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
