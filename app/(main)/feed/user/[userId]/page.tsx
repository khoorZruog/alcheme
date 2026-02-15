"use client";

import { use } from "react";
import { UserCircle } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { PageHeader } from "@/components/page-header";
import { FeedPostCard } from "@/components/feed-post-card";
import { FeedGridSkeleton } from "@/components/loading-skeleton";
import { useFollow } from "@/hooks/use-follow";
import { useAuth } from "@/components/auth/auth-provider";
import { fetcher } from "@/lib/api/fetcher";
import type { SocialPost } from "@/types/social";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { user } = useAuth();
  const { profile, isFollowing, followerCount, toggleFollow } =
    useFollow(userId);

  // Fetch user's public posts
  const { data: postsData, isLoading: postsLoading } = useSWR<{
    posts: SocialPost[];
  }>(
    userId
      ? `/api/social/posts?feed_type=all&limit=50&user_filter=${userId}`
      : null,
    fetcher
  );

  const isOwnProfile = user?.uid === userId;

  if (!profile) {
    return (
      <div>
        <PageHeader title="プロフィール" backHref="/feed" />
        <div className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-alcheme-sand/50 flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-7 h-7 text-alcheme-muted" />
          </div>
          <p className="text-sm text-alcheme-muted">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="プロフィール" backHref="/feed" />

      <div className="px-4 py-6 space-y-6">
        {/* Avatar + Name + Stats */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-2xl font-bold">
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (profile.display_name || "?").charAt(0)
            )}
          </div>
          <h2 className="text-lg font-display font-bold text-alcheme-charcoal">
            {profile.display_name || "ユーザー"}
          </h2>
          {profile.bio && (
            <p className="text-sm text-alcheme-muted max-w-[280px]">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex gap-8 py-2">
            <div className="text-center">
              <p className="text-lg font-bold text-alcheme-charcoal">
                {profile.stats.post_count}
              </p>
              <p className="text-xs text-alcheme-muted">投稿</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-alcheme-charcoal">
                {profile.stats.follower_count}
              </p>
              <p className="text-xs text-alcheme-muted">フォロワー</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-alcheme-charcoal">
                {profile.stats.following_count}
              </p>
              <p className="text-xs text-alcheme-muted">フォロー</p>
            </div>
          </div>

          {/* Follow button */}
          {!isOwnProfile && (
            <button
              onClick={toggleFollow}
              className={`w-full max-w-[200px] py-2 rounded-full text-sm font-medium transition-colors btn-squishy ${
                isFollowing
                  ? "bg-alcheme-sand text-alcheme-charcoal border border-alcheme-sand"
                  : "bg-gradient-to-r from-neon-accent to-magic-pink text-white"
              }`}
            >
              {isFollowing ? "フォロー中" : "フォローする"}
            </button>
          )}
        </div>

        {/* Profile tags */}
        <div className="flex flex-wrap justify-center gap-2">
          {profile.personal_color && (
            <span className="text-xs bg-alcheme-blush text-alcheme-rose px-3 py-1 rounded-full">
              {profile.personal_color}
            </span>
          )}
          {profile.skin_type && (
            <span className="text-xs bg-alcheme-sand text-alcheme-charcoal px-3 py-1 rounded-full">
              {profile.skin_type}
            </span>
          )}
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="text-xs bg-alcheme-sand/50 text-alcheme-muted px-3 py-1 rounded-full"
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Posts */}
        <div>
          <h3 className="text-sm font-medium text-alcheme-charcoal mb-3">
            投稿したレシピ
          </h3>
          {postsLoading && <FeedGridSkeleton />}
          {!postsLoading && (!postsData?.posts || postsData.posts.length === 0) && (
            <p className="text-center text-sm text-alcheme-muted py-8">
              まだ投稿がありません
            </p>
          )}
          <div className="space-y-4">
            {postsData?.posts
              ?.filter((p) => p.user_id === userId)
              .map((post) => (
                <FeedPostCard key={post.id} post={post} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
