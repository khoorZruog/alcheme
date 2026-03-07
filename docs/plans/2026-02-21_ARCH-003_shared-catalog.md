# ARCH-003: 共有商品カタログの実装

## Context

現在、商品マスタ（`users/{userId}/products/`）はユーザーごとに独立。ユーザーAが登録した「KATE リップモンスター 03」の情報はユーザーBには共有されず、毎回同じ商品を一から登録する必要がある。

**目的**: ブランド名、商品名、カテゴリ、色、テクスチャ等の**普遍的な商品情報**をユーザー横断で共有し、登録の手間を最小化する。在庫（残量、購入日、個人的な評価）は引き続きユーザーごとに管理。

**設計方針**: カタログは独立した画面を持たず、**UXの中に自然に溶け込むインフラ**として実装。将来のSNS強化・ランキング機能の基盤にもなる。

## アプローチ

既存の2層構造（`products/` + `inventory/`）はそのままに、グローバルな `catalog/` コレクションを追加する**加算的な変更**。

```
catalog/{catalogId}                ← NEW: グローバル共有商品情報
    ↑ catalog_id (optional FK)
users/{uid}/products/{pid}         ← 既存: ユーザー個人の評価（stats, rarity, confidence）
    ↑ product_id (既存 FK)
users/{uid}/inventory/{iid}        ← 既存: 在庫個体（残量, 購入日）
```

---

## Batch 1: データ層（型定義 + カタログ upsert ヘルパー + Firestore ルール）

### 1-1. 型定義: `types/catalog.ts`（新規）

```typescript
export interface CatalogEntry {
  id: string;
  brand: string;
  brand_normalized: string;         // 検索用（lowercase）
  product_name: string;
  product_name_normalized: string;  // 検索用（lowercase）
  category?: CosmeCategory;
  item_type?: string;
  color_code?: string;
  color_name?: string;
  color_description?: string;
  texture?: CosmeTexture;
  pao_months?: number;
  image_url?: string;               // AI加工済み商品画像
  rakuten_image_url?: string;
  price?: number;
  product_url?: string;
  contributor_count: number;        // 登録ユーザー数
  created_at: string;
  updated_at: string;
}
```

### 1-2. カタログ upsert ヘルパー: `lib/api/catalog-upsert.ts`（新規）

- `catalogDocId(brand, productName, colorCode?)` — SHA-256 の先頭20文字で決定的ID生成
  - O(1) でドキュメント取得可能（クエリ不要）
  - 同一商品なら同一ID（冪等な upsert）
- `upsertCatalogEntry(productFields)` — カタログの作成 or マージ更新
  - **新規**: 全フィールドセット + `contributor_count = 1`
  - **既存**: null/空フィールドのみ補完 + `contributor_count` インクリメント（既存の非null値は上書きしない）

**カタログに含めるフィールド**（普遍的情報）:
brand, product_name, category, item_type, color_code, color_name, color_description, texture, pao_months, price, product_url, image_url, rakuten_image_url

**カタログに含めないフィールド**（個人的評価）:
stats, rarity, confidence, source, images（ユーザーの撮影写真）

### 1-3. Python 側カタログヘルパー: `agent/alcheme/tools/catalog_tools.py`（新規）

- `_catalog_doc_id()` — TypeScript 版と同一のハッシュロジック
- `upsert_catalog()` — 同一のマージセマンティクス

### 1-4. Firestore セキュリティルール: `firestore.rules`

L63（catch-all deny の前）に追加:
```
match /catalog/{catalogId} {
  allow read: if request.auth != null;
  allow write: if false;  // Admin SDK (API routes) のみ書き込み可
}
```

### 1-5. Product 型にカタログ参照追加: `types/inventory.ts`

`Product` interface に `catalog_id?: string` フィールドを追加。

### テスト
- `__tests__/unit/lib/catalog-upsert.test.ts`（新規）— ID 決定性、大小文字不感、マージ挙動
- `agent/tests/test_catalog_tools.py`（新規）— Python 側同等テスト

---

## Batch 2: 既存登録フローへのカタログ upsert 追加

商品を作成する**全コードパス**に `upsertCatalogEntry()` 呼び出しを追加:

