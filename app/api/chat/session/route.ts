// DELETE /api/chat/session — Reset chat session

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgent } from "@/lib/api/agent-client";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await callAgent("/chat/session/delete", { user_id: userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chat/session error:", error);
    return NextResponse.json({ error: "Failed to reset session" }, { status: 500 });
  }
}
