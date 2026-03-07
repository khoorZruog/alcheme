// PATCH /api/themes/[themeId] — テーマステータス更新

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgent } from "@/lib/api/agent-client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ themeId: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { themeId } = await params;
    const body = await request.json();
    const { status, recipe_id } = body;

    if (!status || !["liked", "skipped"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'liked' or 'skipped'" },
        { status: 400 }
      );
    }

    const result = await callAgent("/theme-status", {
      theme_id: themeId,
      user_id: userId,
      status,
      ...(recipe_id ? { recipe_id } : {}),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /api/themes/[themeId] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
