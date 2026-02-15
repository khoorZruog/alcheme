// POST /api/inventory/seed — テスト用コスメ在庫データを一括投入
// ブラウザからログイン状態で POST /api/inventory/seed を叩くと投入される

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getAuthUserId } from '@/lib/api/auth';
import { Timestamp } from 'firebase-admin/firestore';

const SEED_ITEMS = [
  // ===== ベースメイク =====
  {
    category: "ベースメイク",
    item_type: "リキッドファンデーション",
    brand: "NARS",
    product_name: "ナチュラルラディアント ロングウェア ファンデーション",
    color_code: "GOBI",
    color_name: "ゴビ",
    color_description: "明るめのイエローベース、自然なツヤ肌仕上がり",
    texture: "リキッド",
    stats: { pigment: 4, longevity: 5, shelf_life: 4, natural_finish: 3 },
    estimated_remaining: "60%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "ベースメイク",
    item_type: "パウダーファンデーション",
    brand: "MAQuillAGE",
    product_name: "ドラマティックパウダリー EX",
    color_code: "OC10",
    color_name: "オークル10",
    color_description: "やや明るめのオークル、きめ細やかなマット仕上がり",
    texture: "パウダー",
    stats: { pigment: 3, longevity: 4, shelf_life: 5, natural_finish: 4 },
    estimated_remaining: "40%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "ベースメイク",
    item_type: "化粧下地",
    brand: "PAUL & JOE",
    product_name: "モイスチュアライジング ファンデーション プライマー S",
    color_code: "01",
    color_name: "ドラジェ",
    color_description: "ほんのりピンクの透明感ベース",
    texture: "クリーム",
    stats: { pigment: 2, longevity: 3, shelf_life: 4, natural_finish: 5 },
    estimated_remaining: "80%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "ベースメイク",
    item_type: "コンシーラー",
    brand: "the SAEM",
    product_name: "カバーパーフェクション チップコンシーラー",
    color_code: "1.5",
    color_name: "ナチュラルベージュ",
    color_description: "自然なベージュ、クマ・シミをしっかりカバー",
    texture: "リキッド",
    stats: { pigment: 5, longevity: 3, shelf_life: 4, natural_finish: 3 },
    estimated_remaining: "30%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },

  // ===== アイメイク =====
  {
    category: "アイメイク",
    item_type: "アイシャドウパレット",
    brand: "LUNASOL",
    product_name: "スキンモデリングアイズ",
    color_code: "01",
    color_name: "Beige Beige",
    color_description: "肌に溶け込むベージュ系4色パレット、上品なグラデーション",
    texture: "パウダー",
    stats: { pigment: 4, longevity: 4, shelf_life: 5, natural_finish: 5 },
    estimated_remaining: "70%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "アイメイク",
    item_type: "アイシャドウパレット",
    brand: "ADDICTION",
    product_name: "ザ アイシャドウ パレット",
    color_code: "008",
    color_name: "Thousand Nights",
    color_description: "深みのあるボルドー×ゴールドの秋冬パレット",
    texture: "シマー",
    stats: { pigment: 5, longevity: 4, shelf_life: 4, natural_finish: 2 },
    estimated_remaining: "90%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "アイメイク",
    item_type: "マスカラ",
    brand: "HEROINE MAKE",
    product_name: "ロング&カールマスカラ アドバンストフィルム",
    color_code: null,
    color_name: null,
    color_description: "漆黒ブラック、お湯落ちタイプのロング繊維マスカラ",
    texture: "リキッド",
    stats: { pigment: 4, longevity: 5, shelf_life: 3, natural_finish: 3 },
    estimated_remaining: "50%",
    pao_months: 6,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "アイメイク",
    item_type: "アイライナー",
    brand: "UZU BY FLOWFUSHI",
    product_name: "アイオープニングライナー",
    color_code: undefined,
    color_name: "ブラウンブラック",
    color_description: "柔らかなブラウンブラック、にじみにくいリキッドタイプ",
    texture: "リキッド",
    stats: { pigment: 5, longevity: 5, shelf_life: 3, natural_finish: 4 },
    estimated_remaining: "40%",
    pao_months: 6,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "アイメイク",
    item_type: "アイブロウ",
    brand: "excel",
    product_name: "パウダー&ペンシル アイブロウEX",
    color_code: "PD02",
    color_name: "キャメルブラウン",
    color_description: "自然な眉を描けるペンシル+パウダー+ブラシの3in1",
    texture: "パウダー",
    stats: { pigment: 3, longevity: 4, shelf_life: 4, natural_finish: 5 },
    estimated_remaining: "20%",
    pao_months: 18,
    confidence: "high",
    source: "テストデータ",
  },

  // ===== リップ =====
  {
    category: "リップ",
    item_type: "口紅",
    brand: "KATE",
    product_name: "リップモンスター",
    color_code: "03",
    color_name: "陽炎",
    color_description: "透け感のあるコーラルオレンジ、ティントタイプで色持ち抜群",
    texture: "サテン",
    stats: { pigment: 5, longevity: 5, shelf_life: 4, natural_finish: 3 },
    estimated_remaining: "60%",
    pao_months: 18,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "リップ",
    item_type: "口紅",
    brand: "rom&nd",
    product_name: "ジューシーラスティングティント",
    color_code: "06",
    color_name: "フィグフィグ",
    color_description: "深みのあるフィグカラー、みずみずしいツヤ感",
    texture: "ツヤ",
    stats: { pigment: 5, longevity: 4, shelf_life: 3, natural_finish: 3 },
    estimated_remaining: "70%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "リップ",
    item_type: "リップグロス",
    brand: "Dior",
    product_name: "アディクト リップ マキシマイザー",
    color_code: "001",
    color_name: "ピンク",
    color_description: "ぷっくりボリュームアップ、ほんのりピンクのプランピンググロス",
    texture: "ツヤ",
    stats: { pigment: 2, longevity: 3, shelf_life: 4, natural_finish: 4 },
    estimated_remaining: "50%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "リップ",
    item_type: "リップクリーム",
    brand: "CANMAKE",
    product_name: "ステイオンバームルージュ",
    color_code: "T03",
    color_name: "ルビーカーネーション",
    color_description: "シアーな発色のティントタイプ、保湿力あり",
    texture: "クリーム",
    stats: { pigment: 3, longevity: 3, shelf_life: 5, natural_finish: 5 },
    estimated_remaining: "80%",
    pao_months: 18,
    confidence: "high",
    source: "テストデータ",
  },

  // ===== スキンケア =====
  {
    category: "スキンケア",
    item_type: "化粧水",
    brand: "IPSA",
    product_name: "ザ・タイムR アクア",
    color_code: null,
    color_name: null,
    color_description: "みずみずしいテクスチャーの薬用化粧水、毛穴ケアにも",
    texture: "リキッド",
    stats: { pigment: 1, longevity: 4, shelf_life: 4, natural_finish: 5 },
    estimated_remaining: "30%",
    pao_months: 12,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "スキンケア",
    item_type: "美容液",
    brand: "LANCOME",
    product_name: "ジェニフィック アドバンスト N",
    color_code: null,
    color_name: null,
    color_description: "美肌菌に着目した導入美容液、ハリ・ツヤアップ",
    texture: "リキッド",
    stats: { pigment: 1, longevity: 5, shelf_life: 5, natural_finish: 5 },
    estimated_remaining: "60%",
    pao_months: 6,
    confidence: "high",
    source: "テストデータ",
  },

  // ===== その他 =====
  {
    category: "その他",
    item_type: "チーク",
    brand: "CLINIQUE",
    product_name: "チーク ポップ",
    color_code: "15",
    color_name: "パンジー ポップ",
    color_description: "鮮やかなベリーピンク、ガーベラ型のかわいいチーク",
    texture: "パウダー",
    stats: { pigment: 4, longevity: 4, shelf_life: 5, natural_finish: 4 },
    estimated_remaining: "70%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "その他",
    item_type: "ハイライター",
    brand: "MAC",
    product_name: "ミネラライズ スキンフィニッシュ",
    color_code: undefined,
    color_name: "ライトスカペード",
    color_description: "繊細なシャンパンゴールドの煌めき、肌に溶け込むハイライト",
    texture: "シマー",
    stats: { pigment: 3, longevity: 4, shelf_life: 5, natural_finish: 4 },
    estimated_remaining: "80%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
  {
    category: "その他",
    item_type: "フェイスパウダー",
    brand: "CEZANNE",
    product_name: "うるふわ仕上げパウダー",
    color_code: "01",
    color_name: "ルーセントベージュ",
    color_description: "ふんわりセミマット肌、皮脂崩れを防ぐプチプラパウダー",
    texture: "パウダー",
    stats: { pigment: 2, longevity: 4, shelf_life: 5, natural_finish: 5 },
    estimated_remaining: "50%",
    pao_months: 24,
    confidence: "high",
    source: "テストデータ",
  },
];

export async function POST() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const colRef = adminDb.collection('users').doc(userId).collection('inventory');
    const now = Timestamp.now();
    const savedIds: string[] = [];

    for (const item of SEED_ITEMS) {
      // Strip null/undefined values to avoid Firestore errors
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(item)) {
        if (v != null) cleaned[k] = v;
      }
      const docRef = colRef.doc();
      await docRef.set({
        ...cleaned,
        created_at: now,
        updated_at: now,
      });
      savedIds.push(docRef.id);
    }

    return NextResponse.json(
      { success: true, ids: savedIds, count: savedIds.length },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/inventory/seed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
