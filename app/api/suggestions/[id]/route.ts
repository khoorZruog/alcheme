// PUT    /api/suggestions/[id]  — ステータス更新
// DELETE /api/suggestions/[id]  — 削除

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['候補', '購入済み', '見送り'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await adminDb
      .collection('users').doc(userId).collection('suggested_items').doc(id)
      .update({ status, updated_at: Timestamp.now() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/suggestions/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await adminDb
      .collection('users').doc(userId).collection('suggested_items').doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/suggestions/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
