// POST /api/admin/reset — 全ユーザーデータ + カタログ + ソーシャルを一括削除
// ⚠ 開発用。本番では削除すること。

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';

/** Firestore のコレクション内ドキュメントを全削除（バッチ処理） */
async function deleteCollection(ref: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query) {
  const batchSize = 400;
  let deleted = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await ref.limit(batchSize).get();
    if (snap.empty) break;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
  }

  return deleted;
}

/** サブコレクションの全ドキュメントを再帰的に削除 */
async function deleteSubcollections(docRef: FirebaseFirestore.DocumentReference) {
  const subcollections = await docRef.listCollections();
  for (const sub of subcollections) {
    // First delete any sub-subcollections
    const docs = await sub.get();
    for (const doc of docs.docs) {
      await deleteSubcollections(doc.ref);
    }
    await deleteCollection(sub);
  }
}

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, number> = {};

  try {
    // 1. User subcollections
    const userRef = adminDb.collection('users').doc(userId);
    const userSubcollections = [
      'inventory', 'products', 'recipes', 'beauty_logs',
      'conversations', 'suggested_items',
    ];

    for (const name of userSubcollections) {
      // Delete sub-subcollections first (e.g. conversations/{id}/messages)
      const colRef = userRef.collection(name);
      const docs = await colRef.get();
      for (const doc of docs.docs) {
        await deleteSubcollections(doc.ref);
      }
      results[name] = await deleteCollection(colRef);
    }

    // 2. Global catalog
    results.catalog = await deleteCollection(adminDb.collection('catalog'));

    // 3. Social: posts, comments, likes, follows, user_stats
    // Posts
    const postsRef = adminDb.collection('social').doc('posts').collection('items');
    results['social/posts'] = await deleteCollection(postsRef);

    // Comments (nested: social/comments/{postId}/items/list/...)
    await deleteSubcollections(adminDb.collection('social').doc('comments'));
    results['social/comments'] = -1; // recursive, count unavailable

    // Likes (nested: social/likes/{postId}/users/items/...)
    await deleteSubcollections(adminDb.collection('social').doc('likes'));
    results['social/likes'] = -1;

    // Follows
    const followsDoc = adminDb.collection('social').doc('follows');
    await deleteSubcollections(followsDoc);
    results['social/follows'] = -1;

    // User stats
    const statsRef = adminDb.collection('social').doc('user_stats').collection('items');
    results['social/user_stats'] = await deleteCollection(statsRef);

    // 4. Reset user profile counters (keep the user doc itself)
    await userRef.update({
      inventory_count: 0,
      recipe_count: 0,
    }).catch(() => { /* field may not exist */ });

    return NextResponse.json({
      success: true,
      message: 'All data has been reset',
      deleted: results,
    });
  } catch (error) {
    console.error('POST /api/admin/reset error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
