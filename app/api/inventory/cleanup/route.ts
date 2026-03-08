// POST /api/inventory/cleanup — ゴーストエントリ（brand/product_name が空）を削除

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const productsRef = userRef.collection('products');
    const inventoryRef = userRef.collection('inventory');

    const [productsSnap, inventorySnap] = await Promise.all([
      productsRef.get(),
      inventoryRef.get(),
    ]);

    // Find ghost products (missing brand or product_name)
    const ghostProductIds = new Set<string>();
    const deleteOps: Promise<FirebaseFirestore.WriteResult>[] = [];

    for (const doc of productsSnap.docs) {
      const d = doc.data();
      if (!d.brand || !d.product_name) {
        ghostProductIds.add(doc.id);
        deleteOps.push(doc.ref.delete());
      }
    }

    // Delete inventory entries referencing ghost products, or with no product_id
    for (const doc of inventorySnap.docs) {
      const d = doc.data();
      if (!d.product_id || ghostProductIds.has(d.product_id)) {
        deleteOps.push(doc.ref.delete());
      }
    }

    await Promise.all(deleteOps);

    return NextResponse.json({
      success: true,
      deleted_products: ghostProductIds.size,
      deleted_inventory: deleteOps.length - ghostProductIds.size,
    });
  } catch (error) {
    console.error('POST /api/inventory/cleanup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
