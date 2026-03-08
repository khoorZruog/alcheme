// GET /api/catalog/color-search?category=...&limit=200
// hex_color を持つカタログエントリを返す（色距離ソートはクライアント側）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get('category') || null;
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '200', 10) || 200,
    500,
  );

  try {
    const catalogRef = adminDb.collection('catalog');
    let query: FirebaseFirestore.Query = catalogRef
      .where('hex_color', '!=', null)
      .orderBy('hex_color');

    if (category) {
      query = query.where('category', '==', category);
    }

    query = query.limit(limit);

    let docs: FirebaseFirestore.QueryDocumentSnapshot[];
    try {
      const snapshot = await query.get();
      docs = snapshot.docs;
    } catch (indexError: unknown) {
      // Fallback: fetch without composite index, filter in memory
      const errMsg = indexError instanceof Error ? indexError.message : '';
      if (errMsg.includes('index') || errMsg.includes('FAILED_PRECONDITION')) {
        console.warn('color-search: composite index missing, using fallback');
        let fallback: FirebaseFirestore.Query = catalogRef.limit(500);
        if (category) {
          fallback = catalogRef.where('category', '==', category).limit(500);
        }
        const snap = await fallback.get();
        docs = snap.docs.filter((d) => d.data().hex_color);
        if (docs.length > limit) docs = docs.slice(0, limit);
      } else {
        throw indexError;
      }
    }

    const results = docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        brand: data.brand,
        brand_normalized: data.brand_normalized,
        product_name: data.product_name,
        product_name_normalized: data.product_name_normalized,
        category: data.category,
        item_type: data.item_type,
        color_code: data.color_code,
        color_name: data.color_name,
        color_description: data.color_description,
        hex_color: data.hex_color,
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
      };
    });

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('Catalog color search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
