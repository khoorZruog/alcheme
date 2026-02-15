// POST /api/inventory/confirm — スキャン結果を確認して在庫に登録

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { ITEM_TYPE_PAO, CATEGORY_DEFAULT_ITEM_TYPE } from '@/lib/cosme-constants';
import type { CosmeCategory } from '@/types/inventory';

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

    const colRef = adminDb.collection('users').doc(userId).collection('inventory');
    const now = Timestamp.now();
    const savedIds: string[] = [];

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

      // Remove candidates array (not stored in Firestore)
      delete fields.candidates;

      const docRef = colRef.doc();
      await docRef.set({
        ...fields,
        created_at: now,
        updated_at: now,
      });
      savedIds.push(docRef.id);
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
