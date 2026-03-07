// POST /api/catalog/process-images — 既存カタログ画像のバッチ AI 加工
//
// rakuten_image_url はあるが image_url が未設定のカタログエントリを
// 一括で背景除去 + 正規化処理する。

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import { callAgent } from '@/lib/api/agent-client';

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 10;

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(1, Number(body.limit) || DEFAULT_LIMIT), MAX_LIMIT);

    // カタログから image_url 未設定のエントリを取得
    const snapshot = await adminDb
      .collection('catalog')
      .where('rakuten_image_url', '!=', '')
      .limit(limit * 3) // 多めに取得し image_url 未設定をフィルタ
      .get();

    const candidates = snapshot.docs.filter((doc) => {
      const d = doc.data();
      return !d.image_url && d.rakuten_image_url;
    }).slice(0, limit);

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        failed: 0,
        message: '処理対象のカタログエントリがありません',
      });
    }

    const results: { catalog_id: string; status: 'ok' | 'error'; image_url?: string; error?: string }[] = [];

    for (const doc of candidates) {
      const catalogId = doc.id;
      const rakutenUrl = doc.data().rakuten_image_url as string;

      try {
        // 楽天画像をダウンロードして base64 に変換
        const imgRes = await fetch(rakutenUrl, { signal: AbortSignal.timeout(15_000) });
        if (!imgRes.ok) {
          results.push({ catalog_id: catalogId, status: 'error', error: `fetch ${imgRes.status}` });
          continue;
        }
        const buf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');

        // Agent の /process-image に送信
        const agentResult = await callAgent('/process-image', {
          image_base64: base64,
          catalog_id: catalogId,
        });

        results.push({
          catalog_id: catalogId,
          status: 'ok',
          image_url: agentResult.image_url as string,
        });
      } catch (err) {
        console.error(`process-images: failed for ${catalogId}:`, err);
        results.push({
          catalog_id: catalogId,
          status: 'error',
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    const processed = results.filter((r) => r.status === 'ok').length;
    const failed = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({ success: true, processed, failed, results });
  } catch (error) {
    console.error('POST /api/catalog/process-images error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
