// POST /api/recipes/[recipeId]/favorite — お気に入りトグル

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';

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
    const docRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const current = doc.data()!.is_favorite ?? false;
    await docRef.update({ is_favorite: !current });

    return NextResponse.json({ success: true, is_favorite: !current });
  } catch (error) {
    console.error('POST /api/recipes/[recipeId]/favorite error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
