// POST /api/recipes/[recipeId]/feedback — レシピ評価を保存

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await params;
    const body = await request.json();
    const { rating } = body;

    if (!["liked", "neutral", "disliked"].includes(rating)) {
      return NextResponse.json(
        { error: 'rating must be "liked", "neutral", or "disliked"' },
        { status: 400 },
      );
    }

    const docRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    await docRef.update({
      feedback: {
        user_rating: rating,
        created_at: Timestamp.now(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/recipes/[recipeId]/feedback error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
