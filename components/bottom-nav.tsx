"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ScanLine, LayoutGrid, BookOpen, User } from "lucide-react";

const tabs = [
  { id: "chat", label: "Concierge", icon: Sparkles, href: "/chat" },
  { id: "scan", label: "Scan", icon: ScanLine, href: "/scan" },
  { id: "inventory", label: "Vanity", icon: LayoutGrid, href: "/inventory" },
  { id: "recipes", label: "Recipe", icon: BookOpen, href: "/recipes" },
  { id: "me", label: "Me", icon: User, href: "/settings" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6">
      <nav className="glass-panel rounded-full px-2 py-2 flex justify-between items-center shadow-2xl">
        {tabs.map(({ id, icon: Icon, href }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={id}
              href={href}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 btn-squishy ${
                isActive
                  ? "bg-white shadow-md text-neon-accent"
                  : "text-text-muted hover:text-text-ink"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
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
