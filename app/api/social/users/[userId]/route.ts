import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { adminDb } from '@/lib/firebase/admin';
import { calcAgeRange } from '@/lib/calc-age-range';

/** GET /api/social/users/[userId] — Public user profile + social stats + follow status */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = await getAuthUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Read user profile
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const profile = userDoc.data()!;
    const visibility = profile.profileVisibility || {};

    // Read social stats
    const statsDoc = await adminDb
      .collection('social')
      .doc('user_stats')
      .collection('items')
      .doc(userId)
      .get();
    const stats = statsDoc.exists
      ? statsDoc.data()!
      : { post_count: 0, follower_count: 0, following_count: 0 };

    // Check follow status
    let isFollowing = false;
    if (currentUserId !== userId) {
      const followDoc = await adminDb
        .collection('social')
        .doc('follows')
        .collection(currentUserId)
        .doc('following')
        .collection('users')
        .doc(userId)
        .get();
      isFollowing = followDoc.exists;
    }

    // Compute age range from birthDate
    const birthDate = profile.birthDate?.replace(/\//g, "-") ?? "";
    const ageRange = birthDate ? calcAgeRange(birthDate) : null;

    // Fetch best cosme items
    let bestCosmeItems: Array<{ id: string; product_name: string; brand: string; image_url?: string }> = [];
    const bestCosmeIds: string[] = profile.bestCosme || [];
    if (bestCosmeIds.length > 0) {
      const inventorySnaps = await Promise.all(
        bestCosmeIds.slice(0, 10).map((itemId: string) =>
          adminDb.collection('users').doc(userId).collection('inventory').doc(itemId).get()
        )
      );
      for (const snap of inventorySnaps) {
        if (snap.exists) {
          const d = snap.data()!;
          bestCosmeItems.push({
            id: snap.id,
            product_name: d.product_name || '',
            brand: d.brand || '',
            image_url: d.image_url || d.rakuten_image_url || undefined,
          });
        }
      }
    }

    // Build public profile (respect visibility settings)
    const publicProfile = {
      user_id: userId,
      display_name: profile.displayName || profile.display_name || '',
      photo_url: profile.photoURL || profile.photo_url || null,
      bio: profile.bio || null,
      personal_color: visibility.personalColor !== false ? (profile.personalColor || null) : null,
      skin_type: visibility.skinType !== false ? (profile.skinType || null) : null,
      interests: visibility.interests !== false ? (profile.interests || []) : [],
      stats: {
        post_count: stats.post_count || 0,
        follower_count: stats.follower_count || 0,
        following_count: stats.following_count || 0,
        total_likes_received: stats.total_likes_received || 0,
      },
      is_following: isFollowing,
      gender: visibility.gender !== false ? (profile.gender || null) : null,
      age_range: visibility.ageRange !== false ? ageRange : null,
      skin_tone: visibility.skinTone !== false ? (profile.skinTone || null) : null,
      face_type: profile.faceType || null,
      concerns: visibility.interests !== false ? (profile.concerns || []) : [],
      social_links: profile.socialLinks || undefined,
      best_cosme: bestCosmeItems.length > 0 ? bestCosmeItems : undefined,
    };

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error('GET /api/social/users/[userId] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
