import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

const VALID_TYPES = ['comment', 'reaction'];
const VALID_REACTIONS = ['suteki', 'manetai', 'sanko'];

function commentsRef(postId: string) {
  return adminDb
    .collection('social')
    .doc('comments')
    .collection(postId)
    .doc('items')
    .collection('list');
}

/** GET /api/social/posts/[postId]/comments — List comments */
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

    const snapshot = await commentsRef(postId)
      .orderBy('created_at', 'asc')
      .get();

    const comments = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        user_id: data.user_id,
        author_display_name: data.author_display_name || '',
        author_photo_url: data.author_photo_url || undefined,
        text: data.text,
        type: data.type,
        reaction_key: data.reaction_key || undefined,
        created_at: timestampToString(data.created_at),
      };
    });

    return NextResponse.json({ comments, count: comments.length });
  } catch (error) {
    console.error('GET /api/social/posts/[postId]/comments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** POST /api/social/posts/[postId]/comments — Add comment or reaction */
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
    const body = await request.json();
    const { text, type, reaction_key } = body;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'type must be "comment" or "reaction"' },
        { status: 400 }
      );
    }

    if (type === 'reaction' && (!reaction_key || !VALID_REACTIONS.includes(reaction_key))) {
      return NextResponse.json(
        { error: 'reaction_key must be "suteki", "manetai", or "sanko"' },
        { status: 400 }
      );
    }

    if (type === 'comment' && (!text || typeof text !== 'string' || text.trim().length === 0)) {
      return NextResponse.json({ error: 'text is required for comments' }, { status: 400 });
    }

    // Verify post exists
    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc(postId);

    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Read user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data()! : {};

    const now = Timestamp.now();
    const commentData: Record<string, unknown> = {
      user_id: userId,
      author_display_name: userProfile.displayName || userProfile.display_name || '',
      author_photo_url: userProfile.photoURL || userProfile.photo_url || null,
      text: type === 'reaction' ? '' : text.trim(),
      type,
      created_at: now,
    };

    if (type === 'reaction') {
      commentData.reaction_key = reaction_key;
    }

    const commentRef = commentsRef(postId).doc();

    await adminDb.runTransaction(async (tx) => {
      tx.set(commentRef, commentData);
      tx.update(postRef, {
        comment_count: (postDoc.data()!.comment_count || 0) + 1,
      });
    });

    return NextResponse.json(
      {
        success: true,
        comment: {
          id: commentRef.id,
          ...commentData,
          created_at: now.toDate().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/social/posts/[postId]/comments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
