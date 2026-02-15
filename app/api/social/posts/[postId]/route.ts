import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

function postRef(postId: string) {
  return adminDb.collection('social').doc('posts').collection('items').doc(postId);
}

/** GET /api/social/posts/[postId] — Single post detail */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const doc = await postRef(postId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const data = doc.data()!;

    // Check if current user liked this post
    let isLiked = false;
    try {
      const likeDoc = await adminDb
        .collection('social')
        .doc('likes')
        .collection(postId)
        .doc('users')
        .collection('items')
        .doc(userId)
        .get();
      isLiked = likeDoc.exists;
    } catch {
      // ignore
    }

    return NextResponse.json({
      post: {
        id: doc.id,
        user_id: data.user_id,
        author_display_name: data.author_display_name || '',
        author_photo_url: data.author_photo_url || null,
        recipe_id: data.recipe_id,
        recipe_name: data.recipe_name,
        preview_image_url: data.preview_image_url || undefined,
        steps_summary: data.steps_summary || [],
        character_theme: data.character_theme || undefined,
        visibility: data.visibility,
        tags: data.tags || [],
        like_count: data.like_count || 0,
        comment_count: data.comment_count || 0,
        is_liked: isLiked,
        created_at: timestampToString(data.created_at),
        updated_at: timestampToString(data.updated_at),
      },
    });
  } catch (error) {
    console.error('GET /api/social/posts/[postId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** PATCH /api/social/posts/[postId] — Update post (tags, visibility) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const doc = await postRef(postId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (doc.data()!.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields: Record<string, unknown> = {};
    if (body.tags !== undefined) allowedFields.tags = body.tags;
    if (body.visibility !== undefined) {
      if (!['public', 'private'].includes(body.visibility)) {
        return NextResponse.json({ error: 'visibility must be "public" or "private"' }, { status: 400 });
      }
      allowedFields.visibility = body.visibility;
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await postRef(postId).update({
      ...allowedFields,
      updated_at: Timestamp.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/social/posts/[postId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** DELETE /api/social/posts/[postId] — Unpublish (delete post) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const doc = await postRef(postId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (doc.data()!.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.runTransaction(async (tx) => {
      tx.delete(postRef(postId));

      // Decrement user stats
      const statsRef = adminDb
        .collection('social')
        .doc('user_stats')
        .collection('items')
        .doc(userId);
      const statsDoc = await tx.get(statsRef);
      if (statsDoc.exists) {
        const current = statsDoc.data()?.post_count || 0;
        tx.update(statsRef, { post_count: Math.max(0, current - 1) });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/social/posts/[postId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
