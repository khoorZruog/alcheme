// POST /api/image/process — プレビュー用画像加工（背景除去 + 正規化）
// GCS 保存なし。base64 を返す。

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { callAgent } from '@/lib/api/agent-client';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { image_base64 } = await request.json();
    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });
    }

    const result = await callAgent('/process-image-preview', { image_base64 });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/image/process error:', error);
    return NextResponse.json({ error: 'Image processing failed' }, { status: 500 });
  }
}
