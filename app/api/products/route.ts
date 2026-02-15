// GET  /api/products  — 商品マスタ一覧取得
// POST /api/products  — 商品マスタ登録（重複チェック付き upsert）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

/** 重複チェック用キー生成 */
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
      .collection('users').doc(userId).collection('products')
      .get();

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at ? timestampToString(doc.data().created_at) : undefined,
      updated_at: doc.data().updated_at ? timestampToString(doc.data().updated_at) : undefined,
    }));

    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error('GET /api/products error:', error);
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
    const {
      brand, product_name, category, item_type, color_code, color_name,
      color_description, texture, stats, rarity, pao_months, price,
      product_url, image_url, rakuten_image_url, source, confidence,
    } = body;

    if (!brand || !product_name) {
      return NextResponse.json({ error: 'brand and product_name are required' }, { status: 400 });
    }

    const colRef = adminDb.collection('users').doc(userId).collection('products');
    const key = dedupeKey(brand, product_name, color_code);

    // Check for existing product with same dedupe key
    const snapshot = await colRef.get();
    const existing = snapshot.docs.find((doc) => {
      const d = doc.data();
      return dedupeKey(d.brand, d.product_name, d.color_code) === key;
    });

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id, created: false });
    }

    // Create new product
    const now = Timestamp.now();
    const docRef = colRef.doc();
    await docRef.set({
      brand, product_name, category, item_type, color_code, color_name,
      color_description, texture, stats, rarity, pao_months, price,
      product_url, image_url, rakuten_image_url, source, confidence,
      created_at: now, updated_at: now,
    });

    return NextResponse.json({ success: true, id: docRef.id, created: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
