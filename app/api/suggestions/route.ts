// GET  /api/suggestions  — Next Cosme 一覧
// POST /api/suggestions  — 候補追加（重複時は recommendation_count++）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

function dedupeKey(brand: string, productName: string, colorCode?: string): string {
  return `${(brand || '').toLowerCase()}::${(productName || '').toLowerCase()}::${(colorCode || '').toLowerCase()}`;
}

export async function GET(_request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection('users').doc(userId).collection('suggested_items')
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at ? timestampToString(data.created_at) : undefined,
        updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
      };
    });

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error('GET /api/suggestions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brand, product_name, color_code, color_name, category, item_type,
      price_range, product_url, image_url, reason, source,
      recipe_id, recipe_name, context } = body;

    if (!brand || !product_name) {
      return NextResponse.json({ error: 'brand and product_name are required' }, { status: 400 });
    }

    const colRef = adminDb.collection('users').doc(userId).collection('suggested_items');
    const key = dedupeKey(brand, product_name, color_code);
    const now = Timestamp.now();

    // Check for existing suggestion
    const snapshot = await colRef.get();
    const existing = snapshot.docs.find((doc) => {
      const d = doc.data();
      return dedupeKey(d.brand, d.product_name, d.color_code) === key;
    });

    const historyEntry = {
      recipe_id: recipe_id || null,
      recipe_name: recipe_name || null,
      suggested_at: new Date().toISOString(),
      context: context || reason || '',
    };

    if (existing) {
      // Increment count and append history
      const data = existing.data();
      const history = data.history || [];
      await existing.ref.update({
        recommendation_count: (data.recommendation_count || 1) + 1,
        history: [...history, historyEntry],
        reason: reason || data.reason,
        updated_at: now,
      });
      return NextResponse.json({ success: true, id: existing.id, incremented: true });
    }

    // Create new suggestion — only include defined fields (Firestore rejects undefined)
    const docRef = colRef.doc();
    const doc: Record<string, unknown> = {
      brand,
      product_name,
      reason: reason || '',
      recommendation_count: 1,
      history: [historyEntry],
      status: '候補',
      source: source || 'manual',
      created_at: now,
      updated_at: now,
    };
    if (color_code) doc.color_code = color_code;
    if (color_name) doc.color_name = color_name;
    if (category) doc.category = category;
    if (item_type) doc.item_type = item_type;
    if (price_range) doc.price_range = price_range;
    if (product_url) doc.product_url = product_url;
    if (image_url) doc.image_url = image_url;
    await docRef.set(doc);

    return NextResponse.json({ success: true, id: docRef.id, incremented: false }, { status: 201 });
  } catch (error) {
    console.error('POST /api/suggestions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
