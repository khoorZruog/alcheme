// POST /api/conversations/[id]/messages — Save a message

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { timestampToString } from "@/lib/firebase/firestore-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: conversationId } = await params;
    const body = await request.json();
    const { role, content, image_url, preview_image_url, agent_used, data } = body;

    if (!role || !["user", "assistant"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const now = Timestamp.now();
    const convRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .doc(conversationId);

    // Save message
    const msgData: Record<string, unknown> = {
      role,
      content: content || "",
      created_at: now,
    };
    if (image_url) msgData.image_url = image_url;
    if (preview_image_url) msgData.preview_image_url = preview_image_url;
    if (agent_used) msgData.agent_used = agent_used;
    if (data) msgData.data = data;

    const msgRef = await convRef.collection("messages").add(msgData);

    // Update parent conversation
    await convRef.update({
      updated_at: now,
      message_count: FieldValue.increment(1),
    });

    return NextResponse.json({
      id: msgRef.id,
      role,
      content: content || "",
      created_at: timestampToString(now),
    });
  } catch (error) {
    console.error("POST /api/conversations/[id]/messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
