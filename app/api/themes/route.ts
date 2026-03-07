// POST /api/themes — テーマ提案を生成

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgent } from "@/lib/api/agent-client";

export const maxDuration = 60;

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await callAgent("/suggest-themes", {
      user_id: userId,
    });

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.error || "Theme generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/themes error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
