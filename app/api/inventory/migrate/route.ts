// POST /api/inventory/migrate — 既存データを products + inventory に分離マイグレーション

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/** 商品フィールド */
const PRODUCT_FIELDS = new Set([
  'brand', 'product_name', 'category', 'item_type', 'color_code', 'color_name',
  'color_description', 'texture', 'stats', 'rarity', 'pao_months', 'price',
  'product_url', 'image_url', 'rakuten_image_url', 'source', 'confidence', 'images',
]);

/** 在庫フィールド */
const INSTANCE_FIELDS = new Set([
  'estimated_remaining', 'purchase_date', 'open_date', 'memo',
]);

function dedupeKey(brand: string, productName: string, colorCode?: string): string {
  return `${(brand || '').toLowerCase()}::${(productName || '').toLowerCase()}::${(colorCode || '').toLowerCase()}`;
}

export async function POST(_request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const inventorySnap = await userRef.collection('inventory').get();
    const productsRef = userRef.collection('products');
    const now = Timestamp.now();

    // Load existing products for dedupe
    const existingProducts = await productsRef.get();
    const productDedupeMap = new Map<string, string>();
    existingProducts.docs.forEach((doc) => {
      const d = doc.data();
      productDedupeMap.set(dedupeKey(d.brand, d.product_name, d.color_code), doc.id);
    });

    let productsCreated = 0;
    let itemsMigrated = 0;
    let itemsSkipped = 0;

    // Process in batches of 400 (Firestore batch limit is 500)
    const BATCH_SIZE = 400;
    let batch = adminDb.batch();
    let batchCount = 0;

    for (const doc of inventorySnap.docs) {
      const data = doc.data();

      // Skip already migrated items
      if (data.product_id) {
        itemsSkipped++;
        continue;
      }

      // Extract product fields
      const productFields: Record<string, unknown> = {};
      const instanceFields: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(data)) {
        if (key === 'created_at' || key === 'updated_at') continue;
        if (PRODUCT_FIELDS.has(key)) {
          productFields[key] = val;
        } else if (INSTANCE_FIELDS.has(key)) {
          instanceFields[key] = val;
        }
      }

      // Upsert product
      const key = dedupeKey(
        (productFields.brand as string) || '',
        (productFields.product_name as string) || '',
        productFields.color_code as string | undefined,
      );
      let productId = productDedupeMap.get(key);

      if (!productId) {
        const productDoc = productsRef.doc();
        batch.set(productDoc, { ...productFields, created_at: now, updated_at: now });
        productId = productDoc.id;
        productDedupeMap.set(key, productId);
        productsCreated++;
        batchCount++;
      }

      // Update inventory doc: keep only instance fields + product_id
      const inventoryUpdate: Record<string, unknown> = {
        product_id: productId,
        estimated_remaining: instanceFields.estimated_remaining ?? '100%',
        purchase_date: instanceFields.purchase_date ?? null,
        open_date: instanceFields.open_date ?? null,
        memo: instanceFields.memo ?? null,
        created_at: data.created_at ?? now,
        updated_at: now,
      };

      // Delete old product fields from inventory doc
      const deleteFields: Record<string, FirebaseFirestore.FieldValue> = {};
      for (const field of PRODUCT_FIELDS) {
        if (data[field] !== undefined) {
          deleteFields[field] = FieldValue.delete();
        }
      }

      batch.update(doc.ref, { ...inventoryUpdate, ...deleteFields });
      itemsMigrated++;
      batchCount++;

      // Commit batch if approaching limit
      if (batchCount >= BATCH_SIZE) {
        await batch.commit();
        batch = adminDb.batch();
        batchCount = 0;
      }
    }

    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      products_created: productsCreated,
      items_migrated: itemsMigrated,
      items_skipped: itemsSkipped,
    });
  } catch (error) {
    console.error('POST /api/inventory/migrate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
