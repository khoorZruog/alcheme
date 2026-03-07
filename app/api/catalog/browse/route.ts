// GET /api/catalog/browse?category=...&brand=...&sort=...&limit=20&cursor=...
// カタログ ランキングブラウズ API

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';

const VALID_SORT_KEYS = ['have_count', 'use_count', 'want_count'] as const;
type SortKey = (typeof VALID_SORT_KEYS)[number];

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const category = request.nextUrl.searchParams.get('category');
  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 });
  }

  const brand = request.nextUrl.searchParams.get('brand') || null;
  const sortParam = request.nextUrl.searchParams.get('sort') || 'have_count';
  const sortKey: SortKey = VALID_SORT_KEYS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : 'have_count';
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10) || 20,
    40,
  );
  const cursor = request.nextUrl.searchParams.get('cursor') || null;

  try {
    const catalogRef = adminDb.collection('catalog');
    let query: FirebaseFirestore.Query = catalogRef.where('category', '==', category);

    if (brand) {
      query = query.where('brand_normalized', '==', brand.toLowerCase());
    }

    query = query.orderBy(sortKey, 'desc');

    // Cursor-based pagination: "sortValue:docId"
    if (cursor) {
      const sepIdx = cursor.indexOf(':');
      if (sepIdx > 0) {
        const cursorValue = Number(cursor.slice(0, sepIdx));
        const cursorDocId = cursor.slice(sepIdx + 1);
        const cursorDoc = await catalogRef.doc(cursorDocId).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorValue, cursorDoc);
        } else {
          query = query.startAfter(cursorValue);
        }
      }
    }

    query = query.limit(limit + 1); // +1 to detect hasMore

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const resultDocs = hasMore ? docs.slice(0, limit) : docs;

    const results = resultDocs.map((doc) => {
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

    // Build next_cursor from last result
    let nextCursor: string | null = null;
    if (hasMore && resultDocs.length > 0) {
      const lastDoc = resultDocs[resultDocs.length - 1];
      const lastData = lastDoc.data();
      nextCursor = `${lastData[sortKey] ?? 0}:${lastDoc.id}`;
    }

    // Extract top brands from first page only (no cursor)
    let topBrands: string[] | undefined;
    if (!cursor && !brand) {
      const brandCounts = new Map<string, number>();
      // Fetch up to 100 docs for brand extraction
      const brandQuery = catalogRef
        .where('category', '==', category)
        .orderBy('have_count', 'desc')
        .limit(100);
      const brandSnap = await brandQuery.get();
      for (const doc of brandSnap.docs) {
        const b = doc.data().brand as string | undefined;
        if (b) {
          brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
        }
      }
      topBrands = [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name]) => name);
    }

    return NextResponse.json({
      results,
      count: results.length,
      next_cursor: nextCursor,
      ...(topBrands ? { top_brands: topBrands } : {}),
    });
  } catch (error) {
    console.error('GET /api/catalog/browse error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
