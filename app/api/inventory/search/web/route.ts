// POST /api/inventory/search/web — Web検索でコスメ商品を検索（エージェント経由）

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgent } from "@/lib/api/agent-client";

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { keyword } = await request.json();
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { error: "keyword is required" },
        { status: 400 }
      );
    }

    const data = await callAgent("/search/product", {
      keyword,
      user_id: userId,
    });

    return NextResponse.json({
      success: data.success ?? true,
      results: data.results ?? [],
      count: data.count ?? 0,
    });
  } catch (error) {
    console.error("POST /api/inventory/search/web error:", error);
    return NextResponse.json(
      { error: "Web search failed. Agent server may be unavailable." },
      { status: 502 }
    );
  }
}
