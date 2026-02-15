// POST /api/recipes/[recipeId]/generate-image — レシピプレビュー画像生成

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { callAgent } from '@/lib/api/agent-client';

// Image generation can take up to 3 minutes
export const maxDuration = 200;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recipeId } = await params;

    // Fetch recipe data
    const docRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('recipes')
      .doc(recipeId);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipeData = doc.data()!;

    // Call agent to generate image
    let result;
    try {
      result = await callAgent('/generate-image', {
        recipe_id: recipeId,
        user_id: userId,
        steps: recipeData.steps || [],
        theme: recipeData.character_theme || 'cute',
      });
    } catch (agentErr) {
      console.error('Agent /generate-image call failed:', agentErr);
      return NextResponse.json(
        { error: agentErr instanceof Error ? agentErr.message : 'Agent call failed' },
        { status: 502 }
      );
    }

    if (result.status === 'error') {
      console.error('Image generation returned error:', result.error);
      return NextResponse.json({ error: result.error || 'Image generation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      image_url: result.image_url,
    });
  } catch (error) {
    console.error('POST /api/recipes/[recipeId]/generate-image error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
