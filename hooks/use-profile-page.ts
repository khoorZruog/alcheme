"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { fetcher } from "@/lib/api/fetcher";
import type { UserProfile } from "@/types/user";
import type { PublicUserProfile, SocialPost, BestCosmeItem } from "@/types/social";
import type { InventoryItem } from "@/types/inventory";
import type { Recipe } from "@/types/recipe";
import type { BeautyLogEntry } from "@/types/beauty-log";

interface CategoryCount {
  category: string;
  count: number;
}

interface GridItem {
  id: string;
  imageUrl?: string;
  href: string;
  label?: string;
}

interface ProfilePageData {
  // Profile info
  displayName: string;
  photoUrl: string | null;
  bio: string | null;
  gender: string | null;
  ageRange: string | null;
  skinType: string | null;
  skinTone: string | null;
  personalColor: string | null;
  faceType: string | null;
  socialLinks?: UserProfile["socialLinks"];
  // Stats
  stats: {
    following_count: number;
    follower_count: number;
    total_likes: number;
  };
  // Follow
  isFollowing: boolean;
  // Best cosme
  bestCosme: BestCosmeItem[];
  // Category counts
  categories: CategoryCount[];
  // Content grids
  postsGrid: GridItem[];
  recipesGrid: GridItem[];
  beautyLogsGrid: GridItem[];
  // Loading
  isLoading: boolean;
  // Completion rate (own profile only)
  completionRate?: number;
}

export function useProfilePage(
  userId: string | null,
  isOwnProfile: boolean
): ProfilePageData {
  // Own profile: fetch full private data
  const { data: meData, isLoading: meLoading } = useSWR<{ profile: UserProfile }>(
    isOwnProfile ? "/api/users/me" : null,
    fetcher
  );

  // Social profile (both own + other): fetch public data + stats
  const { data: socialData, isLoading: socialLoading } = useSWR<{
    profile: PublicUserProfile;
  }>(userId ? `/api/social/users/${userId}` : null, fetcher);

  // Posts
  const { data: postsData } = useSWR<{ posts: SocialPost[] }>(
    userId
      ? `/api/social/posts?feed_type=all&limit=50&user_filter=${userId}`
      : null,
    fetcher
  );

  // Recipes (own only)
  const { data: recipesData } = useSWR<{ recipes: Recipe[] }>(
    isOwnProfile ? "/api/recipes" : null,
    fetcher
  );

  // Beauty logs (own only)
  const { data: logsData } = useSWR<{ logs: BeautyLogEntry[] }>(
    isOwnProfile ? "/api/beauty-log?mode=timeline&limit=50" : null,
    fetcher
  );

  // Inventory for category counts (own only)
  const { data: inventoryData } = useSWR<{ items: InventoryItem[] }>(
    isOwnProfile ? "/api/inventory" : null,
    fetcher
  );

  const profile = isOwnProfile ? meData?.profile : null;
  const social = socialData?.profile;

  // Category counts
  const categories = useMemo<CategoryCount[]>(() => {
    if (isOwnProfile && inventoryData?.items) {
      const counts: Record<string, number> = {};
      for (const item of inventoryData.items) {
        const cat = item.category || "その他";
        counts[cat] = (counts[cat] || 0) + 1;
      }
      return Object.entries(counts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);
    }
    // For other users, derive from posts
    if (postsData?.posts) {
      const counts: Record<string, number> = {};
      for (const post of postsData.posts) {
        for (const tag of post.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
      return Object.entries(counts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
    return [];
  }, [isOwnProfile, inventoryData, postsData]);

  // Posts grid
  const postsGrid = useMemo<GridItem[]>(() => {
    if (!postsData?.posts) return [];
    return postsData.posts
      .filter((p) => p.user_id === userId)
      .map((post) => ({
        id: post.id,
        imageUrl: post.preview_image_url,
        href: `/feed/${post.id}`,
        label: post.recipe_name,
      }));
  }, [postsData, userId]);

  // Recipes grid
  const recipesGrid = useMemo<GridItem[]>(() => {
    if (!recipesData?.recipes) return [];
    return recipesData.recipes.map((recipe) => ({
      id: recipe.id,
      imageUrl: recipe.preview_image_url,
      href: `/recipes/${recipe.id}`,
      label: recipe.recipe_name,
    }));
  }, [recipesData]);

  // Beauty logs grid
  const beautyLogsGrid = useMemo<GridItem[]>(() => {
    if (!logsData?.logs) return [];
    return logsData.logs
      .filter((log) => log.photos?.length > 0 || log.preview_image_url)
      .map((log) => ({
        id: log.id,
        imageUrl: log.photos?.[0] || log.preview_image_url,
        href: `/beauty-log/${log.id}`,
        label: log.recipe_name || log.date,
      }));
  }, [logsData]);

  // Best cosme
  const bestCosme = useMemo<BestCosmeItem[]>(() => {
    return social?.best_cosme || [];
  }, [social]);

  return {
    displayName: (isOwnProfile
      ? profile?.displayName
      : social?.display_name) || "ユーザー",
    photoUrl: (isOwnProfile
      ? profile?.photoURL
      : social?.photo_url) || null,
    bio: (isOwnProfile ? profile?.bio : social?.bio) || null,
    gender: isOwnProfile ? (profile?.gender || null) : (social?.gender || null),
    ageRange: social?.age_range || null,
    skinType: (isOwnProfile ? profile?.skinType : social?.skin_type) || null,
    skinTone: (isOwnProfile ? profile?.skinTone : social?.skin_tone) || null,
    personalColor: (isOwnProfile
      ? profile?.personalColor
      : social?.personal_color) || null,
    faceType: (isOwnProfile ? profile?.faceType : social?.face_type) || null,
    socialLinks: isOwnProfile ? profile?.socialLinks : social?.social_links,
    stats: {
      following_count: social?.stats?.following_count ?? 0,
      follower_count: social?.stats?.follower_count ?? 0,
      total_likes: social?.stats?.total_likes_received ?? 0,
    },
    isFollowing: social?.is_following ?? false,
    bestCosme,
    categories,
    postsGrid,
    recipesGrid,
    beautyLogsGrid,
    isLoading: isOwnProfile ? meLoading || socialLoading : socialLoading,
  };
}
