import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';

/** POST /api/recipes/[recipeId]/publish — Publish recipe as social post */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await params;
    const body = await request.json().catch(() => ({}));
    const tags = Array.isArray(body.tags) ? body.tags : [];

    // Read the recipe
    const recipeRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const recipeDoc = await recipeRef.get();
    if (!recipeDoc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeDoc.data()!;

    // Check if already published
    if (recipe.published_post_id) {
      return NextResponse.json(
        { error: 'Recipe is already published', post_id: recipe.published_post_id },
        { status: 409 }
      );
    }

    // Read user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userProfile = userDoc.exists ? userDoc.data()! : {};

    // Build steps summary
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
      recipe_id: recipeId,
      recipe_name: recipe.recipe_name || recipe.title || 'メイクレシピ',
      preview_image_url: recipe.preview_image_url || null,
      steps_summary: stepsSummary,
      character_theme: recipe.character_theme || null,
      visibility: 'public',
      tags,
      like_count: 0,
      comment_count: 0,
      created_at: now,
      updated_at: now,
    };

    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc();

    await adminDb.runTransaction(async (tx) => {
      tx.set(postRef, postData);
      tx.update(recipeRef, { published_post_id: postRef.id });

      // Update user stats
      const statsRef = adminDb
        .collection('social')
        .doc('user_stats')
        .collection('items')
        .doc(userId);
      const statsDoc = await tx.get(statsRef);
      if (statsDoc.exists) {
        tx.update(statsRef, { post_count: (statsDoc.data()?.post_count || 0) + 1 });
      } else {
        tx.set(statsRef, { post_count: 1, follower_count: 0, following_count: 0 });
      }
    });

    return NextResponse.json(
      { success: true, post_id: postRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/recipes/[recipeId]/publish error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/** DELETE /api/recipes/[recipeId]/publish — Unpublish recipe */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId } = await params;

    const recipeRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const recipeDoc = await recipeRef.get();
    if (!recipeDoc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipe = recipeDoc.data()!;
    const postId = recipe.published_post_id;

    if (!postId) {
      return NextResponse.json({ error: 'Recipe is not published' }, { status: 400 });
    }

    const postRef = adminDb
      .collection('social')
      .doc('posts')
      .collection('items')
      .doc(postId);

    await adminDb.runTransaction(async (tx) => {
      tx.delete(postRef);
      tx.update(recipeRef, { published_post_id: null });

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
    console.error('DELETE /api/recipes/[recipeId]/publish error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
