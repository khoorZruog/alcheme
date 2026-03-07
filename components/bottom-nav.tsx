"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Sparkles, ShoppingBag, User } from "lucide-react";

const tabs = [
  { id: "home", label: "ホーム", icon: Home, href: "/feed" },
  { id: "discover", label: "発見", icon: Search, href: "/add/community" },
  { id: "chat", label: "AI美容部員", icon: Sparkles, href: "/chat", isCenter: true as const },
  { id: "shop", label: "Next Cosme", icon: ShoppingBag, href: "/suggestions" },
  { id: "mypage", label: "マイページ", icon: User, href: "/mypage" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
      <nav className="glass-panel rounded-full px-2 py-2 flex justify-between items-center shadow-2xl">
        {tabs.map(({ id, label, icon: Icon, href, isCenter }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");

          // Center tab (AI美容部員) — gradient hero styling
          if (isCenter) {
            return (
              <Link
                key={id}
                href={href}
                aria-label={label}
                className={`relative flex items-center justify-center w-[48px] h-[48px] rounded-full transition-all duration-300 btn-squishy ${
                  isActive
                    ? "bg-gradient-to-tr from-neon-accent to-magic-pink text-white shadow-lg shadow-neon-glow"
                    : "bg-neon-accent/10 text-neon-accent hover:bg-neon-accent/20"
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            );
          }

          return (
            <Link
              key={id}
              href={href}
              aria-label={label}
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 btn-squishy ${
                isActive
                  ? "bg-white shadow-md text-neon-accent"
                  : "text-text-muted hover:text-text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-neon-accent" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