| ファイル | 変更箇所 | 説明 |
|---------|---------|------|
| `app/api/inventory/route.ts` | POST L177-182 | 新規 product 作成後に upsert + `catalog_id` セット |
| `app/api/inventory/confirm/route.ts` | POST L97-102 | 同上（スキャン確認フロー） |
| `app/api/products/route.ts` | POST | 同上（直接商品作成） |
| `agent/alcheme/tools/inventory_tools.py` | `add_items_to_inventory` L217-223 | Python 側同等処理 |
| `agent/alcheme/tools/suggestion_tools.py` | `save_suggestion` L93-108 | Next Cosme 追加時もカタログに反映 |

変更パターン（TypeScript）:
```typescript
// 既存: product 作成
const productDoc = productsRef.doc();
await productDoc.set({ ...productFields, created_at: now, updated_at: now });
productId = productDoc.id;

// 追加: カタログ upsert（非同期、失敗してもユーザー登録に影響なし）
const catalogId = await upsertCatalogEntry(productFields);
if (catalogId) {
  await productDoc.update({ catalog_id: catalogId });
}
```

---

## Batch 3: カタログ検索 API + Agent ツール

### 3-1. `GET /api/catalog/search?q=...&limit=10`（新規）

- 認証必須（any authenticated user）
- `brand_normalized` と `product_name_normalized` の prefix match
- 結果をマージ・重複排除して返却
- 最大20件

### 3-2. `GET /api/catalog/[id]`（新規）

- 単一カタログエントリ取得

### 3-3. Agent ツール: `search_catalog` in `catalog_tools.py`

- Python 版の prefix match 検索
- Inventory / Product Search Agent のツールリストに登録

---

## Batch 4: フロントエンド — カタログマッチバナー + 商品検索登録

### 4-1. `hooks/use-catalog-search.ts`（新規）

SWR + debounce (300ms) で `/api/catalog/search` を呼び出し。

### 4-2. `hooks/use-catalog-match.ts`（新規）

商品情報（brand, product_name, color_code）からカタログマッチを自動判定するフック。
```typescript
function useCatalogMatch(brand?: string, productName?: string, colorCode?: string)
  → { match: CatalogEntry | null, isChecking: boolean }
```

### 4-3. カタログマッチバナー: `components/catalog-match-banner.tsx`（新規）

既存4フロー（スキャン確認、楽天選択、Web検索、手動入力）の商品確認画面で、カタログに一致する商品が見つかった場合に表示するバナー:

```
┌─────────────────────────────────────┐
│ ✨ カタログに登録済みの商品です      │
│ KATE リップモンスター #03 陽炎       │
│ [カタログの情報で補完する]           │
└─────────────────────────────────────┘
```

タップするとカタログの値（category, item_type, texture, pao_months, image_url 等）でフォームフィールドを自動補完。

統合箇所:
| ファイル | 統合方法 |
|---------|---------|
| `components/item-edit-sheet.tsx` | バナーをフォーム上部に配置（スキャン・楽天・Web検索の確認画面） |
| `app/(main)/add/manual/page.tsx` | ブランド名・商品名入力後のリアルタイムマッチ |

### 4-4. 登録方法に「みんなの登録商品から検索」を追加

| ファイル | 変更 |
|---------|------|
| `components/add-method-sheet.tsx` | METHODS 配列に「みんなの登録商品から検索」オプション追加（Users icon） |
| `app/(main)/add/community/page.tsx`（新規） | 検索ベースの登録フロー（カタログ検索 → 選択 → 個人情報追加 → 登録） |

「みんなの登録商品から検索」ページの UX:
1. 検索バーでブランド名 or 商品名を入力
2. カタログの候補がリスト表示（画像 + ブランド + 商品名 + 色 + 登録者数）
3. タップすると商品情報がプリフィルされた item-edit-sheet が開く
4. ユーザーは個人的な情報（残量、購入日、memo）を追加して登録

---

## Batch 5: カタログ画像 AI 加工

ユーザーがアップロードした商品写真をAIで加工し、カタログの統一的な商品画像として利用。

### 5-1. Python 画像加工エンドポイント: `agent/server.py` に `/process-image` 追加

処理パイプライン:
1. **背景除去**: `rembg` ライブラリ（U2-Net ベース、Python で動作）
2. **リサイズ・正規化**: Pillow で 512x512 の正方形、白背景、中央配置
3. **Cloud Storage にアップロード**: `catalog-images/{catalogId}.webp` に保存

### 5-2. `POST /api/catalog/process-image`（新規）

