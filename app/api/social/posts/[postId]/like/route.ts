import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';

/** POST /api/social/posts/[postId]/like — Toggle like */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc(postId);

    const likeRef = adminDb
      .collection('social')
      .doc('likes')
      .collection(postId)
      .doc('users')
      .collection('items')
      .doc(userId);

    const result = await adminDb.runTransaction(async (tx) => {
      const postDoc = await tx.get(postRef);
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const likeDoc = await tx.get(likeRef);
      const currentCount = postDoc.data()!.like_count || 0;

      if (likeDoc.exists) {
        // Unlike
        tx.delete(likeRef);
        tx.update(postRef, { like_count: Math.max(0, currentCount - 1) });
        return { liked: false, like_count: Math.max(0, currentCount - 1) };
      } else {
        // Like
        tx.set(likeRef, { created_at: Timestamp.now() });
        tx.update(postRef, { like_count: currentCount + 1 });
        return { liked: true, like_count: currentCount + 1 };
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Post not found') {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    console.error('POST /api/social/posts/[postId]/like error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
