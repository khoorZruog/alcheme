// POST /api/recipes/backfill-themes — 既存レシピにテーマフィールドを付与 + theme_suggestions マイグレーション

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthUserId } from "@/lib/api/auth";

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRef = adminDb.collection("users").doc(userId);
    let backfilledRecipes = 0;

    // Phase 1 (theme_suggestions → recipes migration) removed — completed in ARCH-004.
    // theme_suggestions collection is now deprecated.

    // --- Backfill recipes that lack theme fields ---
    const recipesSnap = await userRef.collection("recipes").get();

    for (const recipeDoc of recipesSnap.docs) {
      const data = recipeDoc.data();
      // Skip if already has theme fields or is a theme-only entry
      if (data.theme_title || data.source === "theme") continue;

      const keywords: string[] = [];
      if (data.context?.occasion) keywords.push(data.context.occasion as string);
      if (data.character_theme) keywords.push(data.character_theme as string);

      // Extract keywords from recipe_name
      const name = ((data.recipe_name ?? "") as string);
      const adjectives = [
        "ナチュラル", "大人", "可愛い", "クール", "透明感", "ツヤ", "マット",
        "韓国", "オフィス", "デート", "カジュアル", "フェミニン", "エレガント",
      ];
      for (const adj of adjectives) {
        if (name.includes(adj) && !keywords.includes(adj)) keywords.push(adj);
      }

      // Extract from alchemist "theme" field (e.g. "大人っぽい × デート")
      if (data.theme) {
        const parts = (data.theme as string).split(/[×・、,\s]+/).filter(Boolean);
        keywords.push(...parts.filter((p: string) => !keywords.includes(p)));
      }

      await recipeDoc.ref.update({
        theme_title: data.recipe_name ?? data.title ?? "メイクレシピ",
        theme_description: data.user_request ?? "",
        style_keywords: keywords,
        theme_status: "liked",
        theme_context: {},
      });
      backfilledRecipes++;
    }

    return NextResponse.json({
      success: true,
      backfilled_recipes: backfilledRecipes,
    });
  } catch (error) {
    console.error("POST /api/recipes/backfill-themes error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