TypeScript 側のプロキシエンドポイント:
- ユーザーの商品画像（base64）を受け取り
- Agent の `/process-image` に転送
- 加工済み画像 URL をカタログに `image_url` として保存

### 5-3. カタログ upsert との統合

`upsertCatalogEntry` 内で、カタログエントリに `image_url` がまだない場合かつ商品画像が提供された場合、画像加工を非同期トリガー（カタログ作成自体はブロックしない）。

### 5-4. 依存追加

- Python: `rembg`, `Pillow` を `agent/requirements.txt` に追加
- 注意: `rembg` は初回に U2-Net モデル（約170MB）をダウンロードするため、Docker ビルド時にキャッシュする

---

## Batch 6: マイグレーション

### 6-1. `POST /api/catalog/migrate`（新規）

管理者用エンドポイント（シークレットヘッダーで保護）:
1. 全ユーザーの `products/` を走査
2. 各商品から `catalogDocId` を計算
3. カタログに upsert
4. ユーザーの product に `catalog_id` を設定
5. バッチ処理（400件単位）

### 6-2. コンフリクト解決

- **大小文字**: dedup key は `.trim().toLowerCase()` で正規化
- **マージ戦略**: 先着の非null値を優先。後続ユーザーは空フィールドのみ補完
- **表示名**: catalog の `brand` は最初に登録したユーザーの表記を使用

---

## 変更ファイル一覧

### 新規ファイル
| ファイル | 説明 |
|---------|------|
| `types/catalog.ts` | CatalogEntry 型定義 |
| `lib/api/catalog-upsert.ts` | カタログ upsert ヘルパー（ID生成 + マージ） |
| `agent/alcheme/tools/catalog_tools.py` | Python 側カタログヘルパー + search_catalog ツール |
| `app/api/catalog/search/route.ts` | カタログ検索 API |
| `app/api/catalog/[id]/route.ts` | カタログ単一取得 API |
| `app/api/catalog/process-image/route.ts` | 画像加工プロキシ API |
| `app/api/catalog/migrate/route.ts` | マイグレーション API |
| `hooks/use-catalog-search.ts` | カタログ検索フック |
| `hooks/use-catalog-match.ts` | カタログ自動マッチフック |
| `components/catalog-match-banner.tsx` | マッチ時バナー UI |
| `app/(main)/add/community/page.tsx` | 「みんなの登録商品から検索」ページ |
| `__tests__/unit/lib/catalog-upsert.test.ts` | TypeScript テスト |
| `agent/tests/test_catalog_tools.py` | Python テスト |

### 既存ファイル修正
| ファイル | 変更内容 |
|---------|---------|
| `types/inventory.ts` | Product に `catalog_id?` 追加 |
| `app/api/inventory/route.ts` | POST に catalog upsert 追加 |
| `app/api/inventory/confirm/route.ts` | POST に catalog upsert 追加 |
| `app/api/products/route.ts` | POST に catalog upsert 追加 |
| `agent/alcheme/tools/inventory_tools.py` | `add_items_to_inventory` に catalog upsert 追加 |
| `agent/alcheme/tools/suggestion_tools.py` | `save_suggestion` に catalog upsert 追加 |
| `agent/requirements.txt` | `rembg`, `Pillow` 追加 |
| `firestore.rules` | catalog ルール追加（L63 の前） |
| `components/add-method-sheet.tsx` | 「みんなの登録商品から検索」オプション追加 |
| `components/item-edit-sheet.tsx` | CatalogMatchBanner 統合 |
| `app/(main)/add/manual/page.tsx` | CatalogMatchBanner 統合 |

---

## 検証手順

1. **型チェック**: `npx tsc --noEmit`
2. **テスト**: `npx vitest run` — 既存テスト全パス + 新規テストパス
3. **Python テスト**: `cd agent && python -m pytest tests/ -v`
4. **手動検証**:
   - ユーザーAで商品登録 → Firestore `catalog/` にドキュメント作成を確認
   - ユーザーBで同じブランド名を入力 → マッチバナーに候補表示
   - ユーザーBがバナーから補完 → フォーム自動入力 → 登録成功
   - 「みんなの登録商品から検索」→ カタログ検索 → 選択 → 登録成功
   - ユーザーAの在庫はユーザーBから見えないことを確認
   - 画像加工: 商品写真アップロード → 背景除去・正規化済み画像がカタログに保存
