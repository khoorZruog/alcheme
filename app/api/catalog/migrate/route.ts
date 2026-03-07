// POST /api/catalog/migrate — 既存ユーザー商品からカタログをバックフィル（管理者用）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { upsertCatalogEntry } from '@/lib/api/catalog-upsert';

export async function POST(request: NextRequest) {
  // Admin check: require secret header
  const adminSecret = request.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_MIGRATION_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const usersSnap = await adminDb.collection('users').get();
    let catalogUpserted = 0;
    let productsLinked = 0;

    for (const userDoc of usersSnap.docs) {
      const productsSnap = await userDoc.ref.collection('products').get();

      for (const productDoc of productsSnap.docs) {
        const data = productDoc.data();

        // Skip if already linked to catalog
        if (data.catalog_id) continue;

        const catalogId = await upsertCatalogEntry(data).catch(() => '');
        if (catalogId) {
          await productDoc.ref.update({ catalog_id: catalogId });
          productsLinked++;
          catalogUpserted++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      catalog_upserted: catalogUpserted,
      products_linked: productsLinked,
    });
  } catch (error) {
    console.error('POST /api/catalog/migrate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
