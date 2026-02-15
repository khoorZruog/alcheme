// POST /api/inventory/scan — 画像をスキャンしてコスメ情報を抽出
// Week 4: ADK Agent Server 経由で実接続

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/api/auth';
import { callAgent } from '@/lib/api/agent-client';
import { CATEGORY_EN_TO_JA, TEXTURE_EN_TO_JA, ITEM_TYPE_PAO, CATEGORY_DEFAULT_ITEM_TYPE } from '@/lib/cosme-constants';
import type { CosmeStats, Rarity, CosmeCategory, CosmeTexture } from '@/types/inventory';

function calculateRarity(stats: CosmeStats): Rarity {
  const total = stats.pigment + stats.longevity + stats.shelf_life + stats.natural_finish;
  if (total >= 17) return "SSR";
  if (total >= 14) return "SR";
  if (total >= 10) return "R";
  return "N";
}

/** Normalize category: accept both old English and new Japanese */
function normalizeCategory(raw: unknown): CosmeCategory {
  const s = String(raw || "");
  if (s in CATEGORY_EN_TO_JA) return CATEGORY_EN_TO_JA[s];
  const valid: CosmeCategory[] = ["ベースメイク", "アイメイク", "リップ", "スキンケア", "その他"];
  return valid.includes(s as CosmeCategory) ? (s as CosmeCategory) : "その他";
}

/** Normalize texture: accept both old English and new Japanese */
function normalizeTexture(raw: unknown): CosmeTexture {
  const s = String(raw || "");
  if (s in TEXTURE_EN_TO_JA) return TEXTURE_EN_TO_JA[s] as CosmeTexture;
  const valid: CosmeTexture[] = ["マット", "ツヤ", "サテン", "シマー", "クリーム", "パウダー", "リキッド"];
  return valid.includes(s as CosmeTexture) ? (s as CosmeTexture) : "クリーム";
}

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Support both multi-image and single-image
    let images: { base64: string; mime_type: string }[] = [];
    if (body.images && Array.isArray(body.images)) {
      images = body.images;
    } else if (body.image_base64 && body.image_mime_type) {
      images = [{ base64: body.image_base64, mime_type: body.image_mime_type }];
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 },
      );
    }

    const agentRes = await callAgent('/scan', {
      images,
      user_id: userId,
    });

    // Normalize items from agent response
    const rawItems = (agentRes.items as Record<string, unknown>[]) ?? [];
    const now = new Date().toISOString();

    const items = rawItems.map((item, i) => {
      const stats = item.stats as CosmeStats | undefined;
      const category = normalizeCategory(item.category);
      const itemType = String(item.item_type || CATEGORY_DEFAULT_ITEM_TYPE[category] || "その他");
      const paoEntry = ITEM_TYPE_PAO[itemType];

      // Rakuten enrichment data
      const candidates = Array.isArray(item.candidates) ? item.candidates : undefined;
      const hasRakuten = !!(item.price || item.product_url || candidates?.length);

      return {
        id: (item.id as string) || `scan-${Date.now()}-${i}`,
        category,
        item_type: itemType,
        pao_months: (item.pao_months as number) ?? paoEntry?.pao_months ?? null,
        brand: item.brand || "不明",
        product_name: item.product_name || "不明",
        color_code: item.color_code ?? null,
        color_name: item.color_name ?? null,
        color_description: item.color_description || "",
        texture: normalizeTexture(item.texture),
        stats: stats ?? null,
        rarity: (item.rarity as Rarity) || (stats ? calculateRarity(stats) : "N"),
        estimated_remaining: item.estimated_remaining || "50%",
        price: (item.price as number) ?? undefined,
        product_url: (item.product_url as string) ?? undefined,
        rakuten_image_url: (item.rakuten_image_url as string) ?? undefined,
        candidates,
        confidence: item.confidence || "medium",
        source: hasRakuten ? "画像認識 + 楽天API" : "画像認識",
        created_at: (item.created_at as string) || now,
        updated_at: now,
      };
    });

    return NextResponse.json({ success: true, items, count: items.length });
  } catch (error) {
    console.error('POST /api/inventory/scan error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAgentDown = message.includes('fetch failed') || message.includes('ECONNREFUSED');

    // Pass through actual error detail for debugging
    let errorMsg = 'Internal Server Error';
    if (isAgentDown) {
      errorMsg = 'Agent server unavailable';
    } else if (message.includes('Agent responded with')) {
      errorMsg = message.length > 200 ? message.slice(0, 200) : message;
    }

    return NextResponse.json(
      {
        success: false,
        items: [],
        error: errorMsg,
      },
      { status: isAgentDown ? 503 : 500 },
    );
  }
}
