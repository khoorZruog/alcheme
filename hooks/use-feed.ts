"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/api/fetcher";
import type { SocialPost } from "@/types/social";

interface FeedPage {
  posts: SocialPost[];
  next_cursor: string | null;
  count: number;
}

export function useFeed(feedType: "all" | "following" = "all") {
  const getKey = (pageIndex: number, previousPageData: FeedPage | null) => {
    // First page
    if (pageIndex === 0) {
      return `/api/social/posts?feed_type=${feedType}&limit=20`;
    }
    // No more pages
    if (!previousPageData?.next_cursor) return null;
    return `/api/social/posts?feed_type=${feedType}&limit=20&cursor=${encodeURIComponent(previousPageData.next_cursor)}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<FeedPage>(getKey, fetcher, {
      revalidateFirstPage: false,
    });

  const posts = data ? data.flatMap((page) => page.posts) : [];
  const hasMore = data ? data[data.length - 1]?.next_cursor !== null : false;
  const isEmpty = data?.[0]?.posts.length === 0;

  return {
    posts,
    isLoading,
    isLoadingMore: isValidating && size > 1,
    error,
    hasMore,
    isEmpty,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
