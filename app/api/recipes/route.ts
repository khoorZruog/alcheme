// GET  /api/recipes — レシピ一覧取得
// POST /api/recipes — 手動レシピ保存

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
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

    // Filter by item_id if provided
    const itemId = request.nextUrl.searchParams.get('item_id');
    const filtered = itemId
      ? recipes.filter((r: any) =>
          (r.steps as any[])?.some((s: any) => s.item_id === itemId)
        )
      : recipes;

    return NextResponse.json({ recipes: filtered, count: filtered.length });
  } catch (error) {
    console.error('GET /api/recipes error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { recipe_name, steps, context, source, pro_tips, thinking_process } = body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'At least one step is required' }, { status: 400 });
    }

    const now = Timestamp.now();
    const recipeData: Record<string, unknown> = {
      recipe_name: recipe_name || 'マイレシピ',
      user_request: source === 'manual' ? '手動作成' : '',
      steps: steps.map((s: any, i: number) => ({
        step: i + 1,
        area: s.area || '',
        item_id: s.item_id || '',
        item_name: s.item_name || '',
        instruction: s.instruction || '',
        brand: s.brand || '',
        color_code: s.color_code || '',
        color_name: s.color_name || '',
      })),
      context: context || {},
      source: source || 'manual',
      match_score: 100,
      is_favorite: false,
      pro_tips: pro_tips || [],
      thinking_process: thinking_process || [],
      created_at: now,
      updated_at: now,
    };

    const docRef = await adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .add(recipeData);

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/recipes error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
