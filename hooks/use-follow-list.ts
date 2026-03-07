import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import type { FollowInfo } from "@/types/social";

export function useFollowList(userId: string, type: "followers" | "following") {
  const { data, isLoading, mutate } = useSWR<{ users: FollowInfo[]; count: number }>(
    userId ? `/api/social/users/${userId}/${type}` : null,
    fetcher,
  );

  return {
    users: data?.users ?? [],
    count: data?.count ?? 0,
    isLoading,
    mutate,
  };
}
