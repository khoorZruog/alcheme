"use client";

import Link from "next/link";

interface GridItem {
  id: string;
  imageUrl?: string;
  href: string;
  label?: string;
}

interface ProfileContentGridProps {
  items: GridItem[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function ProfileContentGrid({
  items,
  isLoading,
  emptyMessage = "まだ投稿がありません",
}: ProfileContentGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-white/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-text-muted py-12">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map((item) => (
        <Link key={item.id} href={item.href} className="relative aspect-square block">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.label || ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-white/60 to-white/30 flex items-center justify-center p-2">
              <span className="text-[10px] text-text-muted text-center leading-tight line-clamp-3">
                {item.label || ""}
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
