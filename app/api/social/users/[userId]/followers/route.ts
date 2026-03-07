// GET /api/social/users/[userId]/followers — フォロワー一覧

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
    // Get follower user IDs
    const followersSnap = await adminDb
      .collection('social')
      .doc('follows')
      .collection(userId)
      .doc('followers')
      .collection('users')
      .limit(100)
      .get();

    if (followersSnap.empty) {
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

    // Build user info for each follower
    const users: FollowInfo[] = [];
    for (const doc of followersSnap.docs) {
      const followerUserId = doc.id;
      const userDoc = await adminDb.collection('users').doc(followerUserId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      users.push({
        user_id: followerUserId,
        display_name: userData?.displayName ?? 'ユーザー',
        photo_url: userData?.photoURL ?? null,
        is_following: myFollowingSet.has(followerUserId),
      });
    }

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error('GET /api/social/users/[userId]/followers error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
