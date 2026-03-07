/**
 * Normalize brand/product name for comparison:
 * 1. Trim whitespace
 * 2. Full-width alphanumeric → half-width (e.g. "ＫＡＴＥ" → "KATE")
 * 3. Lowercase
 *
 * Display uses the original value; this is for matching only.
 */
export function normalizeBrand(value: string): string {
  return value
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .toLowerCase();
}
