"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/api/fetcher";
import { useInventory } from "@/hooks/use-inventory";
import { useRecipes } from "@/hooks/use-recipes";
import { SKIN_TONE_MIGRATION } from "./constants";
import type { UserProfile } from "@/types/user";

export interface SettingsFormState {
  displayName: string;
  photoURL: string;
  gender: string;
  birthDate: string;
  skinType: string;
  skinTone: string;
  personalColor: string;
  faceType: string;
  interests: string[];
  concerns: string[];
  agentTheme: UserProfile["agentTheme"];
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
  visGender: boolean;
  visAgeRange: boolean;
  visSkinType: boolean;
  visSkinTone: boolean;
  visPersonalColor: boolean;
  visInterests: boolean;
}

const INITIAL: SettingsFormState = {
  displayName: "",
  photoURL: "",
  gender: "",
  birthDate: "",
  skinType: "",
  skinTone: "",
  personalColor: "",
  faceType: "",
  interests: [],
  concerns: [],
  agentTheme: "bestfriend",
  twitter: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  website: "",
  visGender: true,
  visAgeRange: true,
  visSkinType: true,
  visSkinTone: true,
  visPersonalColor: true,
  visInterests: true,
};

/** Convert legacy "yyyy/mm/dd" to native date input "yyyy-mm-dd" */
function migrateBirthDate(value: string | null): string {
  if (!value) return "";
  return value.replace(/\//g, "-");
}

function migrateSkinTone(value: string | null): string {
  if (!value) return "";
  if (value.startsWith("tone-")) return value;
  return SKIN_TONE_MIGRATION[value] ?? "";
}

export function useSettingsForm() {
  const router = useRouter();
  const { data, mutate } = useSWR<{ profile: UserProfile }>("/api/users/me", fetcher);
  const { count: inventoryCount } = useInventory();
  const { count: recipeCount } = useRecipes();

  const [form, setForm] = useState<SettingsFormState>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      const vis = p.profileVisibility ?? {};
      setForm({
        displayName: p.displayName ?? "",
        photoURL: p.photoURL ?? "",
        gender: p.gender ?? "",
        birthDate: migrateBirthDate(p.birthDate),
        skinType: p.skinType ?? "",
        skinTone: migrateSkinTone(p.skinTone),
        personalColor: p.personalColor ?? "",
        faceType: p.faceType ?? "",
        interests: p.interests ?? [],
        concerns: p.concerns ?? [],
        agentTheme: p.agentTheme ?? "bestfriend",
        twitter: p.socialLinks?.twitter ?? p.socialLinks?.x ?? "",
        instagram: p.socialLinks?.instagram ?? "",
        youtube: p.socialLinks?.youtube ?? "",
        tiktok: p.socialLinks?.tiktok ?? "",
        website: p.socialLinks?.website ?? "",
        visGender: vis.gender ?? true,
        visAgeRange: vis.ageRange ?? true,
        visSkinType: vis.skinType ?? true,
        visSkinTone: vis.skinTone ?? true,
        visPersonalColor: vis.personalColor ?? true,
        visInterests: vis.interests ?? true,
      });
    }
  }, [data]);

  const update = useCallback((key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName || null,
          gender: form.gender || null,
          birthDate: form.birthDate || null,
          skinType: form.skinType || null,
          skinTone: form.skinTone || null,
          personalColor: form.personalColor || null,
          faceType: form.faceType || null,
          interests: form.interests,
          concerns: form.concerns,
          agentTheme: form.agentTheme,
          socialLinks: {
            twitter: form.twitter || undefined,
            instagram: form.instagram || undefined,
            youtube: form.youtube || undefined,
            tiktok: form.tiktok || undefined,
            website: form.website || undefined,
          },
          profileVisibility: {
            gender: form.visGender,
            ageRange: form.visAgeRange,
            skinType: form.visSkinType,
            skinTone: form.visSkinTone,
            personalColor: form.visPersonalColor,
            interests: form.visInterests,
          },
        }),
      });
      mutate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [form, mutate]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
  }, [router]);

  return {
    form,
    update,
    saving,
    saved,
    handleSave,
    handleLogout,
    inventoryCount,
    recipeCount,
  };
}
