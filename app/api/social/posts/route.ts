import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/** GET /api/social/posts — Feed listing with cursor-based pagination */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor');
    const limitParam = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const feedType = searchParams.get('feed_type') || 'all';

    // Note: all posts are created with visibility='public' (no private posts mechanism),
    // so we skip the visibility filter to avoid requiring a composite Firestore index.
    let query = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .orderBy('created_at', 'desc')
      .limit(limitParam + 1); // +1 to check if there's a next page

    // Following feed: filter by followed user IDs
    if (feedType === 'following') {
      const followingSnap = await adminDb
        .collection('social')
        .doc('follows')
        .collection(userId)
        .doc('following')
        .collection('users')
        .limit(30) // Firestore `in` query limit
        .get();

      const followedIds = followingSnap.docs.map((d) => d.id);
      if (followedIds.length === 0) {
        return NextResponse.json({ posts: [], next_cursor: null, count: 0 });
      }
      query = query.where('user_id', 'in', followedIds);
    }

    // Apply cursor
    if (cursor) {
      const cursorDate = new Date(cursor);
      const cursorTs = Timestamp.fromDate(cursorDate);
      query = query.startAfter(cursorTs);
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limitParam;
    const pageDocs = hasMore ? docs.slice(0, limitParam) : docs;

    // Check liked status for each post
    const posts = await Promise.all(
      pageDocs.map(async (doc) => {
        const data = doc.data();
        let isLiked = false;
        try {
          const likeDoc = await adminDb
            .collection('social')
            .doc('likes')
            .collection(doc.id)
            .doc('users')
            .collection('items')
            .doc(userId)
            .get();
          isLiked = likeDoc.exists;
        } catch {
          // ignore
        }
        return {
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
        };
      })
    );

    const nextCursor = hasMore
      ? posts[posts.length - 1]?.created_at || null
      : null;

    return NextResponse.json({
      posts,
      next_cursor: nextCursor,
      count: posts.length,
    });
  } catch (error) {
    console.error('GET /api/social/posts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** POST /api/social/posts — Publish a recipe as a social post */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipe_id, tags } = body;

    if (!recipe_id) {
      return NextResponse.json({ error: 'recipe_id is required' }, { status: 400 });
    }

    // Read the recipe
    const recipeDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipe_id)
      .get();

    if (!recipeDoc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeDoc.data()!;

    // Read user profile for author info
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data()! : {};

    // Build steps summary (first 3 steps)
    const steps = recipe.steps || [];
    const stepsSummary = steps
      .slice(0, 3)
      .map((s: { instruction?: string; item_name?: string }) =>
        s.instruction || s.item_name || ''
      )
      .filter(Boolean);

    const now = Timestamp.now();
    const postData = {
      user_id: userId,
      author_display_name: userProfile.displayName || userProfile.display_name || '',
      author_photo_url: userProfile.photoURL || userProfile.photo_url || null,
      recipe_id,
      recipe_name: recipe.recipe_name || recipe.title || 'メイクレシピ',
      preview_image_url: recipe.preview_image_url || null,
      steps_summary: stepsSummary,
      character_theme: recipe.character_theme || null,
      visibility: 'public',
      tags: Array.isArray(tags) ? tags : [],
      like_count: 0,
      comment_count: 0,
      created_at: now,
      updated_at: now,
    };

    // Create the post
    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc();

    await adminDb.runTransaction(async (tx) => {
      // Create post
      tx.set(postRef, postData);

      // Update user stats
      const statsRef = adminDb
        .collection('social')
        .doc('user_stats')
        .collection('items')
        .doc(userId);
      const statsDoc = await tx.get(statsRef);
      if (statsDoc.exists) {
        tx.update(statsRef, {
          post_count: (statsDoc.data()?.post_count || 0) + 1,
        });
      } else {
        tx.set(statsRef, { post_count: 1, follower_count: 0, following_count: 0 });
      }
    });

    return NextResponse.json(
      {
        success: true,
        post_id: postRef.id,
        post: {
          id: postRef.id,
          ...postData,
          created_at: now.toDate().toISOString(),
          updated_at: now.toDate().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/social/posts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
