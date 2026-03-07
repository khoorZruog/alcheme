"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Newspaper, BookOpen, Loader2 } from "lucide-react";
import { MainTabHeader } from "@/components/main-tab-header";
import { FeedPostCard } from "@/components/feed-post-card";
import { CommentsSheet } from "@/components/comments-sheet";
import { HomeShortcutGrid } from "@/components/home-shortcut-grid";
import { FeedGridSkeleton } from "@/components/loading-skeleton";
import { useFeed } from "@/hooks/use-feed";
import { usePost } from "@/hooks/use-post";
import { useAuth } from "@/components/auth/auth-provider";
import { fetcher } from "@/lib/api/fetcher";
import type { FollowInfo } from "@/types/social";
import type { Recipe } from "@/types/recipe";

type FeedTab = "all" | "following" | "recipes";

export default function FeedPage() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<FeedTab>("all");
  const { posts, isLoading, hasMore, isEmpty, loadMore, mutate } =
    useFeed(feedType === "recipes" ? "all" : feedType);

  // Recipe data (only fetched when recipes tab is active)
  const { data: recipesData, isLoading: recipesLoading } = useSWR<{ recipes: Recipe[] }>(
    feedType === "recipes" ? "/api/recipes" : null,
    fetcher,
  );

  // Following list for current user (to show follow buttons on posts)
  const { data: followingData, mutate: mutateFollowing } = useSWR<{ users: FollowInfo[] }>(
    user?.uid ? `/api/social/users/${user.uid}/following` : null,
    fetcher,
  );
  const followingSet = new Set(followingData?.users?.map((u) => u.user_id) ?? []);

  const handleFollow = useCallback(
    async (targetUserId: string) => {
      try {
        await fetch("/api/social/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_user_id: targetUserId }),
        });
      } catch {
        // ignore
      }
      mutateFollowing();
      mutate();
    },
    [mutateFollowing, mutate],
  );

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
      <MainTabHeader title="ホーム" subtitle="HOME" />

      <HomeShortcutGrid />

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
          おすすめ
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
        <button
          onClick={() => setFeedType("recipes")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            feedType === "recipes"
              ? "bg-alcheme-charcoal text-white"
              : "bg-alcheme-sand/50 text-alcheme-muted hover:bg-alcheme-sand"
          }`}
        >
          レシピ
        </button>
      </div>

      {/* Content */}
      {feedType === "recipes" ? (
        <div className="px-4 pb-4">
          {recipesLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-neon-accent animate-spin" />
            </div>
          )}

          {!recipesLoading && (!recipesData?.recipes || recipesData.recipes.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-alcheme-sand/50 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-alcheme-muted" />
              </div>
              <p className="text-sm text-alcheme-muted mb-1">レシピがまだありません</p>
              <p className="text-xs text-alcheme-muted">AIにメイクレシピを相談してみましょう</p>
            </div>
          )}

          {recipesData?.recipes && recipesData.recipes.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {recipesData.recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="glass-card rounded-2xl overflow-hidden hover:bg-white/80 transition btn-squishy"
                >
                  {recipe.preview_image_url ? (
                    <div className="aspect-[4/3] bg-gray-50">
                      <img
                        src={recipe.preview_image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-surface-cream to-white flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-text-muted/30" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-text-ink line-clamp-1 leading-tight">
                      {recipe.recipe_name}
                    </p>
                    {recipe.match_score != null && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        再現度 {Math.round(recipe.match_score)}%
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
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
              isOwnPost={post.user_id === user?.uid}
              isFollowing={followingSet.has(post.user_id)}
              onFollow={() => handleFollow(post.user_id)}
            />
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} className="h-4" />}
        </div>
      )}

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
