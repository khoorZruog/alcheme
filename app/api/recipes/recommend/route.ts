// GET /api/recipes/recommend?weather=晴れ&exclude=id1,id2
// BFF-only recipe recommendation — no agent server needed.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthUserId } from "@/lib/api/auth";
import { timestampToString } from "@/lib/firebase/firestore-helpers";
import { recommendRecipe } from "@/lib/recipe-recommendation";
import type { Recipe } from "@/types/recipe";

export async function GET(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const weather = request.nextUrl.searchParams.get("weather");
    const excludeParam = request.nextUrl.searchParams.get("exclude");
    const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

    // Fetch all user recipes (same pattern as /api/recipes GET)
    const snapshot = await adminDb
      .collection("users")
      .doc(userId)
      .collection("recipes")
      .get();

    const recipes: Recipe[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const ts = data.created_at ?? data.createdAt;
      return {
        id: doc.id,
        recipe_name: data.recipe_name ?? data.title ?? "メイクレシピ",
        user_request: data.user_request ?? "",
        is_favorite: data.is_favorite ?? false,
        steps: data.steps ?? [],
        thinking_process: data.thinking_process ?? [],
        pro_tips: data.pro_tips ?? [],
        match_score: data.match_score,
        context: data.context,
        preview_image_url: data.preview_image_url,
        character_theme: data.character_theme,
        feedback: data.feedback,
        source: data.source,
        created_at: ts ? timestampToString(ts) : new Date().toISOString(),
      };
    });

    const result = recommendRecipe(recipes, weather, excludeIds);

    if (!result) {
      return NextResponse.json({ recipe: null, score: 0, reasons: [] });
    }

    return NextResponse.json({
      recipe: result.recipe,
      score: result.score,
      reasons: result.reasons,
    });
  } catch (error) {
    console.error("GET /api/recipes/recommend error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
