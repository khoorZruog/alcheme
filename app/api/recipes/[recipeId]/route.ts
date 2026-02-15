// GET/DELETE /api/recipes/[recipeId] — レシピ詳細取得・削除

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await params;
    const doc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const data = doc.data()!;
    const ts = data.created_at ?? data.createdAt;
    const recipe = {
      id: doc.id,
      ...data,
      // Normalize field names for frontend
      recipe_name: data.recipe_name ?? data.title ?? 'メイクレシピ',
      user_request: data.user_request ?? '',
      is_favorite: data.is_favorite ?? false,
      steps: data.steps ?? [],
      thinking_process: data.thinking_process ?? [],
      pro_tips: data.pro_tips ?? [],
      created_at: ts ? timestampToString(ts) : new Date().toISOString(),
    };

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('GET /api/recipes/[recipeId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await params;
    const recipeRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const doc = await recipeRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const data = doc.data()!;

    // If recipe was published as a social post, clean up
    if (data.published_post_id) {
      try {
        await adminDb.collection('social').doc('posts')
          .collection('items').doc(data.published_post_id).delete();
        await adminDb.collection('social').doc('user_stats')
          .collection('items').doc(userId)
          .update({ post_count: FieldValue.increment(-1) });
      } catch (e) {
        console.warn('Failed to clean up social post for recipe:', e);
      }
    }

    await recipeRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/recipes/[recipeId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
