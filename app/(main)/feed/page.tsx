"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Newspaper } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FeedPostCard } from "@/components/feed-post-card";
import { CommentsSheet } from "@/components/comments-sheet";
import { FeedGridSkeleton } from "@/components/loading-skeleton";
import { useFeed } from "@/hooks/use-feed";
import { usePost } from "@/hooks/use-post";
import { useAuth } from "@/components/auth/auth-provider";

export default function FeedPage() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<"all" | "following">("all");
  const { posts, isLoading, hasMore, isEmpty, loadMore, mutate } =
    useFeed(feedType);

  // Comments sheet state
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const {
    comments,
    commentCount,
    toggleLike: toggleLikeDetail,
    addComment,
    deleteComment,
  } = usePost(commentsPostId || "");

  // Infinite scroll observer
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        const res = await fetch(`/api/social/posts/${postId}/like`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
      } catch {
        // ignore
      }
      mutate();
    },
    [mutate]
  );

  return (
    <div>
      <PageHeader title="フィード" />

      {/* Tab bar */}
      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={() => setFeedType("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            feedType === "all"
              ? "bg-alcheme-charcoal text-white"
              : "bg-alcheme-sand/50 text-alcheme-muted hover:bg-alcheme-sand"
          }`}
        >
          みんな
        </button>
        <button
          onClick={() => setFeedType("following")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            feedType === "following"
              ? "bg-alcheme-charcoal text-white"
              : "bg-alcheme-sand/50 text-alcheme-muted hover:bg-alcheme-sand"
          }`}
        >
          フォロー中
        </button>
      </div>

      {/* Posts list */}
      <div className="px-4 pb-4 space-y-4">
        {isLoading && <FeedGridSkeleton />}

        {!isLoading && isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-alcheme-sand/50 flex items-center justify-center mb-4">
              <Newspaper className="w-7 h-7 text-alcheme-muted" />
            </div>
            <p className="text-sm text-alcheme-muted mb-1">
              {feedType === "following"
                ? "フォロー中のユーザーの投稿がありません"
                : "まだ投稿がありません"}
            </p>
            <p className="text-xs text-alcheme-muted">
              {feedType === "following"
                ? "ユーザーをフォローしてフィードを充実させましょう"
                : "レシピを公開して最初の投稿をしましょう"}
            </p>
          </div>
        )}

        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            post={post}
            onLike={() => handleLike(post.id)}
            onCommentClick={() => setCommentsPostId(post.id)}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        open={commentsPostId !== null}
        onOpenChange={(open) => {
          if (!open) setCommentsPostId(null);
        }}
        comments={comments}
        commentCount={commentCount}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        currentUserId={user?.uid}
      />
    </div>
  );
}
