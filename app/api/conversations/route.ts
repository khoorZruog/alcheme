// GET /api/conversations — List user's conversations
// POST /api/conversations — Create a new conversation

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { timestampToString } from "@/lib/firebase/firestore-helpers";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .orderBy("updated_at", "desc")
      .limit(50)
      .get();

    const conversations = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || "",
        created_at: timestampToString(d.created_at),
        updated_at: timestampToString(d.updated_at),
        message_count: d.message_count || 0,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title } = await request.json();
    const now = Timestamp.now();

    const docRef = await adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .add({
        title: title || "新しいチャット",
        created_at: now,
        updated_at: now,
        message_count: 0,
      });

    return NextResponse.json({
      id: docRef.id,
      title: title || "新しいチャット",
      created_at: timestampToString(now),
      updated_at: timestampToString(now),
      message_count: 0,
    });
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
