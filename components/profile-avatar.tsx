"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { User } from "lucide-react";

interface ProfileAvatarProps {
  onClick: () => void;
}

export function ProfileAvatar({ onClick }: ProfileAvatarProps) {
  const { user, profile } = useAuth();

  const photoURL = profile?.photoURL || user?.photoURL;
  const displayName = profile?.displayName ?? user?.displayName;
  const initial = displayName?.charAt(0)?.toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/60 shadow-md btn-squishy flex-shrink-0"
      aria-label="メニューを開く"
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName ?? "プロフィール"}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : initial ? (
        <div className="w-full h-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </button>
  );
}
