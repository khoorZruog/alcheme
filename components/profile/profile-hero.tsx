"use client";

import { User } from "lucide-react";

interface ProfileHeroProps {
  photoUrl: string | null;
  displayName: string;
  stats: {
    following_count: number;
    follower_count: number;
    total_likes: number;
  };
}

function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function ProfileHero({ photoUrl, displayName, stats }: ProfileHeroProps) {
  return (
    <div className="flex items-start gap-4 px-4">
      {/* Avatar */}
      <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-white/60 shadow-md flex-shrink-0">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-2xl font-bold">
            {displayName?.charAt(0)?.toUpperCase() || (
              <User className="h-8 w-8 text-white" />
            )}
          </div>
        )}
      </div>

      {/* Name + Stats */}
      <div className="flex-1 min-w-0 pt-1">
        <h2 className="text-lg font-bold text-text-ink truncate">
          {displayName || "ユーザー"}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <StatItem count={stats.following_count} label="フォロー" />
          <StatItem count={stats.follower_count} label="フォロワー" />
          <StatItem count={stats.total_likes} label="いいね・保存" />
        </div>
      </div>
    </div>
  );
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-text-ink">{formatCount(count)}</p>
      <p className="text-[10px] text-text-muted">{label}</p>
    </div>
  );
}
