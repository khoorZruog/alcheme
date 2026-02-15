// POST /api/inventory/confirm — スキャン結果を確認して在庫に登録（商品 upsert + 在庫作成）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { ITEM_TYPE_PAO, CATEGORY_DEFAULT_ITEM_TYPE } from '@/lib/cosme-constants';
import type { CosmeCategory } from '@/types/inventory';

/** 商品フィールド */
const PRODUCT_FIELDS = new Set([
  'brand', 'product_name', 'category', 'item_type', 'color_code', 'color_name',
  'color_description', 'texture', 'stats', 'rarity', 'pao_months', 'price',
  'product_url', 'image_url', 'rakuten_image_url', 'source', 'confidence', 'images',
]);

function dedupeKey(brand: string, productName: string, colorCode?: string): string {
  return `${(brand || '').toLowerCase()}::${(productName || '').toLowerCase()}::${(colorCode || '').toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items to register' }, { status: 400 });
    }

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
      const { id: _id, created_at: _ca, updated_at: _ua, ...fields } = item;

      // Auto-derive item_type and pao_months if missing
      const category = fields.category as CosmeCategory | undefined;
      if (!fields.item_type && category) {
        fields.item_type = CATEGORY_DEFAULT_ITEM_TYPE[category] ?? "その他";
      }
      const itemType = fields.item_type as string | undefined;
      if (fields.pao_months == null && itemType) {
        fields.pao_months = ITEM_TYPE_PAO[itemType]?.pao_months ?? null;
      }

      // Remove candidates array
      delete fields.candidates;

      // Validate product_url: only allow rakuten.co.jp domains
      if (fields.product_url) {
        try {
          const urlObj = new URL(fields.product_url);
          if (!urlObj.hostname.includes('rakuten.co.jp')) {
            fields.product_url = null;
          }
        } catch {
          fields.product_url = null;
        }
      }

      // Split into product and instance fields
      const productFields: Record<string, unknown> = {};
      const instanceFields: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(fields)) {
        if (PRODUCT_FIELDS.has(key)) {
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
    console.error('POST /api/inventory/confirm error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
