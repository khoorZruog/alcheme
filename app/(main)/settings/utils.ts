// Re-export from shared utility
export { calcAgeRange } from "@/lib/calc-age-range";

/**
 * Calculate profile completion rate (0–100).
 */
export function calcCompletionRate(form: {
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
  twitter: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  website: string;
}): number {
  const checks = [
    form.displayName !== "",
    form.photoURL !== "",
    form.gender !== "",
    form.birthDate !== "",
    form.skinType !== "",
    form.skinTone !== "",
    form.personalColor !== "",
    form.faceType !== "",
    form.interests.length > 0,
    form.concerns.length > 0,
    !!(form.twitter || form.instagram || form.youtube || form.tiktok || form.website),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
