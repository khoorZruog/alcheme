// GET  /api/inventory         — 在庫一覧取得
// POST /api/inventory         — 在庫アイテム登録（1件 or 複数）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';
import { CATEGORY_EN_TO_JA, TEXTURE_EN_TO_JA, CATEGORY_DEFAULT_ITEM_TYPE, ITEM_TYPE_PAO } from '@/lib/cosme-constants';
import type { CosmeCategory } from '@/types/inventory';

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const category = request.nextUrl.searchParams.get('category');
    let ref: FirebaseFirestore.Query = adminDb
      .collection('users')
      .doc(userId)
      .collection('inventory');

    if (category) {
      ref = ref.where('category', '==', category);
    }

    const snapshot = await ref.get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Backward compat: migrate old English category/texture to Japanese
      let cat = data.category ?? "その他";
      if (cat in CATEGORY_EN_TO_JA) cat = CATEGORY_EN_TO_JA[cat];

      let tex = data.texture ?? "クリーム";
      if (tex in TEXTURE_EN_TO_JA) tex = TEXTURE_EN_TO_JA[tex];

      // Derive item_type if missing
      const itemType = data.item_type ?? CATEGORY_DEFAULT_ITEM_TYPE[cat as CosmeCategory] ?? "その他";
      const paoMonths = data.pao_months ?? ITEM_TYPE_PAO[itemType]?.pao_months ?? null;

      return {
        id: doc.id,
        ...data,
        category: cat,
        texture: tex,
        item_type: itemType,
        pao_months: paoMonths,
        created_at: data.created_at ? timestampToString(data.created_at) : undefined,
        updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
      };
    });

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

    const colRef = adminDb.collection('users').doc(userId).collection('inventory');
    const now = Timestamp.now();
    const savedIds: string[] = [];

    for (const item of items) {
      const { id: _id, created_at: _ca, updated_at: _ua, ...fields } = item;
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
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
