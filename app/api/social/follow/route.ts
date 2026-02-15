import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';

/** POST /api/social/follow — Toggle follow */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target_user_id } = body;

    if (!target_user_id || typeof target_user_id !== 'string') {
      return NextResponse.json({ error: 'target_user_id is required' }, { status: 400 });
    }

    if (target_user_id === userId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // References for dual-write
    const followingRef = adminDb
      .collection('social')
      .doc('follows')
      .collection(userId)
      .doc('following')
      .collection('users')
      .doc(target_user_id);

    const followerRef = adminDb
      .collection('social')
      .doc('follows')
      .collection(target_user_id)
      .doc('followers')
      .collection('users')
      .doc(userId);

    const myStatsRef = adminDb
      .collection('social')
      .doc('user_stats')
      .collection('items')
      .doc(userId);

    const targetStatsRef = adminDb
      .collection('social')
      .doc('user_stats')
      .collection('items')
      .doc(target_user_id);

    const result = await adminDb.runTransaction(async (tx) => {
      const followingDoc = await tx.get(followingRef);
      const myStatsDoc = await tx.get(myStatsRef);
      const targetStatsDoc = await tx.get(targetStatsRef);

      const myStats = myStatsDoc.exists
        ? myStatsDoc.data()!
        : { post_count: 0, follower_count: 0, following_count: 0 };
      const targetStats = targetStatsDoc.exists
        ? targetStatsDoc.data()!
        : { post_count: 0, follower_count: 0, following_count: 0 };

      if (followingDoc.exists) {
        // Unfollow
        tx.delete(followingRef);
        tx.delete(followerRef);

        const newMyFollowing = Math.max(0, (myStats.following_count || 0) - 1);
        const newTargetFollowers = Math.max(0, (targetStats.follower_count || 0) - 1);

        if (myStatsDoc.exists) {
          tx.update(myStatsRef, { following_count: newMyFollowing });
        }
        if (targetStatsDoc.exists) {
          tx.update(targetStatsRef, { follower_count: newTargetFollowers });
        }

        return { following: false, follower_count: newTargetFollowers };
      } else {
        // Follow
        const now = Timestamp.now();
        tx.set(followingRef, { created_at: now });
        tx.set(followerRef, { created_at: now });

        const newMyFollowing = (myStats.following_count || 0) + 1;
        const newTargetFollowers = (targetStats.follower_count || 0) + 1;

        if (myStatsDoc.exists) {
          tx.update(myStatsRef, { following_count: newMyFollowing });
        } else {
          tx.set(myStatsRef, { ...myStats, following_count: newMyFollowing });
        }

        if (targetStatsDoc.exists) {
          tx.update(targetStatsRef, { follower_count: newTargetFollowers });
        } else {
          tx.set(targetStatsRef, { ...targetStats, follower_count: newTargetFollowers });
        }

        return { following: true, follower_count: newTargetFollowers };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/social/follow error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
