// Server-side only — Firestore Timestamp 変換ヘルパー
// このファイルは API Routes / Server Components からのみ import してください

import { Timestamp } from 'firebase-admin/firestore';

/** Firestore Timestamp or ISO string → ISO 8601 string */
export function timestampToString(timestamp: Timestamp | string | undefined): string {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().toISOString();
  return new Date().toISOString();
}

/** ISO 8601 string → Firestore Timestamp */
export function stringToTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}
