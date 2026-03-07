// GET /api/catalog/search?q=...&limit=10 — カタログ検索（prefix match）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10) || 10,
    20,
  );

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 },
    );
  }

  try {
    const catalogRef = adminDb.collection('catalog');

    // Prefix match on brand_normalized
    const brandSnap = await catalogRef
      .where('brand_normalized', '>=', q)
      .where('brand_normalized', '<', q + '\uf8ff')
      .limit(limit)
      .get();

    // Prefix match on product_name_normalized
    const nameSnap = await catalogRef
      .where('product_name_normalized', '>=', q)
      .where('product_name_normalized', '<', q + '\uf8ff')
      .limit(limit)
      .get();

    // Merge and deduplicate
    const seen = new Set<string>();
    const results: Record<string, unknown>[] = [];

    for (const doc of [...brandSnap.docs, ...nameSnap.docs]) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);

      const data = doc.data();
      results.push({
        id: doc.id,
        brand: data.brand,
        product_name: data.product_name,
        category: data.category,
        item_type: data.item_type,
        color_code: data.color_code,
        color_name: data.color_name,
        color_description: data.color_description,
        texture: data.texture,
        pao_months: data.pao_months,
        image_url: data.image_url,
        rakuten_image_url: data.rakuten_image_url,
        price: data.price,
        product_url: data.product_url,
        contributor_count: data.contributor_count ?? 0,
        have_count: data.have_count ?? 0,
        want_count: data.want_count ?? 0,
        use_count: data.use_count ?? 0,
        total_rating: data.total_rating ?? 0,
        rating_count: data.rating_count ?? 0,
        created_at: data.created_at ? timestampToString(data.created_at) : undefined,
        updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
      });
    }

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('GET /api/catalog/search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
