// POST /api/catalog/process-image — カタログ商品画像の AI 加工プロキシ
//
// Agent の /process-image に転送し、背景除去 + 正規化済み画像 URL を返す。

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { callAgent } from '@/lib/api/agent-client';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { image_base64, catalog_id } = await request.json();

    if (!image_base64 || !catalog_id) {
      return NextResponse.json(
        { error: 'image_base64 and catalog_id are required' },
        { status: 400 },
      );
    }

    const result = await callAgent('/process-image', {
      image_base64,
      catalog_id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/catalog/process-image error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
