"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FollowUserCard } from "@/components/follow-user-card";
import { useFollowList } from "@/hooks/use-follow-list";
import { useAuth } from "@/components/auth/auth-provider";

export default function FollowersPage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { users, isLoading, mutate } = useFollowList(userId, "followers");

  const handleToggleFollow = useCallback(
    async (targetUserId: string) => {
      try {
        await fetch("/api/social/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_user_id: targetUserId }),
        });
        mutate();
      } catch {
        // ignore
      }
    },
    [mutate],
  );

  return (
    <div>
      <PageHeader title="フォロワー" backHref={`/profile/${userId}`} />

      <div className="px-4 py-2">
        {isLoading && (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-text-muted/30 mb-3" />
            <p className="text-sm text-text-muted">フォロワーはまだいません</p>
          </div>
        )}

        {users.map((u) => (
          <FollowUserCard
            key={u.user_id}
            user={u}
            onToggleFollow={() => handleToggleFollow(u.user_id)}
            isCurrentUser={u.user_id === user?.uid}
          />
        ))}
      </div>
    </div>
  );
}
