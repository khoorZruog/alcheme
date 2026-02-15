// POST /api/recipes/enhance — AI補完 (レシピ名・コツ自動生成)

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { callAgent } from '@/lib/api/agent-client';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { steps, context } = body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Steps are required' }, { status: 400 });
    }

    const result = await callAgent('/enhance-recipe', {
      user_id: userId,
      steps,
      context: context || {},
    });

    return NextResponse.json({
      recipe_name: result.recipe_name || '',
      pro_tips: result.pro_tips || [],
      thinking_process: result.thinking_process || [],
    });
  } catch (error) {
    console.error('POST /api/recipes/enhance error:', error);
    return NextResponse.json({ error: 'AI enhancement failed' }, { status: 500 });
  }
}
