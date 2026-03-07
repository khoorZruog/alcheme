"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { FollowInfo } from "@/types/social";

interface FollowUserCardProps {
  user: FollowInfo;
  onToggleFollow: () => void;
  isCurrentUser: boolean;
}

export function FollowUserCard({ user, onToggleFollow, isCurrentUser }: FollowUserCardProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar + Name — links to profile */}
      <Link href={`/profile/${user.user_id}`} className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-full overflow-hidden border border-white/60 shadow-sm flex-shrink-0">
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.display_name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-sm font-bold">
              {user.display_name?.charAt(0)?.toUpperCase() || (
                <User className="h-5 w-5" />
              )}
            </div>
          )}
        </div>
        <p className="text-sm font-medium text-text-ink truncate">
          {user.display_name}
        </p>
      </Link>

      {/* Follow button (not shown for current user) */}
      {!isCurrentUser && (
        <button
          onClick={onToggleFollow}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 btn-squishy ${
            user.is_following
              ? "bg-gray-100 text-text-muted hover:bg-gray-200"
              : "bg-gradient-to-r from-neon-accent to-magic-pink text-white"
          }`}
        >
          {user.is_following ? "フォロー中" : "フォロー"}
        </button>
      )}
    </div>
  );
}
