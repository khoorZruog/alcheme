// POST /api/catalog/backfill — 現ユーザーの既存商品をカタログへバックフィル
// カタログ機能実装前に登録された商品を catalog コレクションに追加する。

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { upsertCatalogEntry } from '@/lib/api/catalog-upsert';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const productsSnap = await userRef.collection('products').get();

    let upserted = 0;
    let linked = 0;
    let skipped = 0;

    for (const productDoc of productsSnap.docs) {
      const data = productDoc.data();

      // Skip if already linked to catalog
      if (data.catalog_id) {
        skipped++;
        continue;
      }

      const catalogId = await upsertCatalogEntry(data).catch(() => '');
      if (catalogId) {
        await productDoc.ref.update({ catalog_id: catalogId });
        upserted++;
        linked++;
      }
    }

    return NextResponse.json({
      success: true,
      upserted,
      linked,
      skipped,
      total: productsSnap.size,
    });
  } catch (error) {
    console.error('POST /api/catalog/backfill error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
