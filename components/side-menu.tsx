"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles, LayoutGrid, BookOpen, ShoppingBag, CalendarHeart,
  Newspaper, Settings, User, LogOut,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAIN_MENU = [
  { icon: Sparkles, label: "AI美容部員", href: "/chat" },
  { icon: LayoutGrid, label: "コスメ", href: "/inventory" },
  { icon: BookOpen, label: "レシピ", href: "/recipes" },
  { icon: ShoppingBag, label: "買い足し", href: "/suggestions" },
  { icon: CalendarHeart, label: "メイク日記", href: "/beauty-log" },
] as const;

const SUB_MENU = [
  { icon: Newspaper, label: "フィード", href: "/feed" },
  { icon: User, label: "プロフィール", href: "/profile" },
  { icon: Settings, label: "設定", href: "/settings" },
] as const;

export function SideMenu({ open, onOpenChange }: SideMenuProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const displayName = profile?.displayName ?? user?.displayName ?? "ユーザー";
  const email = user?.email;
  const photoURL = profile?.photoURL || user?.photoURL;

  const handleLogout = async () => {
    onOpenChange(false);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
    await signOut(auth);
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-white border-r border-gray-100 p-0 w-[280px] sm:max-w-[280px]"
      >
        <SheetHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md flex-shrink-0">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-lg font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-sm font-bold text-text-ink text-left truncate">
                {displayName}
              </SheetTitle>
              {email && (
                <p className="text-[11px] text-text-muted truncate">{email}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <nav className="py-2">
          {MAIN_MENU.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive(href)
                  ? "text-neon-accent bg-neon-accent/5 font-medium"
                  : "text-text-ink hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive(href) ? "text-neon-accent" : "text-text-muted"}`} />
              {label}
            </Link>
          ))}

          <div className="mx-6 my-2 border-t border-gray-100" />

          {SUB_MENU.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => onOpenChange(false)}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive(href)
                  ? "text-neon-accent bg-neon-accent/5 font-medium"
                  : "text-text-ink hover:bg-gray-50"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive(href) ? "text-neon-accent" : "text-text-muted"}`} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-2 py-2 text-sm text-text-muted hover:text-red-500 transition-colors rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            ログアウト
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
