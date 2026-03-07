// POST /api/themes/[themeId]/image — テーマ画像生成

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgent } from "@/lib/api/agent-client";

export const maxDuration = 200;

export async function POST(
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
    const { theme } = body;

    if (!theme) {
      return NextResponse.json(
        { error: "theme object is required" },
        { status: 400 }
      );
    }

    const result = await callAgent("/generate-theme-image", {
      theme_id: themeId,
      user_id: userId,
      theme,
    });

    if (result.status === "error") {
      return NextResponse.json(
        { error: result.error || "Image generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image_url: result.image_url,
    });
  } catch (error) {
    console.error("POST /api/themes/[themeId]/image error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
