"use client";

import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfilePage } from "@/hooks/use-profile-page";
import { calcCompletionRate } from "@/app/(main)/settings/utils";
import { calcAgeRange } from "@/lib/calc-age-range";
import { MainTabHeader } from "@/components/main-tab-header";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileTags } from "@/components/profile/profile-tags";
import { ProfileBio } from "@/components/profile/profile-bio";
import { ProfileActions } from "@/components/profile/profile-actions";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { BestCosmeSection } from "@/components/profile/best-cosme-section";
import { BeautyLogPreview } from "@/components/beauty-log-preview";
import { ProfileContentTabs, type ProfileContentTab } from "@/components/profile/profile-content-tabs";
import { ProfileCategoryBadges } from "@/components/profile/profile-category-badges";
import { ProfileContentGrid } from "@/components/profile/profile-content-grid";
import { BestCosmePickerSheet } from "@/components/profile/best-cosme-picker-sheet";
import type { UserProfile } from "@/types/user";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";

export default function MyPage() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const {
    displayName, photoUrl, bio, gender, skinType, skinTone,
    personalColor, faceType, socialLinks, stats, bestCosme,
    categories, postsGrid, recipesGrid, beautyLogsGrid, isLoading,
  } = useProfilePage(userId, true);

  const { data: meData, mutate: mutateMe } = useSWR<{ profile: UserProfile }>(
    "/api/users/me",
    fetcher
  );
  const profile = meData?.profile;

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

  const emptyMessages: Record<ProfileContentTab, string> = {
    posts: "まだ投稿がありません",
    recipes: "まだレシピがありません",
    beautyLogs: "まだメイク日記がありません",
  };

  if (isLoading) {
    return (
      <div>
        <MainTabHeader
          title="マイページ"
          rightElement={
            <Link href="/settings" className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy">
              <Settings className="h-4 w-4" />
            </Link>
          }
        />
        <div className="flex items-center justify-center h-40 text-text-muted text-sm">
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <MainTabHeader
        title="マイページ"
        rightElement={
          <Link href="/settings" className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center hover:bg-white transition text-text-ink btn-squishy">
            <Settings className="h-4 w-4" />
          </Link>
        }
      />

      <div className="space-y-4 pt-4">
        <ProfileHero
          photoUrl={photoUrl}
          displayName={displayName}
          stats={stats}
          userId={userId ?? undefined}
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

        <ProfileSocialLinks socialLinks={socialLinks} />

        <ProfileActions isOwnProfile completionRate={completionRate} />

        <BestCosmeSection items={bestCosme} onEdit={() => setBestCosmeOpen(true)} />

        <div className="sticky top-14 z-40 bg-alcheme-cream/90 backdrop-blur-sm">
          <ProfileContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {activeTab === "posts" && (
          <>
            <ProfileCategoryBadges categories={categories} />
            <ProfileContentGrid items={postsGrid} emptyMessage={emptyMessages.posts} />
          </>
        )}
        {activeTab === "recipes" && (
          <ProfileContentGrid items={recipesGrid} emptyMessage={emptyMessages.recipes} />
        )}
        {activeTab === "beautyLogs" && (
          <>
            <BeautyLogPreview />
            <ProfileContentGrid items={beautyLogsGrid} emptyMessage={emptyMessages.beautyLogs} />
          </>
        )}
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
