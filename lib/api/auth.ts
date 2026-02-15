// API Route 用認証ヘルパー（サーバー専用）
// session cookie から uid を取得する

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

/**
 * セッションCookie を検証し uid を返す。
 * 未認証の場合は null を返す。
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;

    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}
