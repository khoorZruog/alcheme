// POST /api/inventory/bulk — 一括操作（削除・更新）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, ids, updates } = body as {
      action: 'delete' | 'update';
      ids: string[];
      updates?: Record<string, unknown>;
    };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'action and ids are required' }, { status: 400 });
    }

    const inventoryRef = adminDb.collection('users').doc(userId).collection('inventory');
    const now = Timestamp.now();

    // Process in batches of 400
    const BATCH_SIZE = 400;
    let affected = 0;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = ids.slice(i, i + BATCH_SIZE);

      for (const id of chunk) {
        const ref = inventoryRef.doc(id);
        if (action === 'delete') {
          batch.delete(ref);
        } else if (action === 'update' && updates) {
          batch.update(ref, { ...updates, updated_at: now });
        }
        affected++;
      }

      await batch.commit();
    }

    return NextResponse.json({ success: true, affected });
  } catch (error) {
    console.error('POST /api/inventory/bulk error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
