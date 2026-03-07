/**
 * Catalog upsert helper — グローバル商品カタログへの追加・更新
 *
 * 全ての商品登録フロー（スキャン、楽天、Web検索、手動、AI）から呼ばれる。
 * 決定的 ID（SHA-256ハッシュ）で O(1) の重複チェックを実現。
 */

import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

/** カタログに含める普遍的フィールド */
const CATALOG_FIELDS = [
  'brand', 'product_name', 'category', 'item_type', 'color_code', 'color_name',
  'color_description', 'texture', 'pao_months', 'price', 'product_url',
  'image_url', 'rakuten_image_url',
] as const;

/**
 * 決定的カタログ ID を生成。
 * brand + product_name + color_code の正規化ハッシュ（SHA-256 先頭20文字）。
 */
export function catalogDocId(brand: string, productName: string, colorCode?: string): string {
  const normalized = `${(brand || '').trim().toLowerCase()}::${(productName || '').trim().toLowerCase()}::${(colorCode || '').trim().toLowerCase()}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 20);
}

/**
 * カタログエントリを作成 or マージ更新する。
 *
 * - 新規: 全フィールドセット + contributor_count = 1
 * - 既存: null/空のフィールドのみ補完 + contributor_count インクリメント
 *
 * @returns カタログ doc ID（空文字 = brand/product_name 不足でスキップ）
 */
export async function upsertCatalogEntry(
  productFields: Record<string, unknown>,
  countType: 'have' | 'want' = 'have',
): Promise<string> {
  const brand = (productFields.brand as string) || '';
  const productName = (productFields.product_name as string) || '';

  if (!brand || !productName) return '';

  const colorCode = productFields.color_code as string | undefined;
  const docId = catalogDocId(brand, productName, colorCode);
  const catalogRef = adminDb.collection('catalog').doc(docId);

  // カタログフィールドのみ抽出（undefined/null を除外）
  const catalogData: Record<string, unknown> = {};
  for (const field of CATALOG_FIELDS) {
    const val = productFields[field];
    if (val !== undefined && val !== null && val !== '') {
      catalogData[field] = val;
    }
  }

  // 検索用の正規化フィールド
  catalogData.brand_normalized = brand.trim().toLowerCase();
  catalogData.product_name_normalized = productName.trim().toLowerCase();
  catalogData.dedupe_key = `${brand.trim().toLowerCase()}::${productName.trim().toLowerCase()}::${(colorCode || '').trim().toLowerCase()}`;

  const existing = await catalogRef.get();

  if (existing.exists) {
    const existingData = existing.data()!;
    const updates: Record<string, unknown> = {
      updated_at: FieldValue.serverTimestamp(),
      contributor_count: FieldValue.increment(1),
      [countType === 'have' ? 'have_count' : 'want_count']: FieldValue.increment(1),
    };

    // 既存の非null値は上書きしない — 空フィールドのみ補完
    for (const [key, val] of Object.entries(catalogData)) {
      if (val != null && val !== '' && (existingData[key] == null || existingData[key] === '')) {
        updates[key] = val;
      }
    }

    await catalogRef.update(updates);
  } else {
    await catalogRef.set({
      ...catalogData,
      contributor_count: 1,
      have_count: countType === 'have' ? 1 : 0,
      want_count: countType === 'want' ? 1 : 0,
      use_count: 0,
      total_rating: 0,
      rating_count: 0,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }

  return docId;
}

/**
 * Beauty Log 保存時にカタログの use_count / rating を更新する。
 *
 * 解決チェーン: inventory/{itemId}.product_id → products/{productId}.catalog_id → catalog/{catalogId}
 * fire-and-forget で呼び出す（ログ保存自体はブロックしない）。
 */
export async function updateCatalogUsageStats(
  userId: string,
  usedItemIds: string[],
  selfRating?: number,
): Promise<void> {
  if (!usedItemIds || usedItemIds.length === 0) return;

  const userRef = adminDb.collection('users').doc(userId);

  // 1. Resolve inventory item IDs → product IDs
  const inventorySnap = await Promise.all(
    usedItemIds.map((id) => userRef.collection('inventory').doc(id).get()),
  );
  const productIds = new Set<string>();
  for (const snap of inventorySnap) {
    const pid = snap.data()?.product_id as string | undefined;
    if (pid) productIds.add(pid);
  }
  if (productIds.size === 0) return;

  // 2. Resolve product IDs → catalog IDs
  const productSnap = await Promise.all(
    [...productIds].map((id) => userRef.collection('products').doc(id).get()),
  );
  const catalogIds = new Set<string>();
  for (const snap of productSnap) {
    const cid = snap.data()?.catalog_id as string | undefined;
    if (cid) catalogIds.add(cid);
  }
  if (catalogIds.size === 0) return;

  // 3. Increment use_count (and optionally rating) on each catalog entry
  const batch = adminDb.batch();
  for (const catalogId of catalogIds) {
    const ref = adminDb.collection('catalog').doc(catalogId);
    const updates: Record<string, unknown> = {
      use_count: FieldValue.increment(1),
      updated_at: FieldValue.serverTimestamp(),
    };
    if (selfRating != null && selfRating >= 1 && selfRating <= 5) {
      updates.total_rating = FieldValue.increment(selfRating);
      updates.rating_count = FieldValue.increment(1);
    }
    batch.update(ref, updates);
  }
  await batch.commit();
}

/**
 * カタログ画像が未設定の場合、ユーザー提供画像を AI 加工して設定する（非同期・非ブロック）。
 *
 * 呼び出し元はこの結果を await しなくてよい（fire-and-forget）。
 */
export function triggerCatalogImageProcessing(
  catalogId: string,
  imageBase64: string,
): void {
  if (!catalogId || !imageBase64) return;

  // Check if catalog entry already has an image_url
  const catalogRef = adminDb.collection('catalog').doc(catalogId);
  catalogRef.get().then(async (snap) => {
    if (!snap.exists) return;
    const data = snap.data();
    if (data?.image_url) return; // Already has processed image

    try {
      const { callAgent } = await import('@/lib/api/agent-client');
      await callAgent('/process-image', { image_base64: imageBase64, catalog_id: catalogId });
    } catch (err) {
      console.error('Catalog image processing failed (non-blocking):', err);
    }
  }).catch((err) => {
    console.error('Catalog image check failed (non-blocking):', err);
  });
}
