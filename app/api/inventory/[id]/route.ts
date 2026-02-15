// GET    /api/inventory/[id] — アイテム詳細取得
// PUT    /api/inventory/[id] — アイテム更新
// DELETE /api/inventory/[id] — アイテム削除

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

type RouteParams = { params: Promise<{ id: string }> };

function docRef(userId: string, itemId: string) {
  return adminDb.collection('users').doc(userId).collection('inventory').doc(itemId);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const doc = await docRef(userId, id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = doc.data()!;
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
    const ref = docRef(userId, id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    // id と created_at は更新不可
    const { id: _id, created_at: _ca, ...updates } = body;

    await ref.update({
      ...updates,
      updated_at: Timestamp.now(),
    });

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
    const ref = docRef(userId, id);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('DELETE /api/inventory/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
