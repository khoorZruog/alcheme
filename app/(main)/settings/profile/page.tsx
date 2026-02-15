"use client";

import { User } from "lucide-react";
import Image from "next/image";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { PageHeader } from "@/components/page-header";
import { calcAgeRange } from "../utils";
import { GENDERS, PERSONAL_COLORS, SKIN_TONES } from "../constants";
import type { UserProfile } from "@/types/user";

function genderLabel(value: string | null) {
  if (!value) return null;
  return GENDERS.find((g) => g.value === value)?.label ?? null;
}
function pcLabel(value: string | null) {
  if (!value) return null;
  return PERSONAL_COLORS.find((c) => c.value === value)?.label ?? null;
}
function skinToneObj(value: string | null) {
  if (!value) return null;
  return SKIN_TONES.find((t) => t.value === value) ?? null;
}

export default function ProfileViewPage() {
  const { data } = useSWR<{ profile: UserProfile }>("/api/users/me", fetcher);
  const p = data?.profile;
  const vis = p?.profileVisibility ?? {};

  if (!p) {
    return (
      <div>
        <PageHeader title="プロフィール" backHref="/settings" />
        <div className="flex items-center justify-center h-40 text-text-muted text-sm">
          読み込み中...
        </div>
      </div>
    );
  }

  const birthDate = p.birthDate?.replace(/\//g, "-") ?? "";
  const ageRange = birthDate ? calcAgeRange(birthDate) : null;
  const tone = skinToneObj(p.skinTone);
  const gender = genderLabel(p.gender);
  const pc = pcLabel(p.personalColor);

  return (
    <div>
      <PageHeader title="プロフィール" backHref="/settings" />

      <div className="px-4 py-6 space-y-4">
        {/* Avatar + Name */}
        <div className="text-center space-y-2">
          {p.photoURL ? (
            <div className="mx-auto h-20 w-20 rounded-full overflow-hidden relative">
              <Image src={p.photoURL} alt="プロフィール" fill className="object-cover" />
            </div>
          ) : (
            <div className="mx-auto h-20 w-20 rounded-full bg-text-ink/10 flex items-center justify-center">
              <User className="h-10 w-10 text-text-ink/40" />
            </div>
          )}
          <p className="text-lg font-medium text-text-ink">
            {p.displayName || "未設定"}
          </p>
        </div>

        {/* LIPS-style row layout */}
        <div className="glass-card rounded-2xl divide-y divide-white/40">
          <ProfileRow label="ニックネーム" value={p.displayName} />

          {vis.gender !== false && (
            <ProfileRow
              label="性別"
              value={gender}
              visibility="公開"
            />
          )}

          {vis.ageRange !== false && (
            <ProfileRow
              label="生年月日"
              value={ageRange ? `${p.birthDate?.replace(/-/g, "/")} (${ageRange})` : p.birthDate?.replace(/-/g, "/")}
              visibility="公開"
            />
          )}

          {vis.skinType !== false && (
            <ProfileRow
              label="肌質"
              value={p.skinType}
              visibility="公開"
            />
          )}

          {vis.skinTone !== false && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-text-ink">スキントーン</span>
              <div className="flex items-center gap-2">
                {tone && (
                  <>
                    <div
                      className="h-5 w-5 rounded-full border border-white/60"
                      style={{ backgroundColor: tone.color }}
                    />
                    <span className="text-sm text-text-muted">{tone.label}</span>
                  </>
                )}
                {!tone && <span className="text-sm text-text-muted">未設定</span>}
                <span className="text-xs text-text-muted ml-1">公開</span>
              </div>
            </div>
          )}

          {vis.personalColor !== false && (
            <ProfileRow
              label="パーソナルカラー"
              value={pc}
              visibility="公開"
            />
          )}

          <ProfileRow label="顔タイプ" value={p.faceType} />

          {vis.interests !== false && (
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-ink">興味関心</span>
                <span className="text-xs text-text-muted">公開</span>
              </div>
              {p.interests && p.interests.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.interests.map((tag) => (
                    <span key={tag} className="text-xs bg-text-ink/10 text-text-ink px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-text-muted">未設定</span>
              )}
            </div>
          )}

          {vis.interests !== false && (
            <div className="px-4 py-3 space-y-2">
              <span className="text-sm font-medium text-text-ink">悩み</span>
              {p.concerns && p.concerns.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.concerns.map((tag) => (
                    <span key={tag} className="text-xs bg-text-ink/10 text-text-ink px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-text-muted">未設定</span>
              )}
            </div>
          )}
        </div>

        {/* SNS Links */}
        {p.socialLinks && Object.values(p.socialLinks).some(Boolean) && (
          <div className="glass-card rounded-2xl divide-y divide-white/40">
            {p.socialLinks.twitter && <ProfileRow label="Twitter" value={p.socialLinks.twitter} />}
            {p.socialLinks.instagram && <ProfileRow label="Instagram" value={p.socialLinks.instagram} />}
            {p.socialLinks.youtube && <ProfileRow label="YouTube" value={p.socialLinks.youtube} />}
            {p.socialLinks.tiktok && <ProfileRow label="TikTok" value={p.socialLinks.tiktok} />}
            {p.socialLinks.website && <ProfileRow label="Web" value={p.socialLinks.website} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  visibility,
}: {
  label: string;
  value: string | null | undefined;
  visibility?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium text-text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted truncate max-w-40">
          {value || "未設定"}
        </span>
        {visibility && (
          <span className="text-xs text-text-muted">{visibility}</span>
        )}
      </div>
    </div>
  );
}
