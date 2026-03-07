"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, LayoutGrid, Newspaper, User, Plus } from "lucide-react";
import { QuickActionSheet } from "@/components/quick-action-sheet";

const tabs = [
  { id: "chat", label: "AI美容部員", icon: Sparkles, href: "/chat" },
  { id: "inventory", label: "My Cosme", icon: LayoutGrid, href: "/inventory" },
  { id: "plus", label: "", icon: Plus, href: "" }, // center button placeholder
  { id: "feed", label: "フィード", icon: Newspaper, href: "/feed" },
  { id: "mypage", label: "マイページ", icon: User, href: "/mypage" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  const handlePlusTap = () => {
    // Haptic feedback for PWA
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setQuickActionOpen(true);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
        <nav className="glass-panel rounded-full px-2 py-2 flex justify-between items-center shadow-2xl">
          {tabs.map(({ id, icon: Icon, href }) => {
            // Center "+" button — special rendering
            if (id === "plus") {
              return (
                <button
                  key={id}
                  onClick={handlePlusTap}
                  className="relative flex items-center justify-center w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-neon-accent/90 to-magic-pink/90 backdrop-blur-sm text-white shadow-lg shadow-neon-glow btn-squishy transition-all active:scale-95 after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-b after:from-white/25 after:to-transparent after:pointer-events-none"
                  aria-label="クイックアクション"
                >
                  <Plus size={24} strokeWidth={2.5} className="relative z-10" />
                </button>
              );
            }

            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={id}
                href={href}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 btn-squishy ${
                  isActive
                    ? "bg-white shadow-md text-neon-accent"
                    : "text-text-muted hover:text-text-ink"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-neon-accent" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <QuickActionSheet open={quickActionOpen} onOpenChange={setQuickActionOpen} />
    </>
  );
}
