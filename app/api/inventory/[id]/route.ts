// GET    /api/inventory/[id] — アイテム詳細取得（products 結合）
// PUT    /api/inventory/[id] — アイテム更新（商品/在庫フィールド分割）
// DELETE /api/inventory/[id] — 在庫個体削除（商品マスタは残す）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

type RouteParams = { params: Promise<{ id: string }> };

/** 在庫フィールド */
const INSTANCE_FIELDS = new Set([
  'estimated_remaining', 'purchase_date', 'open_date', 'memo',
]);

function inventoryRef(userId: string, itemId: string) {
  return adminDb.collection('users').doc(userId).collection('inventory').doc(itemId);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const doc = await inventoryRef(userId, id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = doc.data()!;

    // If migrated, join with product
    if (data.product_id) {
      const productDoc = await adminDb
        .collection('users').doc(userId).collection('products').doc(data.product_id)
        .get();

      if (productDoc.exists) {
        const product = productDoc.data()!;
        return NextResponse.json({
          id: doc.id,
          product_id: data.product_id,
          ...product,
          estimated_remaining: data.estimated_remaining,
          purchase_date: data.purchase_date,
          open_date: data.open_date,
          memo: data.memo,
          created_at: data.created_at ? timestampToString(data.created_at) : undefined,
          updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
        });
      }
    }

    // Legacy item
    return NextResponse.json({
      id: doc.id,
      ...data,
      created_at: data.created_at ? timestampToString(data.created_at) : undefined,
      updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
    });
  } catch (error) {
    console.error('GET /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ref = inventoryRef(userId, id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id: _id, created_at: _ca, ...updates } = body;
    const now = Timestamp.now();
    const existingData = existing.data()!;

    if (existingData.product_id) {
      // Split updates into product and instance fields
      const productUpdates: Record<string, unknown> = {};
      const instanceUpdates: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(updates)) {
        if (INSTANCE_FIELDS.has(key)) {
          instanceUpdates[key] = val;
        } else {
          productUpdates[key] = val;
        }
      }

      // Update product if there are product field changes
      if (Object.keys(productUpdates).length > 0) {
        await adminDb
          .collection('users').doc(userId)
          .collection('products').doc(existingData.product_id)
          .update({ ...productUpdates, updated_at: now });
      }

      // Update inventory instance
      await ref.update({ ...instanceUpdates, updated_at: now });
    } else {
      // Legacy: update everything on inventory doc
      await ref.update({ ...updates, updated_at: now });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('PUT /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ref = inventoryRef(userId, id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Only delete the inventory instance; product master stays
    await ref.delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
