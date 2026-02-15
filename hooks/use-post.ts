"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { fetcher } from "@/lib/api/fetcher";
import type { SocialPost, SocialComment } from "@/types/social";

export function usePost(postId: string) {
  const { data, error, isLoading, mutate } = useSWR<{ post: SocialPost }>(
    postId ? `/api/social/posts/${postId}` : null,
    fetcher
  );

  const {
    data: commentsData,
    isLoading: commentsLoading,
    mutate: mutateComments,
  } = useSWR<{ comments: SocialComment[]; count: number }>(
    postId ? `/api/social/posts/${postId}/comments` : null,
    fetcher
  );

  const toggleLike = useCallback(async () => {
    if (!postId) return;

    // Optimistic update
    mutate(
      (prev) =>
        prev
          ? {
              post: {
                ...prev.post,
                is_liked: !prev.post.is_liked,
                like_count: prev.post.is_liked
                  ? Math.max(0, prev.post.like_count - 1)
                  : prev.post.like_count + 1,
              },
            }
          : prev,
      false
    );

    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Like request failed");
    } catch {
      toast.error("いいねの処理に失敗しました");
      mutate();
      return;
    }

    mutate();
  }, [postId, mutate]);

  const addComment = useCallback(
    async (
      text: string,
      type: "comment" | "reaction",
      reactionKey?: string
    ) => {
      if (!postId) return;

      try {
        const res = await fetch(`/api/social/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, type, reaction_key: reactionKey }),
        });
        if (!res.ok) throw new Error("Comment request failed");
        toast.success(
          type === "reaction" ? "リアクションしました" : "コメントを投稿しました"
        );
      } catch {
        toast.error("コメントの投稿に失敗しました");
        return;
      }

      mutateComments();
      // Also update comment count on the post
      mutate();
    },
    [postId, mutateComments, mutate]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!postId) return;

      try {
        const res = await fetch(
          `/api/social/posts/${postId}/comments/${commentId}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Delete comment failed");
        toast.success("コメントを削除しました");
      } catch {
        toast.error("コメントの削除に失敗しました");
        return;
      }

      mutateComments();
      mutate();
    },
    [postId, mutateComments, mutate]
  );

  return {
    post: data?.post ?? null,
    comments: commentsData?.comments ?? [],
    commentCount: commentsData?.count ?? 0,
    isLoading,
    commentsLoading,
    error,
    toggleLike,
    addComment,
    deleteComment,
    mutate: () => mutate(),
  };
}
