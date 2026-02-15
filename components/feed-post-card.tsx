"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import type { SocialPost } from "@/types/social";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

interface FeedPostCardProps {
  post: SocialPost;
  onLike?: () => void;
  onCommentClick?: () => void;
}

export function FeedPostCard({ post, onLike, onCommentClick }: FeedPostCardProps) {
  return (
    <div className="glass-card rounded-[20px] overflow-hidden">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Link
          href={`/feed/user/${post.user_id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-xs font-bold shrink-0">
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
            <p className="text-xs text-alcheme-muted">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
      </div>

      {/* Preview image */}
      {post.preview_image_url && (
        <Link href={`/feed/${post.id}`}>
          <div className="relative w-full aspect-[4/3] bg-alcheme-sand/30">
            <img
              src={post.preview_image_url}
              alt={post.recipe_name}
              className="w-full h-full object-cover"
            />
            {post.character_theme && (
              <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-alcheme-charcoal">
                {post.character_theme === "cute"
                  ? "キュート"
                  : post.character_theme === "cool"
                    ? "クール"
                    : "エレガント"}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="px-4 py-3 space-y-2">
        <Link href={`/feed/${post.id}`}>
          <h3 className="text-sm font-bold text-alcheme-charcoal line-clamp-2">
            {post.recipe_name}
          </h3>
        </Link>

        {/* Steps summary */}
        {post.steps_summary.length > 0 && (
          <div className="space-y-1">
            {post.steps_summary.map((step, i) => (
              <p key={i} className="text-xs text-alcheme-muted line-clamp-1">
                {i + 1}. {step}
              </p>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              onLike?.();
            }}
            className="flex items-center gap-1 btn-squishy"
          >
            <Heart
              size={18}
              className={
                post.is_liked
                  ? "fill-alcheme-rose text-alcheme-rose"
                  : "text-alcheme-muted"
              }
            />
            <span className="text-xs text-alcheme-muted">
              {post.like_count > 0 ? post.like_count : ""}
            </span>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              onCommentClick?.();
            }}
            className="flex items-center gap-1 btn-squishy"
          >
            <MessageCircle size={18} className="text-alcheme-muted" />
            <span className="text-xs text-alcheme-muted">
              {post.comment_count > 0 ? post.comment_count : ""}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
