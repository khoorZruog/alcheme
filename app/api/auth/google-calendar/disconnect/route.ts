// DELETE /api/auth/google-calendar/disconnect — カレンダー連携解除
//
// トークンを Google に revoke し、Firestore から連携情報を削除。

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import { revokeToken } from "@/lib/api/google-calendar";
import { FieldValue } from "firebase-admin/firestore";

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read current tokens
    const doc = await adminDb.collection("users").doc(userId).get();
    const cal = doc.data()?.calendarIntegration;

    if (cal) {
      // Best-effort revoke (ignore failures)
      if (cal.accessToken) {
        await revokeToken(cal.accessToken).catch(() => {});
      }
      if (cal.refreshToken) {
        await revokeToken(cal.refreshToken).catch(() => {});
      }
    }

    // Remove integration data from Firestore
    await adminDb.collection("users").doc(userId).update({
      calendarIntegration: FieldValue.delete(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar disconnect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
