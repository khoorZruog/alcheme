/**
 * Reset all user data, catalog, and social data.
 * Usage: npx tsx scripts/reset-data.ts
 *
 * Uses Application Default Credentials (ADC).
 * Run `gcloud auth application-default login` first if needed.
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'alcheme-c36ef',
});
const db = getFirestore(app);

async function deleteCollection(ref: FirebaseFirestore.CollectionReference | FirebaseFirestore.Query) {
  const batchSize = 400;
  let deleted = 0;

  for (;;) {
    const snap = await ref.limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snap.size;
  }
  return deleted;
}

async function deleteSubcollections(docRef: FirebaseFirestore.DocumentReference) {
  const subs = await docRef.listCollections();
  for (const sub of subs) {
    const docs = await sub.get();
    for (const doc of docs.docs) {
      await deleteSubcollections(doc.ref);
    }
    await deleteCollection(sub);
  }
}

async function main() {
  // Find all users (should be few in dev)
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} user(s)`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const displayName = userDoc.data().display_name || uid;
    console.log(`\nResetting user: ${displayName} (${uid})`);

    const userRef = db.collection('users').doc(uid);
    const subcollections = [
      'inventory', 'products', 'recipes', 'beauty_logs',
      'conversations', 'suggested_items',
    ];

    for (const name of subcollections) {
      const colRef = userRef.collection(name);
      // Delete sub-subcollections first
      const docs = await colRef.get();
      for (const doc of docs.docs) {
        await deleteSubcollections(doc.ref);
      }
      const count = await deleteCollection(colRef);
      if (count > 0) console.log(`  ${name}: ${count} deleted`);
    }

    // Reset counters on user doc
    await userRef.update({
      inventory_count: 0,
      recipe_count: 0,
    }).catch(() => {});
  }

  // Global catalog
  const catalogCount = await deleteCollection(db.collection('catalog'));
  console.log(`\ncatalog: ${catalogCount} deleted`);

  // Social collections
  console.log('\nClearing social data...');
  const socialDocNames = ['posts', 'comments', 'likes', 'follows', 'user_stats'];
  for (const name of socialDocNames) {
    const docRef = db.collection('social').doc(name);
    await deleteSubcollections(docRef);
    console.log(`  social/${name}: cleared`);
  }

  console.log('\n✅ Reset complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
