// GET  /api/beauty-log         — Beauty Log 一覧取得（月別フィルター対応）
// POST /api/beauty-log         — Beauty Log 記録（upsert: 同日は上書きマージ）

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { timestampToString } from '@/lib/firebase/firestore-helpers';
import { Timestamp } from 'firebase-admin/firestore';

function logsRef(userId: string) {
  return adminDb.collection('users').doc(userId).collection('beauty_logs');
}

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const month = request.nextUrl.searchParams.get('month'); // "2026-02"
    const recipeId = request.nextUrl.searchParams.get('recipe_id');
    const mode = request.nextUrl.searchParams.get('mode'); // "timeline"
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '0', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);
    let ref: FirebaseFirestore.Query = logsRef(userId);

    // recipe_id filter: no composite index, fetch without orderBy and sort in-memory
    const useClientSort = !!recipeId;

    if (recipeId) {
      // Filter by recipe_id (for usage history)
      ref = ref.where('recipe_id', '==', recipeId);
    } else if (mode !== 'timeline' && month) {
      // Filter by month using date string range (doc ID = "YYYY-MM-DD")
      ref = ref
        .where('date', '>=', `${month}-01`)
        .where('date', '<=', `${month}-31`);
    }
    // timeline mode: no month filter, just all logs ordered by date desc

    let query: FirebaseFirestore.Query = ref;
    if (!useClientSort) {
      query = query.orderBy('date', 'desc');
      if (offset > 0) query = query.offset(offset);
      if (limit > 0) query = query.limit(limit);
    }

    const snapshot = await query.get();
    let logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
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
        photos: data.photos ?? [],
        auto_tags: data.auto_tags ?? [],
        selfie_url: data.selfie_url ?? undefined,
        preview_image_url: data.preview_image_url ?? undefined,
        created_at: data.created_at ? timestampToString(data.created_at) : new Date().toISOString(),
        updated_at: data.updated_at ? timestampToString(data.updated_at) : new Date().toISOString(),
      };
    });

    // Sort in-memory for recipe_id queries (no composite index)
    if (useClientSort) {
      logs = logs.sort((a, b) => b.date.localeCompare(a.date));
    }

    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    console.error('GET /api/beauty-log error:', error);
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
    const date = body.date as string;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD' }, { status: 400 });
    }

    const now = Timestamp.now();
    const docRef = logsRef(userId).doc(date);
    const existing = await docRef.get();

    const logData: Record<string, unknown> = {
      date,
      updated_at: now,
    };

    // Only set provided fields (allows partial updates)
    if (body.recipe_id !== undefined) logData.recipe_id = body.recipe_id;
    if (body.recipe_name !== undefined) logData.recipe_name = body.recipe_name;
    if (body.used_items !== undefined) logData.used_items = body.used_items;
    if (body.modifications !== undefined) logData.modifications = body.modifications;
    if (body.self_rating !== undefined) logData.self_rating = body.self_rating;
    if (body.mood !== undefined) logData.mood = body.mood;
    if (body.occasion !== undefined) logData.occasion = body.occasion;
    if (body.weather !== undefined) logData.weather = body.weather;
    if (body.user_note !== undefined) logData.user_note = body.user_note;
    if (body.photos !== undefined) logData.photos = body.photos;
    if (body.preview_image_url !== undefined) logData.preview_image_url = body.preview_image_url;
    if (body.auto_tags !== undefined) logData.auto_tags = body.auto_tags;

    if (existing.exists) {
      await docRef.update(logData);
    } else {
      logData.created_at = now;
      // Set defaults for array fields
      logData.used_items ??= [];
      logData.modifications ??= [];
      logData.photos ??= [];
      logData.auto_tags ??= [];
      await docRef.set(logData);
    }

    return NextResponse.json({ success: true, id: date }, { status: existing.exists ? 200 : 201 });
  } catch (error) {
    console.error('POST /api/beauty-log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
