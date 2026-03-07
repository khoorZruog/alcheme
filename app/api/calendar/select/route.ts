// PATCH /api/calendar/select — 取得対象カレンダーの選択を保存

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function PATCH(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { selectedCalendars } = (await request.json()) as {
      selectedCalendars: string[];
    };

    if (!Array.isArray(selectedCalendars)) {
      return NextResponse.json(
        { error: "selectedCalendars must be an array" },
        { status: 400 },
      );
    }

    // Verify calendar is connected
    const doc = await adminDb.collection("users").doc(userId).get();
    const cal = doc.data()?.calendarIntegration;
    if (!cal?.connected) {
      return NextResponse.json(
        { error: "Calendar not connected" },
        { status: 400 },
      );
    }

    await adminDb.collection("users").doc(userId).update({
      "calendarIntegration.selectedCalendars": selectedCalendars,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Calendar select error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
