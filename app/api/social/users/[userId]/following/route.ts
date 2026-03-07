// GET /api/social/users/[userId]/following — フォロー中一覧

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { FollowInfo } from '@/types/social';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const currentUserId = await getAuthUserId();
  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId } = await params;

  try {
    // Get following user IDs
    const followingSnap = await adminDb
      .collection('social')
      .doc('follows')
      .collection(userId)
      .doc('following')
      .collection('users')
      .limit(100)
      .get();

    if (followingSnap.empty) {
      return NextResponse.json({ users: [], count: 0 });
    }

    // Get current user's following list to compute is_following
    const myFollowingSnap = await adminDb
      .collection('social')
      .doc('follows')
      .collection(currentUserId)
      .doc('following')
      .collection('users')
      .get();
    const myFollowingSet = new Set(myFollowingSnap.docs.map((d) => d.id));

    // Build user info for each followed user
    const users: FollowInfo[] = [];
    for (const doc of followingSnap.docs) {
      const followedUserId = doc.id;
      const userDoc = await adminDb.collection('users').doc(followedUserId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      users.push({
        user_id: followedUserId,
        display_name: userData?.displayName ?? 'ユーザー',
        photo_url: userData?.photoURL ?? null,
        is_following: myFollowingSet.has(followedUserId),
      });
    }

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error('GET /api/social/users/[userId]/following error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
