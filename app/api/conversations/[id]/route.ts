// GET /api/conversations/[id] — Get conversation with messages
// PATCH /api/conversations/[id] — Update conversation title
// DELETE /api/conversations/[id] — Delete conversation

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { adminDb } from "@/lib/firebase/admin";
import { timestampToString } from "@/lib/firebase/firestore-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const convRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .doc(id);

    const convDoc = await convRef.get();
    if (!convDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const convData = convDoc.data()!;
    const messagesSnap = await convRef
      .collection("messages")
      .orderBy("created_at", "asc")
      .get();

    const messages = messagesSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        role: d.role,
        content: d.content || "",
        image_url: d.image_url || undefined,
        preview_image_url: d.preview_image_url || undefined,
        agent_used: d.agent_used || undefined,
        data: d.data || undefined,
        created_at: timestampToString(d.created_at),
      };
    });

    return NextResponse.json({
      conversation: {
        id: convDoc.id,
        title: convData.title || "",
        created_at: timestampToString(convData.created_at),
        updated_at: timestampToString(convData.updated_at),
        message_count: convData.message_count || 0,
      },
      messages,
    });
  } catch (error) {
    console.error("GET /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { title } = await request.json();

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .doc(id)
      .update({ title });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const convRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .doc(id);

    // Delete all messages in subcollection
    const messagesSnap = await convRef.collection("messages").get();
    const batch = adminDb.batch();
    for (const doc of messagesSnap.docs) {
      batch.delete(doc.ref);
    }
    batch.delete(convRef);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
