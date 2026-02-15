"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import type { PublicUserProfile } from "@/types/social";

export function useFollow(targetUserId: string) {
  const { data, mutate } = useSWR<{ profile: PublicUserProfile }>(
    targetUserId ? `/api/social/users/${targetUserId}` : null,
    fetcher
  );

  const toggleFollow = useCallback(async () => {
    if (!targetUserId) return;

    // Optimistic update
    mutate(
      (prev) =>
        prev
          ? {
              profile: {
                ...prev.profile,
                is_following: !prev.profile.is_following,
                stats: {
                  ...prev.profile.stats,
                  follower_count: prev.profile.is_following
                    ? Math.max(0, prev.profile.stats.follower_count - 1)
                    : prev.profile.stats.follower_count + 1,
                },
              },
            }
          : prev,
      false
    );

    try {
      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUserId }),
      });
      if (!res.ok) throw new Error("Follow request failed");
    } catch {
      toast.error("フォローの処理に失敗しました");
      mutate();
      return;
    }

    mutate();
  }, [targetUserId, mutate]);

  return {
    isFollowing: data?.profile?.is_following ?? false,
    followerCount: data?.profile?.stats?.follower_count ?? 0,
    profile: data?.profile ?? null,
    toggleFollow,
  };
}
