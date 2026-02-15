// GET  /api/users/me — ユーザープロフィール取得
// PATCH /api/users/me — ユーザープロフィール更新

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const doc = await adminDb.collection('users').doc(userId).get();

    if (!doc.exists) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: doc.data() });
  } catch (error) {
    console.error('GET /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updates = await request.json();
    delete updates.uid;

    await adminDb.collection('users').doc(userId).set(
      {
        ...updates,
        updated_at: Timestamp.now(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/users/me error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
