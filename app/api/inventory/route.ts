// GET  /api/inventory         — 在庫一覧取得（products + inventory 結合）
// POST /api/inventory         — 在庫アイテム登録（商品 upsert + 在庫作成）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';
import { CATEGORY_EN_TO_JA, TEXTURE_EN_TO_JA, CATEGORY_DEFAULT_ITEM_TYPE, ITEM_TYPE_PAO } from '@/lib/cosme-constants';
import type { CosmeCategory } from '@/types/inventory';

/** 商品フィールド（Product に属するもの） */
const PRODUCT_FIELDS = [
  'brand', 'product_name', 'category', 'item_type', 'color_code', 'color_name',
  'color_description', 'texture', 'stats', 'rarity', 'pao_months', 'price',
  'product_url', 'image_url', 'rakuten_image_url', 'source', 'confidence',
  'images',
] as const;

/** 重複チェック用キー生成 */
function dedupeKey(brand: string, productName: string, colorCode?: string): string {
  return `${(brand || '').toLowerCase()}::${(productName || '').toLowerCase()}::${(colorCode || '').toLowerCase()}`;
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const category = request.nextUrl.searchParams.get('category');
    const userRef = adminDb.collection('users').doc(userId);

    // Fetch products and inventory in parallel
    const [productsSnap, inventorySnap] = await Promise.all([
      userRef.collection('products').get(),
      userRef.collection('inventory').get(),
    ]);

    // Build product lookup map
    const productMap = new Map<string, FirebaseFirestore.DocumentData>();
    productsSnap.docs.forEach((doc) => {
      productMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    const items: Record<string, unknown>[] = [];

    for (const doc of inventorySnap.docs) {
      const data = doc.data();

      // If migrated (has product_id), join with product data
      if (data.product_id && productMap.has(data.product_id)) {
        const product = productMap.get(data.product_id)!;

        let cat = product.category ?? 'その他';
        if (cat in CATEGORY_EN_TO_JA) cat = CATEGORY_EN_TO_JA[cat];

        let tex = product.texture ?? 'クリーム';
        if (tex in TEXTURE_EN_TO_JA) tex = TEXTURE_EN_TO_JA[tex];

        const itemType = product.item_type ?? CATEGORY_DEFAULT_ITEM_TYPE[cat as CosmeCategory] ?? 'その他';
        const paoMonths = product.pao_months ?? ITEM_TYPE_PAO[itemType]?.pao_months ?? null;

        if (category && cat !== category) continue;

        items.push({
          id: doc.id,
          product_id: data.product_id,
          // Product fields
          brand: product.brand,
          product_name: product.product_name,
          category: cat,
          item_type: itemType,
          color_code: product.color_code,
          color_name: product.color_name,
          color_description: product.color_description,
          texture: tex,
          stats: product.stats,
          rarity: product.rarity,
          pao_months: paoMonths,
          price: product.price,
          product_url: product.product_url,
          image_url: product.image_url,
          rakuten_image_url: product.rakuten_image_url,
          source: product.source,
          confidence: product.confidence,
          images: product.images,
          // Inventory instance fields
          estimated_remaining: data.estimated_remaining,
          purchase_date: data.purchase_date,
          open_date: data.open_date,
          memo: data.memo,
          created_at: data.created_at ? timestampToString(data.created_at) : undefined,
          updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
        });
      } else {
        // Legacy item (not yet migrated): return as-is
        let cat = data.category ?? 'その他';
        if (cat in CATEGORY_EN_TO_JA) cat = CATEGORY_EN_TO_JA[cat];

        let tex = data.texture ?? 'クリーム';
        if (tex in TEXTURE_EN_TO_JA) tex = TEXTURE_EN_TO_JA[tex];

        const itemType = data.item_type ?? CATEGORY_DEFAULT_ITEM_TYPE[cat as CosmeCategory] ?? 'その他';
        const paoMonths = data.pao_months ?? ITEM_TYPE_PAO[itemType]?.pao_months ?? null;

        if (category && cat !== category) continue;

        items.push({
          id: doc.id,
          ...data,
          category: cat,
          texture: tex,
          item_type: itemType,
          pao_months: paoMonths,
          created_at: data.created_at ? timestampToString(data.created_at) : undefined,
          updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
        });
      }
    }

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error('GET /api/inventory error:', error);
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
    const items = Array.isArray(body.items) ? body.items : [body];

    const userRef = adminDb.collection('users').doc(userId);
    const productsRef = userRef.collection('products');
    const inventoryRef = userRef.collection('inventory');
    const now = Timestamp.now();
    const savedIds: string[] = [];

    // Load existing products for dedupe
    const existingProducts = await productsRef.get();
    const productDedupeMap = new Map<string, string>();
    existingProducts.docs.forEach((doc) => {
      const d = doc.data();
      productDedupeMap.set(dedupeKey(d.brand, d.product_name, d.color_code), doc.id);
    });

    for (const item of items) {
      const { id: _id, created_at: _ca, updated_at: _ua, candidates: _cand, ...fields } = item;

      // Split into product and inventory fields
      const productFields: Record<string, unknown> = {};
      const instanceFields: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(fields)) {
        if ((PRODUCT_FIELDS as readonly string[]).includes(key)) {
          productFields[key] = val;
        } else {
          instanceFields[key] = val;
        }
      }

      // Upsert product
      const key = dedupeKey(
        productFields.brand as string || '',
        productFields.product_name as string || '',
        productFields.color_code as string | undefined,
      );
      let productId = productDedupeMap.get(key);

      if (!productId) {
        const productDoc = productsRef.doc();
        await productDoc.set({ ...productFields, created_at: now, updated_at: now });
        productId = productDoc.id;
        productDedupeMap.set(key, productId);
      }

      // Create inventory instance
      const inventoryDoc = inventoryRef.doc();
      await inventoryDoc.set({
        product_id: productId,
        estimated_remaining: instanceFields.estimated_remaining ?? '100%',
        purchase_date: instanceFields.purchase_date ?? null,
        open_date: instanceFields.open_date ?? null,
        memo: instanceFields.memo ?? null,
        created_at: now,
        updated_at: now,
      });
      savedIds.push(inventoryDoc.id);
    }

    return NextResponse.json(
      { success: true, ids: savedIds, count: savedIds.length },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
