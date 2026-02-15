"use client";

import { use, useState, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfilePage } from "@/hooks/use-profile-page";
import { useFollow } from "@/hooks/use-follow";
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

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const isOwnProfile = user?.uid === userId;

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (isOwnProfile) {
      router.replace("/profile");
    }
  }, [isOwnProfile, router]);

  const { toggleFollow, isFollowing } = useFollow(userId);

  const {
    displayName,
    photoUrl,
    bio,
    gender,
    ageRange,
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
    isLoading,
  } = useProfilePage(userId, false);

  const [activeTab, setActiveTab] = useState<ProfileContentTab>("posts");

  const currentGrid = activeTab === "posts" ? postsGrid : recipesGrid;

  const emptyMessages: Record<string, string> = {
    posts: "まだ投稿がありません",
    recipes: "まだレシピがありません",
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="プロフィール" backHref="/feed" />
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
        backHref="/feed"
        rightElement={
          <button className="text-text-ink hover:text-text-muted transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
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

        <ProfileSocialLinks socialLinks={socialLinks} />

        <ProfileActions
          isOwnProfile={false}
          isFollowing={isFollowing}
          onToggleFollow={toggleFollow}
        />

        <BestCosmeSection items={bestCosme} />

        <ProfileContentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          availableTabs={["posts", "recipes"]}
        />

        <ProfileCategoryBadges categories={categories} />

        <ProfileContentGrid
          items={currentGrid}
          emptyMessage={emptyMessages[activeTab]}
        />
      </div>
    </div>
  );
}
