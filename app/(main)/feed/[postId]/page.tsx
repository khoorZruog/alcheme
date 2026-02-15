"use client";

import { use, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { RecipeStepCard } from "@/components/recipe-step-card";
import { CommentsSheet } from "@/components/comments-sheet";
import { DetailSkeleton } from "@/components/loading-skeleton";
import { usePost } from "@/hooks/use-post";
import { useFollow } from "@/hooks/use-follow";
import { useAuth } from "@/components/auth/auth-provider";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = use(params);
  const { user } = useAuth();
  const {
    post,
    comments,
    commentCount,
    isLoading,
    error,
    toggleLike,
    addComment,
    deleteComment,
  } = usePost(postId);

  const { isFollowing, followerCount, toggleFollow } = useFollow(
    post?.user_id || ""
  );
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isOwnPost = user?.uid === post?.user_id;

  if (isLoading) {
    return (
      <div>
        <PageHeader title="投稿" backHref="/feed" />
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div>
        <PageHeader title="投稿" backHref="/feed" />
        <div className="p-8 text-center">
          <p className="text-sm text-alcheme-muted">投稿が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="投稿" backHref="/feed" />

      <div className="px-4 py-4 space-y-6">
        {/* Author section */}
        <div className="flex items-center gap-3">
          <Link
            href={`/feed/user/${post.user_id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-sm font-bold shrink-0">
              {post.author_photo_url ? (
                <img
                  src={post.author_photo_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (post.author_display_name || "?").charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-alcheme-charcoal truncate">
                {post.author_display_name || "ユーザー"}
              </p>
              <p className="text-xs text-alcheme-muted">
                {new Date(post.created_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          </Link>
          {!isOwnPost && (
            <button
              onClick={toggleFollow}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors btn-squishy ${
                isFollowing
                  ? "bg-alcheme-sand text-alcheme-charcoal"
                  : "bg-gradient-to-r from-neon-accent to-magic-pink text-white"
              }`}
            >
              {isFollowing ? "フォロー中" : "フォロー"}
            </button>
          )}
        </div>

        {/* Preview image */}
        {post.preview_image_url && (
          <div className="rounded-card overflow-hidden border border-alcheme-sand">
            <img
              src={post.preview_image_url}
              alt={post.recipe_name}
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h2 className="text-lg font-display font-bold text-alcheme-charcoal">
          {post.recipe_name}
        </h2>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-alcheme-blush text-alcheme-rose px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Steps summary */}
        {post.steps_summary.length > 0 && (
          <div>
            <p className="text-sm font-medium text-alcheme-charcoal mb-3">
              ステップ概要
            </p>
            <div className="space-y-2">
              {post.steps_summary.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-start p-3 rounded-card bg-alcheme-sand/30"
                >
                  <div className="w-6 h-6 rounded-full bg-alcheme-rose/10 flex items-center justify-center text-xs font-bold text-alcheme-rose shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-alcheme-charcoal">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-6 py-3 border-t border-b border-alcheme-sand">
          <button
            onClick={toggleLike}
            className="flex items-center gap-2 btn-squishy"
          >
            <Heart
              size={22}
              className={
                post.is_liked
                  ? "fill-alcheme-rose text-alcheme-rose"
                  : "text-alcheme-muted"
              }
            />
            <span className="text-sm text-alcheme-charcoal">
              {post.like_count}
            </span>
          </button>

          <button
            onClick={() => setCommentsOpen(true)}
            className="flex items-center gap-2 btn-squishy"
          >
            <MessageCircle size={22} className="text-alcheme-muted" />
            <span className="text-sm text-alcheme-charcoal">
              {post.comment_count}
            </span>
          </button>
        </div>
      </div>

      {/* Comments sheet */}
      <CommentsSheet
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        comments={comments}
        commentCount={commentCount}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        currentUserId={user?.uid}
      />
    </div>
  );
}
