"use client";

import { User, Palette, Heart, Sparkles, Link2, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { ProfileRow } from "./_components/profile-row";
import { DataStatsSection } from "./_components/data-stats-section";
import { AvatarUpload } from "./_components/avatar-upload";
import { useSettingsForm } from "./use-settings-form";
import { useAuth } from "@/components/auth/auth-provider";
import { calcAgeRange, calcCompletionRate } from "./utils";
import { GENDERS, PERSONAL_COLORS, SKIN_TONES, AGENT_THEMES } from "./constants";
import Link from "next/link";

function genderLabel(value: string) {
  return GENDERS.find((g) => g.value === value)?.label;
}
function pcLabel(value: string) {
  return PERSONAL_COLORS.find((c) => c.value === value)?.label;
}
function skinToneLabel(value: string) {
  return SKIN_TONES.find((t) => t.value === value)?.label;
}
function themeLabel(value: string) {
  return AGENT_THEMES.find((t) => t.value === value)?.label;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { form, update, handleLogout, inventoryCount, recipeCount } = useSettingsForm();

  const ageRange = form.birthDate ? calcAgeRange(form.birthDate) : null;
  const completionRate = calcCompletionRate(form);

  const basicParts = [genderLabel(form.gender), ageRange].filter(Boolean);
  const beautyParts = [
    form.skinType,
    skinToneLabel(form.skinTone),
    pcLabel(form.personalColor),
    form.faceType,
  ].filter(Boolean);
  const interestCount = form.interests.length + form.concerns.length;
  const snsParts = [
    form.twitter && "Twitter",
    form.instagram && "Instagram",
    form.youtube && "YouTube",
    form.tiktok && "TikTok",
    form.website && "Web",
  ].filter(Boolean);

  return (
    <div>
      <PageHeader title="設定" />

      <div className="px-4 py-4 space-y-2">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-5 text-center space-y-3">
          <AvatarUpload
            photoURL={form.photoURL}
            userId={user?.uid ?? ""}
            onUploaded={(url) => update("photoURL", url)}
          />
          <div className="inline-block bg-linear-to-r from-magic-pink to-magic-purple text-white text-xs font-medium px-3 py-1 rounded-full">
            完了度：{completionRate}%
          </div>
          <p className="text-base font-medium text-text-ink">
            {form.displayName || "未設定"}
          </p>
          {basicParts.length > 0 && (
            <p className="text-xs text-text-muted">{basicParts.join(" · ")}</p>
          )}
          <Link
            href="/settings/profile"
            className="inline-block text-xs text-neon-accent font-medium hover:underline"
          >
            プロフィールを見る
          </Link>
        </div>

        <Separator />

        <ProfileRow
          icon={<User className="h-4 w-4" />}
          label="基本情報"
          href="/settings/edit/basic"
          summary={basicParts.join(" · ") || undefined}
        />
        <Separator />
        <ProfileRow
          icon={<Palette className="h-4 w-4" />}
          label="ビューティプロフィール"
          href="/settings/edit/beauty"
          summary={beautyParts.join(" · ") || undefined}
        />
        <Separator />
        <ProfileRow
          icon={<Heart className="h-4 w-4" />}
          label="興味関心・悩み"
          href="/settings/edit/interests"
          summary={interestCount > 0 ? `${interestCount}個選択中` : undefined}
        />
        <Separator />
        <ProfileRow
          icon={<Sparkles className="h-4 w-4" />}
          label="エージェントテーマ"
          href="/settings/edit/agent"
          summary={themeLabel(form.agentTheme) || undefined}
        />
        <Separator />
        <ProfileRow
          icon={<Link2 className="h-4 w-4" />}
          label="SNSリンク"
          href="/settings/edit/sns"
          summary={snsParts.length > 0 ? (snsParts as string[]).join(", ") : undefined}
        />
        <Separator />

        <DataStatsSection inventoryCount={inventoryCount} recipeCount={recipeCount} />
        <Separator />

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 py-3 text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </button>

        <div className="pb-8" />
      </div>
    </div>
  );
}
