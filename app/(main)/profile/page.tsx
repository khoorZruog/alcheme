"use client";

import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfilePage } from "@/hooks/use-profile-page";
import { calcCompletionRate } from "@/app/(main)/settings/utils";
import { calcAgeRange } from "@/lib/calc-age-range";
import { PageHeader } from "@/components/page-header";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileTags } from "@/components/profile/profile-tags";
import { ProfileBio } from "@/components/profile/profile-bio";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { BestCosmeSection } from "@/components/profile/best-cosme-section";
import { ProfileContentTabs, type ProfileContentTab } from "@/components/profile/profile-content-tabs";
import { ProfileCategoryBadges } from "@/components/profile/profile-category-badges";
import { ProfileContentGrid } from "@/components/profile/profile-content-grid";
import { BestCosmePickerSheet } from "@/components/profile/best-cosme-picker-sheet";
import type { UserProfile } from "@/types/user";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

export default function OwnProfilePage() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const {
    displayName,
    photoUrl,
    bio,
    gender,
    skinType,
    skinTone,
    personalColor,
    faceType,
    socialLinks,
    stats,
    bestCosme,
    categories,
    postsGrid,
    recipesGrid,
    beautyLogsGrid,
    isLoading,
  } = useProfilePage(userId, true);

  const { data: meData, mutate: mutateMe } = useSWR<{ profile: UserProfile }>(
    "/api/users/me",
    fetcher
  );
  const profile = meData?.profile;

  // Compute age range and completion rate from full profile
  const birthDate = profile?.birthDate?.replace(/\//g, "-") ?? "";
  const ageRange = birthDate ? calcAgeRange(birthDate) : null;
  const completionRate = profile
    ? calcCompletionRate({
        displayName: profile.displayName || "",
        photoURL: profile.photoURL || "",
        gender: profile.gender || "",
        birthDate: profile.birthDate || "",
        skinType: profile.skinType || "",
        skinTone: profile.skinTone || "",
        personalColor: profile.personalColor || "",
        faceType: profile.faceType || "",
        interests: profile.interests || [],
        concerns: profile.concerns || [],
        twitter: profile.socialLinks?.twitter || "",
        instagram: profile.socialLinks?.instagram || "",
        youtube: profile.socialLinks?.youtube || "",
        tiktok: profile.socialLinks?.tiktok || "",
        website: profile.socialLinks?.website || "",
      })
    : 0;

  const [activeTab, setActiveTab] = useState<ProfileContentTab>("posts");
  const [bestCosmeOpen, setBestCosmeOpen] = useState(false);

  const handleBestCosmeSave = useCallback(
    async (itemIds: string[]) => {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bestCosme: itemIds }),
      });
      mutateMe();
    },
    [mutateMe]
  );

  const currentGrid =
    activeTab === "posts"
      ? postsGrid
      : activeTab === "recipes"
        ? recipesGrid
        : beautyLogsGrid;

  const emptyMessages: Record<ProfileContentTab, string> = {
    posts: "まだ投稿がありません",
    recipes: "まだレシピがありません",
    beautyLogs: "まだメイク日記がありません",
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="プロフィール" />
        <div className="flex items-center justify-center h-40 text-text-muted text-sm">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader
        title={`@${displayName}`}
        rightElement={
          <Link href="/settings" className="text-text-ink hover:text-text-muted transition-colors">
            <Settings className="h-5 w-5" />
          </Link>
        }
      />

      <div className="space-y-4 pt-4">
        <ProfileHero
          photoUrl={photoUrl}
          displayName={displayName}
          stats={stats}
        />

        <ProfileTags
          gender={gender}
          ageRange={ageRange}
          skinType={skinType}
          personalColor={personalColor}
          skinTone={skinTone}
          faceType={faceType}
        />

        <ProfileBio bio={bio} />

        <ProfileActions
          isOwnProfile
          completionRate={completionRate}
        />

        <ProfileSocialLinks socialLinks={socialLinks} />

        <BestCosmeSection
          items={bestCosme}
          onEdit={() => setBestCosmeOpen(true)}
        />

        <ProfileContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <ProfileCategoryBadges categories={categories} />

        <ProfileContentGrid
          items={currentGrid}
          emptyMessage={emptyMessages[activeTab]}
        />
      </div>

      <BestCosmePickerSheet
        open={bestCosmeOpen}
        onOpenChange={setBestCosmeOpen}
        selectedIds={profile?.bestCosme || []}
        onSave={handleBestCosmeSave}
      />
    </div>
  );
}
