// Server-side only — Firestore Timestamp 変換ヘルパー
// このファイルは API Routes / Server Components からのみ import してください

import { Timestamp } from 'firebase-admin/firestore';

/** Firestore Timestamp → ISO 8601 string */
export function timestampToString(timestamp: Timestamp | undefined): string {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
}

/** ISO 8601 string → Firestore Timestamp */
export function stringToTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}
