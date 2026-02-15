import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';

/** DELETE /api/social/posts/[postId]/comments/[commentId] — Delete own comment */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, commentId } = await params;

    const commentRef = adminDb
      .collection('social')
      .doc('comments')
      .collection(postId)
      .doc('items')
      .collection('list')
      .doc(commentId);

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (commentDoc.data()!.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc(postId);

    await adminDb.runTransaction(async (tx) => {
      const postDoc = await tx.get(postRef);
      tx.delete(commentRef);
      if (postDoc.exists) {
        const current = postDoc.data()!.comment_count || 0;
        tx.update(postRef, { comment_count: Math.max(0, current - 1) });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/social/posts/[postId]/comments/[commentId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
