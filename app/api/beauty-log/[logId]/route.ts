// GET    /api/beauty-log/[logId] — Beauty Log 詳細取得
// PUT    /api/beauty-log/[logId] — Beauty Log 更新
// DELETE /api/beauty-log/[logId] — Beauty Log 削除

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

type RouteParams = { params: Promise<{ logId: string }> };

function docRef(userId: string, logId: string) {
  return adminDb.collection('users').doc(userId).collection('beauty_logs').doc(logId);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { logId } = await params;

  try {
    const doc = await docRef(userId, logId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = doc.data()!;
    return NextResponse.json({
      log: {
        id: doc.id,
        date: data.date ?? doc.id,
        recipe_id: data.recipe_id ?? undefined,
        recipe_name: data.recipe_name ?? undefined,
        used_items: data.used_items ?? [],
        modifications: data.modifications ?? [],
        self_rating: data.self_rating ?? undefined,
        mood: data.mood ?? undefined,
        occasion: data.occasion ?? undefined,
        weather: data.weather ?? undefined,
        user_note: data.user_note ?? undefined,
        auto_tags: data.auto_tags ?? [],
        selfie_url: data.selfie_url ?? undefined,
        created_at: data.created_at ? timestampToString(data.created_at) : undefined,
        updated_at: data.updated_at ? timestampToString(data.updated_at) : undefined,
      },
    });
  } catch (error) {
    console.error('GET /api/beauty-log/[logId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { logId } = await params;

  try {
    const ref = docRef(userId, logId);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id: _id, created_at: _ca, date: _date, ...updates } = body;

    await ref.update({
      ...updates,
      updated_at: Timestamp.now(),
    });

    return NextResponse.json({ success: true, id: logId });
  } catch (error) {
    console.error('PUT /api/beauty-log/[logId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { logId } = await params;

  try {
    const ref = docRef(userId, logId);
    const existing = await ref.get();
    if (!existing.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ success: true, id: logId });
  } catch (error) {
    console.error('DELETE /api/beauty-log/[logId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
