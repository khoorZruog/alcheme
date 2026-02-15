// GET /api/recipes — レシピ一覧取得

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Note: Some recipes may have camelCase timestamps (createdAt) from older agent saves.
    // We fetch all and sort in-memory to handle both field name variants.
    const snapshot = await adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .get();

    const recipes = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const ts = data.created_at ?? data.createdAt;
        return {
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
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ recipes, count: recipes.length });
  } catch (error) {
    console.error('GET /api/recipes error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
