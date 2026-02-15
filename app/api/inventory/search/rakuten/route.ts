// POST /api/inventory/search/rakuten — 楽天APIでコスメ商品を検索

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";

const RAKUTEN_API_URL =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601";

// Color extraction patterns (ported from agent/alcheme/tools/rakuten_api.py)
const COLOR_PATTERN =
  /(?:#|No\.?|番?)\s*([A-Za-z]?\d{1,3}[A-Za-z]?)\s+([\u3000-\u9FFFぁ-ヶー]+)/;
const COLOR_CODE_ONLY = /(?:^|\s)#?([A-Za-z]?\d{1,3}[A-Za-z]?)(?:\s|$)/;

function extractColorInfo(
  productName: string
): { color_code?: string; color_name?: string } {
  const m = COLOR_PATTERN.exec(productName);
  if (m) return { color_code: m[1], color_name: m[2] };
  const m2 = COLOR_CODE_ONLY.exec(productName);
  if (m2) return { color_code: m2[1] };
  return {};
}

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

    const appId = process.env.RAKUTEN_APP_ID;
    const accessKey = process.env.RAKUTEN_ACCESS_KEY;
    if (!appId || !accessKey) {
      return NextResponse.json(
        { error: "RAKUTEN_APP_ID and RAKUTEN_ACCESS_KEY must be configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      applicationId: appId,
      accessKey,
      keyword,
      hits: "10",
      sort: "standard",
      format: "json",
      formatVersion: "2",
      imageFlag: "1",
    });

    // openapi.rakuten.co.jp requires Referer + IP matching registered domain
    const referer =
      process.env.RAKUTEN_REFERER_URL ||
      "https://alcheme-web-x3hwwomrxa-an.a.run.app/";
    const res = await fetch(`${RAKUTEN_API_URL}?${params}`, {
      headers: {
        Referer: referer,
        Origin: new URL(referer).origin,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Rakuten API error:", res.status, text);
      // Distinguish local dev IP restriction from other errors
      if (res.status === 403 && text.includes("IP address")) {
        return NextResponse.json(
          {
            error:
              "楽天APIはローカル環境では利用できません。デプロイ環境でお試しください。",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Rakuten API request failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const items = (data.Items ?? []) as Record<string, unknown>[];

    const results = items.map((item) => {
      const name = (item.itemName as string) ?? "";
      const images = (item.mediumImageUrls as string[]) ?? [];
      const colorInfo = extractColorInfo(name);
      return {
        name,
        price: (item.itemPrice as number) ?? 0,
        url: (item.itemUrl as string) ?? "",
        shop: (item.shopName as string) ?? "",
        image_url: images[0] ?? "",
        review_count: (item.reviewCount as number) ?? 0,
        review_average: (item.reviewAverage as number) ?? 0,
        ...colorInfo,
      };
    });

    return NextResponse.json({ success: true, results, count: results.length });
  } catch (error) {
    console.error("POST /api/inventory/search/rakuten error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
