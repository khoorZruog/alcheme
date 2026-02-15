/**
 * Parse birth date string and return age range like "20代後半".
 * Supports both "yyyy/mm/dd" and "yyyy-mm-dd" formats.
 */
export function calcAgeRange(birthDate: string): string | null {
  const sep = birthDate.includes("-") ? "-" : "/";
  const parts = birthDate.split(sep);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age--;

  if (age < 0 || age > 120) return null;
  if (age < 10) return "10歳未満";

  const decade = Math.floor(age / 10) * 10;
  const half = age % 10 < 5 ? "前半" : "後半";
  return `${decade}代${half}`;
}
