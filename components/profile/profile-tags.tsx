"use client";

import { GENDERS, PERSONAL_COLORS, SKIN_TONES } from "@/app/(main)/settings/constants";

interface ProfileTagsProps {
  gender?: string | null;
  ageRange?: string | null;
  skinType?: string | null;
  personalColor?: string | null;
  skinTone?: string | null;
  faceType?: string | null;
}

function genderLabel(value: string | null | undefined) {
  if (!value) return null;
  return GENDERS.find((g) => g.value === value)?.label ?? value;
}

function pcLabel(value: string | null | undefined) {
  if (!value) return null;
  return PERSONAL_COLORS.find((c) => c.value === value)?.label ?? value;
}

function skinToneLabel(value: string | null | undefined) {
  if (!value) return null;
  return SKIN_TONES.find((t) => t.value === value)?.label ?? value;
}

export function ProfileTags({
  gender,
  ageRange,
  skinType,
  personalColor,
  skinTone,
  faceType,
}: ProfileTagsProps) {
  const parts = [
    genderLabel(gender),
    skinType,
    ageRange,
    pcLabel(personalColor),
    skinToneLabel(skinTone),
    faceType,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <p className="px-4 text-sm text-text-muted leading-relaxed">
      {parts.join(" | ")}
    </p>
  );
}
