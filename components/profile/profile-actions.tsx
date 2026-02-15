"use client";

import Link from "next/link";
import { UserPlus, UserCheck } from "lucide-react";

interface ProfileActionsProps {
  isOwnProfile: boolean;
  completionRate?: number;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
}

export function ProfileActions({
  isOwnProfile,
  completionRate,
  isFollowing,
  onToggleFollow,
}: ProfileActionsProps) {
  if (isOwnProfile) {
    return (
      <div className="px-4 flex gap-2">
        <Link
          href="/settings"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/60 border border-white/80 text-sm font-medium text-text-ink btn-squishy transition-colors hover:bg-white/80"
        >
          プロフィールを編集{" "}
          {completionRate !== undefined && (
            <span className="text-text-muted">{completionRate}%</span>
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4">
      <button
        onClick={onToggleFollow}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors btn-squishy ${
          isFollowing
            ? "bg-white/60 text-text-ink border border-white/80"
            : "bg-gradient-to-r from-neon-accent to-magic-pink text-white"
        }`}
      >
        {isFollowing ? (
          <>
            <UserCheck className="h-4 w-4" />
            フォロー中
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            フォローする
          </>
        )}
      </button>
    </div>
  );
}
