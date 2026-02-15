# alche:me — テストシナリオ / 受入条件（Phase 1 MVP）

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-02-14 |
| **Author** | Eri Kaneko (Product Owner) |
| **Status** | Draft |
| **Related** | alcheme_PRD_v4.md, alcheme_design-doc_v1.md §9, CLAUDE_CODE_INSTRUCTIONS_v1_3.md §13/§16, alcheme_prompts-catalog_v3.md §8, alcheme_ui-specs_phase1_v2.md |

> 本ドキュメントは Phase 1 MVP のテストケースを網羅的に定義する。Claude Code がテスト駆動で開発を進めるためのリファレンスであり、品質ゲート（Design Doc §9.4）の達成を検証する。

### Changelog

| Version | Date | 変更内容 |
|---------|------|---------|
| 1.0 | 2026-02-14 | 初版作成。Design Doc §9 テストピラミッドに基づき、Unit / Integration / Agent Eval / API / E2E の全層を網羅。prompts-catalog v3 §8 T1-T17 との対応表を付記。 |

---

## Table of Contents

1. [テスト設計方針](#1-テスト設計方針)
2. [テスト環境・ツール](#2-テスト環境ツール)
3. [品質ゲート（リリースブロッカー）](#3-品質ゲートリリースブロッカー)
4. [Unit Tests — Python Agent Tools](#4-unit-tests--python-agent-tools)
5. [Unit Tests — TypeScript Frontend](#5-unit-tests--typescript-frontend)
6. [Integration Tests — Firebase / Cloud Storage](#6-integration-tests--firebase--cloud-storage)
7. [API Tests — BFF Endpoints](#7-api-tests--bff-endpoints)
8. [Agent Eval — ADK エージェント評価](#8-agent-eval--adk-エージェント評価)
9. [E2E Tests — ユーザーフロー](#9-e2e-tests--ユーザーフロー)
10. [セキュリティテスト](#10-セキュリティテスト)
11. [パフォーマンステスト](#11-パフォーマンステスト)
12. [テストデータ](#12-テストデータ)
13. [prompts-catalog §8 テストシナリオ対応表](#13-prompts-catalog-8-テストシナリオ対応表)
14. [CI/CD パイプライン統合](#14-cicd-パイプライン統合)

---

## 1. テスト設計方針

### 1.1 Design Doc §9 テストピラミッドとの対応

```
              ┌─────────┐
              │  E2E    │  §9 — Playwright
              │  Tests  │  本ドキュメント §9（E2E-01〜E2E-06）
              ├─────────┤
              │  API    │  §7 — Vitest + Supertest
              │  Tests  │  本ドキュメント §7（API-01〜API-19）
           ┌──┴─────────┴──┐
           │  Agent Eval   │  §8 — ADK 組み込み評価 / pytest
           │  (ADK Eval)   │  本ドキュメント §8（AGT-01〜AGT-17）
        ┌──┴───────────────┴──┐
        │  Integration Tests  │  §6 — Vitest + Firebase Emulator
        │                     │  本ドキュメント §6（INT-01〜INT-08）
     ┌──┴─────────────────────┴──┐
     │       Unit Tests          │  §4-5 — Vitest / pytest
     │                           │  本ドキュメント §4（UT-P01〜UT-P14）§5（UT-F01〜UT-F14）
     └───────────────────────────┘
```

### 1.2 対象機能とテスト優先度

| 機能（CLAUDE_CODE §3.2） | 優先度 | テスト重点 |
|--------------------------|--------|----------|
| F1 ユーザー認証 | P0 | 認証フロー、セッション管理、未認証ブロック |
| F2 コスメスキャン | P0 | 画像認識精度、JSON スキーマ準拠、エラーハンドリング |
| F3 在庫一覧 | P0 | CRUD、フィルタ/検索、カード表示 |
| F4 メイクレシピ生成 | P0 | **Hallucination ゼロ（最重要）**、JSON 準拠、代用ロジック |
| F5 チャット対話 | P0 | SSE ストリーミング、マルチターン、ルーティング |
| F6 レシピフィードバック | P0 | 評価保存、集計 |
| F7 商品検索補完 | P0 | google_search 連携、候補表示、廃盤対応 |
| F8 鑑定演出 | P1 | アニメーション表示（スナップショットテスト） |
| F9 コスメスペック | P1 | stats 算出ロジック、UI 変換（1-5 → ★表示） |
| F10 仕上がりプレビュー | P1 | 画像生成 API 呼び出し、フォールバック |

### 1.3 テスト命名規則

```
{層}-{連番}: {テスト名}
例: UT-P01, INT-03, API-07, AGT-12, E2E-01
```

| プレフィックス | 層 | ツール |
|-------------|---|------|
| UT-P | Unit (Python) | pytest |
| UT-F | Unit (Frontend) | Vitest |
| INT | Integration | Vitest + Firebase Emulator |
| API | API (BFF) | Vitest + Supertest |
| AGT | Agent Eval | pytest + ADK Eval |
| E2E | E2E | Playwright |
| SEC | Security | 手動 + 自動 |
| PERF | Performance | k6 / Lighthouse |

---

## 2. テスト環境・ツール

### 2.1 ローカル開発環境

| ツール | 用途 | 設定 |
|-------|------|------|
| **Firebase Emulator Suite** | Firestore / Auth / Storage のローカルエミュレート | `firebase emulators:start` |
| **Vitest** | TypeScript ユニット / 統合 / API テスト | `vitest.config.ts` |
| **pytest** | Python ユニットテスト + Agent 評価 | `agent/pytest.ini` |
| **ADK CLI** | `adk eval` コマンドによるエージェント評価 | `agent/alcheme/*.test.json` |
| **Playwright** | E2E ブラウザテスト（モバイルビューポート） | `playwright.config.ts` |
| **MSW (Mock Service Worker)** | BFF → Agent Engine の HTTP モック | `frontend/mocks/` |

### 2.2 テストデータ

| データ | ファイル | 用途 |
|-------|---------|------|
| サンプル在庫（15アイテム） | `sample_inventory.json` | スキャン精度、レシピ生成テストのシードデータ |
| テストユーザー | Firebase Emulator に自動作成 | 認証テスト |
| テスト画像セット | `agent/tests/fixtures/images/` | 画像認識精度テスト（§12 参照） |
| ADK 評価データセット | `agent/tests/eval/*.test.json` | エージェント品質測定 |

---

## 3. 品質ゲート（リリースブロッカー）

Design Doc §9.4 + CLAUDE_CODE_INSTRUCTIONS §16 を統合した最終リリース判定基準。

| # | ゲート | 基準 | 測定方法 | ブロッカー |
|---|-------|------|---------|----------|
| QG-1 | **在庫 Hallucination 率** | **0%** | AGT-09 + E2E-03 で全レシピを `validate_recipe_items` 検証 | **Yes** |
| QG-2 | **レシピ生成成功率** | ≥ 95% | AGT-06〜AGT-10 の pass 率 | **Yes** |
| QG-3 | **画像認識精度** | ≥ 80% | AGT-01〜AGT-05 でカテゴリ・ブランド正答率 | **Yes** |
| QG-4 | **API レスポンスタイム** | P95 < 15秒 | PERF-01〜PERF-03 | **Yes** |
| QG-5 | **API エラー率** | < 1% | PERF-04（負荷テスト） | **Yes** |
| QG-6 | **Firebase Auth 正常動作** | Login / Signup / Google OAuth / Logout | E2E-01 | **Yes** |
| QG-7 | **ユニットテスト pass 率** | 100% | UT-P + UT-F 全件 | **Yes** |
| QG-8 | **PWA インストール可能** | Lighthouse PWA スコア ≥ 80 | PERF-05 | No |
| QG-9 | **主要 E2E フロー pass** | E2E-01〜E2E-06 全件 pass | Playwright CI | **Yes** |

---

## 4. Unit Tests — Python Agent Tools

テスト対象: `agent/alcheme/tools/`, `agent/alcheme/schemas/`

### 4.1 inventory_tools.py

| # | テスト名 | 対象関数 | 入力 | 期待結果 |
|---|---------|---------|------|---------|
| UT-P01 | 在庫アイテム追加 | `add_inventory_item()` | 有効な InventoryItem dict | Firestore に保存成功、itemId 返却 |
| UT-P02 | 在庫アイテム取得 | `get_inventory_item()` | 存在する itemId | 正しいアイテムデータ返却 |
| UT-P03 | 在庫アイテム取得（不存在） | `get_inventory_item()` | 存在しない itemId | `{"status": "error", "message": "..."}` |
| UT-P04 | 在庫一覧取得 | `get_inventory()` | userId | ユーザーの全アイテム配列 |
| UT-P05 | カテゴリフィルタ | `filter_inventory_by_category()` | category="Lip" | Lip カテゴリのみの配列 |
| UT-P06 | 在庫検索 | `search_inventory()` | query="KATE" | KATE ブランドのアイテムのみ |
| UT-P07 | 在庫サマリー | `get_inventory_summary()` | 15アイテムの在庫 | カテゴリ別集計（Lip: 3, Eye: 4 等） |
| UT-P08 | アイテム ID 生成 | `generate_item_id()` | なし | `item_` プレフィックス + UUID 形式 |
| UT-P09 | 使用記録 | `record_item_use()` | itemId | `useCount` +1、`lastUsedAt` 更新 |
| UT-P10 | 残量更新 | `update_remaining()` | itemId, "40%" | `estimatedRemaining` が "40%" に更新 |

### 4.2 recipe_tools.py

| # | テスト名 | 対象関数 | 入力 | 期待結果 |
|---|---------|---------|------|---------|
| UT-P11 | **レシピバリデーション（正常）** | `validate_recipe_items()` | レシピ内全 itemId が在庫に存在 | `{"valid": true, "missing_items": []}` |
| UT-P12 | **レシピバリデーション（Hallucination 検知）** | `validate_recipe_items()` | レシピ内に存在しない itemId | `{"valid": false, "missing_items": ["item_999"]}` |
| UT-P13 | レシピ保存 | `save_recipe()` | 有効な Recipe dict | Firestore に保存、recipeId 返却 |
| UT-P14 | フィードバック保存 | `save_feedback()` | recipeId + rating: "love" | feedback フィールドが更新 |

### 4.3 schemas（Pydantic モデル）

| # | テスト名 | 対象 | 入力 | 期待結果 |
|---|---------|------|------|---------|
| UT-P15 | InventoryItem スキーマ検証（正常） | `InventoryItem` | 全必須フィールド入り dict | バリデーション pass |
| UT-P16 | InventoryItem スキーマ検証（不正） | `InventoryItem` | category が無効値 | `ValidationError` |
| UT-P17 | stats 範囲チェック | `InventoryItem.stats` | pigment=6 (範囲外) | `ValidationError`（1-5 のみ許可） |
| UT-P18 | RecipeStep スキーマ検証 | `RecipeStep` | 有効なステップ dict | バリデーション pass |
| UT-P19 | vector 範囲チェック | `InventoryItem.vector` | hue=1.5 (範囲外) | `ValidationError`（0.0-1.0 のみ許可） |
| UT-P20 | hygiene 期限算出 | `InventoryItem.hygiene` | openedAt + paoMonths=12 | expiryDate が正しく算出される |

### 4.4 rakuten_api.py

| # | テスト名 | 対象関数 | 入力 | 期待結果 |
|---|---------|---------|------|---------|
| UT-P21 | 楽天商品検索（正常） | `search_product()` | keyword="KATE リップモンスター" | 商品情報 dict 返却（brand, name, price, url） |
| UT-P22 | 楽天商品検索（結果なし） | `search_product()` | keyword="存在しない商品名XYZ" | `{"status": "not_found"}` |
| UT-P23 | 楽天 API エラー | `search_product()` | API タイムアウトモック | `{"status": "error"}` (例外を投げない) |

---

## 5. Unit Tests — TypeScript Frontend

テスト対象: `components/`, `hooks/`, `lib/`, `types/`

### 5.1 型定義

| # | テスト名 | 対象 | 検証内容 |
|---|---------|------|---------|
| UT-F01 | InventoryItem 型がスキーマ準拠 | `types/inventory.ts` | §8.1 Firestore スキーマの全フィールドが型定義に含まれる |
| UT-F02 | Recipe 型がスキーマ準拠 | `types/recipe.ts` | steps, usedItems, matchScore, feedback を含む |
| UT-F03 | ChatMessage 型 | `types/chat.ts` | role("user" / "assistant"), content, timestamp を含む |

### 5.2 ユーティリティ

| # | テスト名 | 対象 | 入力 | 期待結果 |
|---|---------|------|------|---------|
| UT-F04 | stats → ★表示変換 | `lib/utils.ts` or 変換関数 | `pigment: 4` | `"★★★★☆"` + ラベル `"しっかり発色"` |
| UT-F05 | stats → ★表示変換（全値） | 同上 | 1〜5 の全値 | D/C/B/A/S 各ランクに正しくマッピング |
| UT-F06 | hygiene alertLevel 算出 | 残日数算出関数 | openedAt + paoMonths | "safe" / "warning" / "expired" が正しく算出 |
| UT-F07 | costPerWear 算出 | CPW 関数 | price=3000, useCount=10 | 300 |
| UT-F08 | costPerWear ゼロ除算 | CPW 関数 | price=3000, useCount=0 | null (エラーにならない) |

### 5.3 コンポーネント（スナップショット / 振る舞い）

| # | テスト名 | 対象 | 検証内容 |
|---|---------|------|---------|
| UT-F09 | CosmeCard レンダリング | `components/cosme-card.tsx` | ブランド名・商品名・残量バー・stats ★表示が表示される |
| UT-F10 | CosmeCard レア度バッジ | `components/cosme-card.tsx` | rarity="SSR" → ゴールドバッジ表示 |
| UT-F11 | RarityBadge 全バリアント | `components/rarity-badge.tsx` | SSR/SR/R/N 各色が正しく適用される |
| UT-F12 | StatBar 表示 | `components/stat-bar.tsx` | pigment=4 → 80%幅のプログレスバー + "A" ラベル |
| UT-F13 | RecipeFeedback 3ボタン | `components/recipe-feedback.tsx` | ♡/🤔/😢 ボタンが表示、クリックで onFeedback 発火 |
| UT-F14 | BottomNav アクティブ状態 | `components/bottom-nav.tsx` | pathname="/inventory" → 「パック」タブがアクティブ |
| UT-F15 | CategoryFilter 切り替え | `components/category-filter.tsx` | "Lip" タップ → onFilter("Lip") 発火 |
| UT-F16 | RemainingBar 表示 | `components/remaining-bar.tsx` | "60%" → 60%幅のバー |
| UT-F17 | EmptyState 表示 | `components/empty-state.tsx` | title + description + CTA ボタン表示 |

### 5.4 Hooks

| # | テスト名 | 対象 | 検証内容 |
|---|---------|------|---------|
| UT-F18 | useInventory — fetch | `hooks/use-inventory.ts` | マウント時に `/api/inventory` を呼び出し、items を返す |
| UT-F19 | useInventory — filter | 同上 | category="Eye" でフィルタリングされたリストを返す |
| UT-F20 | useChat — SSE 接続 | `hooks/use-chat.ts` | メッセージ送信後に SSE ストリームを読み取る |
| UT-F21 | useChat — ストリーミング表示 | 同上 | chunk 受信ごとに messages 配列が更新される |
| UT-F22 | useRecipes — fetch | `hooks/use-recipes.ts` | マウント時にレシピ一覧を取得 |
| UT-F23 | useAuth — 未認証リダイレクト | `hooks/use-auth.ts` | user=null 時に `/login` へリダイレクト |

---

## 6. Integration Tests — Firebase / Cloud Storage

テスト環境: Firebase Emulator Suite

### 6.1 Firestore CRUD

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| INT-01 | ユーザー作成 | `users/{uid}` に doc 作成 | 全フィールドが正しく保存 |
| INT-02 | インベントリ追加 | `users/{uid}/inventory/{itemId}` | サブコレクションに正しく保存 |
| INT-03 | インベントリ更新 | `estimatedRemaining` を "40%" に更新 | `updatedAt` も更新される |
| INT-04 | インベントリ削除 | `delete` 操作 | ドキュメントが削除される |
| INT-05 | レシピ保存 | `users/{uid}/recipes/{recipeId}` | 全フィールド（steps, usedItems, matchScore）が保存 |
| INT-06 | カテゴリ複合クエリ | category="Lip" + orderBy("createdAt") | インデックスが正しく動作し結果を返す |

### 6.2 Cloud Storage

| # | テスト名 | 操作 | 期待結果 |
|---|---------|------|---------|
| INT-07 | 画像アップロード | JPEG ファイルを `cosme-images/{uid}/{itemId}/original.jpg` に保存 | アップロード成功、URL 取得可能 |
| INT-08 | Signed URL 生成 | 保存済み画像の signed URL を生成 | 有効期限付き URL が返却される |

---

## 7. API Tests — BFF Endpoints

テスト対象: `app/api/` 全 Route。Supertest + Vitest で実行。

### 7.1 認証 API

| # | テスト名 | Method | Path | 入力 | 期待結果 |
|---|---------|--------|------|------|---------|
| API-01 | セッション作成 | POST | `/api/auth/session` | 有効な Firebase ID Token | 200 + Set-Cookie (httpOnly, secure) |
| API-02 | セッション作成（無効トークン） | POST | `/api/auth/session` | 不正な Token | 401 Unauthorized |
| API-03 | セッション破棄 | DELETE | `/api/auth/session` | 有効なセッション Cookie | 200 + Cookie 削除 |
| API-04 | プロフィール取得 | GET | `/api/users/me` | 認証済み | 200 + ユーザーデータ（personalColor, skinType 等） |
| API-05 | プロフィール更新 | PATCH | `/api/users/me` | `{personalColor: "イエベ春"}` | 200 + 更新されたデータ |
| API-06 | プロフィール取得（未認証） | GET | `/api/users/me` | セッション Cookie なし | 401 Unauthorized |

### 7.2 インベントリ API

| # | テスト名 | Method | Path | 入力 | 期待結果 |
|---|---------|--------|------|------|---------|
| API-07 | 在庫一覧 | GET | `/api/inventory` | 認証済み | 200 + items 配列 |
| API-08 | 在庫一覧（カテゴリフィルタ） | GET | `/api/inventory?category=Lip` | 認証済み | 200 + Lip のみ |
| API-09 | コスメスキャン | POST | `/api/inventory/scan` | 認証済み + 画像ファイル | 200 + AI 解析結果（JSON スキーマ準拠） |
| API-10 | コスメスキャン（画像なし） | POST | `/api/inventory/scan` | 認証済み + 空 body | 400 Bad Request |
| API-11 | コスメスキャン（非画像ファイル） | POST | `/api/inventory/scan` | 認証済み + .txt ファイル | 400 Bad Request |
| API-12 | 登録確定 | POST | `/api/inventory/confirm` | 認証済み + 鑑定結果 JSON | 201 + 保存された itemId |
| API-13 | アイテム更新 | PATCH | `/api/inventory/{itemId}` | 認証済み + 更新データ | 200 + 更新されたアイテム |
| API-14 | アイテム削除 | DELETE | `/api/inventory/{itemId}` | 認証済み | 204 No Content |
| API-15 | 使用記録 | POST | `/api/inventory/{itemId}/use` | 認証済み | 200 + useCount 更新 |
| API-16 | 他ユーザーのアイテム操作 | PATCH | `/api/inventory/{他ユーザーのitemId}` | 認証済み | 403 Forbidden |

### 7.3 チャット API

| # | テスト名 | Method | Path | 入力 | 期待結果 |
|---|---------|--------|------|------|---------|
| API-17 | チャットメッセージ送信 | POST | `/api/chat` | 認証済み + `{message: "今日のメイクを提案して"}` | 200 + SSE ストリーム (`Content-Type: text/event-stream`) |
| API-18 | チャット（未認証） | POST | `/api/chat` | セッション Cookie なし | 401 Unauthorized |

### 7.4 レシピ API

| # | テスト名 | Method | Path | 入力 | 期待結果 |
|---|---------|--------|------|------|---------|
| API-19 | レシピ一覧 | GET | `/api/recipes` | 認証済み | 200 + recipes 配列 |
| API-20 | レシピ詳細 | GET | `/api/recipes/{recipeId}` | 認証済み | 200 + レシピ全フィールド |
| API-21 | レシピ評価送信 | POST | `/api/recipes/{recipeId}/feedback` | 認証済み + `{rating: "love"}` | 200 + feedback 更新 |
| API-22 | 存在しないレシピ | GET | `/api/recipes/nonexistent` | 認証済み | 404 Not Found |

---

## 8. Agent Eval — ADK エージェント評価

prompts-catalog v3 §8 T1-T17 に対応。`pytest` + ADK 評価機能で実行。

### 8.1 Inventory Manager（T1-T5）

| # | prompts-catalog | シナリオ | 入力 | 期待結果 | 検証ポイント |
|---|----------------|---------|------|---------|------------|
| AGT-01 | T1 | 単品スキャン（高精度） | KATE リップモンスターの鮮明画像 | confidence: "high"、正確なブランド・商品名 | JSON スキーマ準拠。stats 4軸(pigment/longevity/shelf_life/natural_finish)が含まれる |
| AGT-02 | T2 | 複数アイテム | ポーチの中身（5点）画像 | 5つの items 配列。各アイテムに stats と rarity | 全アイテムにカテゴリ・テクスチャが付与される |
| AGT-03 | T3 | ブランド不明 | ラベルが見えないコスメ画像 | confidence: "low", needs_search: true | Product Search Agent への委譲が発生する |
| AGT-04 | T4 | 非コスメ画像 | ペン / 食べ物の画像 | 「コスメではないようです」エラーメッセージ | レシピ生成に進まない |
| AGT-05 | T5 | ぼやけた画像 | ピンボケのコスメ画像 | confidence: "low"、撮り直し依頼 | ユーザーに再撮影を促す |

#### 画像認識精度テスト（QG-3: ≥ 80%）

| # | テスト名 | 方法 | 合格基準 |
|---|---------|------|---------|
| AGT-05a | カテゴリ正答率 | sample_inventory.json の 15 アイテム画像をスキャン | カテゴリ正答 ≥ 12/15 (80%) |
| AGT-05b | ブランド正答率 | 同上 | ブランド名正答 ≥ 12/15 (80%) |
| AGT-05c | テクスチャ正答率 | 同上 | テクスチャ正答 ≥ 10/15 (67%、参考値) |

### 8.2 Cosmetic Alchemist（T6-T10）

| # | prompts-catalog | シナリオ | 入力 | 期待結果 | 検証ポイント |
|---|----------------|---------|------|---------|------------|
| AGT-06 | T6 | 基本レシピ生成 | 「オフィスメイク」+ 15アイテム在庫 | 在庫内アイテムのみのレシピ。`validation.all_items_in_inventory: true` | **QG-1: Hallucination 0%** |
| AGT-07 | T7 | 代用テクニック | 「ピンクメイク」（ピンクシャドウなし） | `substitution_note` 付きでチーク→目元転用 | 代用理由が明記される |
| AGT-08 | T8 | 在庫不足 | 「フルグラム」（在庫3点のみ） | `match_score < 50`、正直に不足を伝える | 無理なレシピを捏造しない |
| AGT-09 | T9 | **Hallucination 検知** | レシピ結果を `validate_recipe_items` で検証 | `missing_items` が空 | **最重要テスト。全レシピで実行** |
| AGT-10 | T10 | 韓国風リクエスト | 「TWICE風メイク」（韓国コスメ少） | 代用を駆使した `match_score ≥ 70` のレシピ | 手持ちのみで代用成立 |

#### Hallucination 包括検証（QG-1: 0%）

```python
# agent/tests/test_hallucination.py
# 全テスト共通のアサーション
def assert_no_hallucination(recipe: dict, inventory: list[dict]):
    """レシピ内の全 item_id が在庫に存在することを検証"""
    inventory_ids = {item["id"] for item in inventory}
    for step in recipe["steps"]:
        for item_id in step.get("item_ids", []):
            assert item_id in inventory_ids, \
                f"Hallucination detected: {item_id} not in inventory"
```

### 8.3 Product Search Agent（T11-T13）

| # | prompts-catalog | シナリオ | 入力 | 期待結果 | 検証ポイント |
|---|----------------|---------|------|---------|------------|
| AGT-11 | T11 | 特定成功 | パッケージ特徴 + カテゴリ | `resolved: true`、正確な商品情報 | google_search ツールが呼ばれる |
| AGT-12 | T12 | 複数候補 | 曖昧な特徴 | `resolved: false`、alternatives 配列 | ユーザーに選択肢を提示 |
| AGT-13 | T13 | 廃盤商品 | 古いコスメの特徴 | 廃盤の旨を明記 | 偽情報を生成しない |

### 8.4 Concierge 統合テスト（T14-T17）

| # | prompts-catalog | シナリオ | 入力 | 期待結果 | 検証ポイント |
|---|----------------|---------|------|---------|------------|
| AGT-14 | T14 | 画像→登録→レシピ | 画像アップ後に「このコスメでメイクして」 | Inventory → (Search) → Alchemist 連携が動作 | ルーティングが正しく機能 |
| AGT-15 | T15 | マルチターン | 「リップ変えて」（前のレシピを踏まえて） | セッションコンテキストを参照して修正版生成 | state 保持が正常 |
| AGT-16 | T16 | 範囲外質問 | 「肌荒れがひどい」 | 皮膚科受診を推奨（レシピ生成しない） | 安全性ガードレールが機能 |
| AGT-17 | T17 | 雑談 | 「おはよう！」 | 温かく挨拶、今日のメイク提案を促す | 自然な会話継続 |

### 8.5 トーン＆ボイス検証

PRD §5.3 / CLAUDE_CODE_INSTRUCTIONS §2 準拠。

| # | テスト名 | 検証方法 | 合格基準 |
|---|---------|---------|---------|
| AGT-18 | ゲーム用語不使用 | 全エージェント出力に対し禁止語句リストで検索 | 「クエスト」「デッキ」「錬成」「攻撃力」「防御力」「デバフ」「レベルアップ」「ステータス」が0件 |
| AGT-19 | 美容用語変換 | stats 値が含まれる出力のサンプリング検査 | 内部名(pigment)ではなく「発色力」等の美容用語で表示 |
| AGT-20 | キャラクターテーマ切替 | agentTheme="kpop" 設定でレシピ生成 | トーンが K-POP メイクチーム風に変化（テーマ固有の挨拶等） |

---

## 9. E2E Tests — ユーザーフロー

Playwright でモバイルビューポート (375×812, iPhone SE) で実行。

### E2E-01: 認証フロー（F1）

```
前提条件: 未認証状態

ステップ:
  1. / にアクセス
  2. ランディングページ（S01）が表示される
  3. 「メールアドレスで始める」をタップ
  4. メール + パスワードを入力し「登録」
  5. オンボーディング画面（S02）に遷移
  6. パーソナルカラー・肌タイプを選択し「始める」
  7. チャット画面（S03）に遷移、BottomNav が表示される
  8. 設定画面でログアウト → ログイン画面に戻る

検証:
  - 認証後に (main) レイアウト内のページにアクセスできる
  - 未認証で /chat にアクセスすると /login にリダイレクト
  - ログアウト後に /chat にアクセスすると /login にリダイレクト
```

### E2E-02: コスメスキャン→登録（F2 + F8 + F9）

```
前提条件: 認証済み、在庫0件

ステップ:
  1. BottomNav「スキャン」をタップ
  2. スキャン画面（S04）が表示される
  3. 「ライブラリから選択」をタップ
  4. KATE リップモンスターの画像を選択
  5. 鑑定演出（S05 フェーズA）が 3〜5秒表示される
  6. 確認画面（S05 フェーズB）に鑑定結果カードが表示される
  7. ブランド名「KATE」、商品名「リップモンスター」が表示される
  8. stats（発色力・持続力・製品寿命・ナチュラルさ）が★表示される
  9. 「登録する」をタップ
  10. 在庫一覧画面（S06）にリダイレクト、登録したカードが表示される

検証:
  - 画像アップロード → 鑑定演出 → 確認 → 登録の一連が完了する
  - 登録後のカードに正しい情報が表示される
  - 鑑定演出アニメーションが表示される（DOM 要素の存在確認）
```

### E2E-03: レシピ生成（F4 + F5）— **最重要テスト**

```
前提条件: 認証済み、sample_inventory.json の 15 アイテムが登録済み

ステップ:
  1. チャット画面（S03）を開く
  2. 「今日はオフィスで商談があります。きちんとしたメイクを提案して」と入力
  3. SSE ストリーミングでレシピが段階的に表示される
  4. インラインレシピカードが表示される
  5. レシピ内の全アイテムが在庫に存在することを確認
  6. 「♡ 使いたい！」ボタンをタップ
  7. フィードバックが保存される

検証:
  - ★ レシピ内の全 item_id が在庫に存在する（Hallucination ゼロ）
  - SSE ストリーミングが正常に動作する（chunk が段階的に表示）
  - matchScore が表示される
  - steps 配列が空でない
  - フィードバック送信が成功する
```

### E2E-04: 在庫管理（F3）

```
前提条件: 認証済み、5 アイテムが登録済み

ステップ:
  1. BottomNav「パック」をタップ
  2. 在庫一覧画面（S06）に 5 枚のカードが表示される
  3. カテゴリフィルタ「Lip」をタップ → Lip のみ表示
  4. 「全て」をタップ → 全件表示
  5. カードをタップ → アイテム詳細画面（S07）に遷移
  6. 詳細画面で残量・stats・hygiene 情報が表示される
  7. 「使用した」ボタンをタップ → useCount が +1 される

検証:
  - カテゴリフィルタが正しく動作する
  - カード → 詳細画面の遷移が正しい
  - useCount の更新が即座に反映される
```

### E2E-05: レシピ一覧・詳細（F6）

```
前提条件: 認証済み、レシピが 3 件保存済み

ステップ:
  1. チャット画面のレシピカードから「詳細を見る」をタップ
  2. レシピ詳細画面（S08）に遷移
  3. ステップ一覧、使用アイテム、matchScore が表示される
  4. フィードバック（♡/🤔/😢）をタップ
  5. 戻るボタンで一覧に戻る

検証:
  - レシピ詳細の全フィールドが表示される
  - フィードバック保存後にボタンの状態が変わる
```

### E2E-06: オンボーディング〜フルフロー

```
前提条件: 新規ユーザー（完全初期状態）

ステップ:
  1. サインアップ → オンボーディング完了
  2. チャット画面で「コスメを登録したい」と入力
  3. スキャン画面で 3 アイテムを連続登録
  4. チャット画面で「今日のメイクを提案して」と入力
  5. レシピが生成される（3 アイテムのみで構成）
  6. フィードバックを送信

検証:
  - 新規ユーザーが初回起動から一連の体験を完了できる
  - 在庫 3 件でもレシピが生成される
  - Hallucination ゼロ
```

---

## 10. セキュリティテスト

Design Doc §7 準拠。

| # | テスト名 | 方法 | 期待結果 |
|---|---------|------|---------|
| SEC-01 | 未認証アクセスブロック | 全 `/api/*` エンドポイントにセッション Cookie なしでリクエスト | 全て 401 Unauthorized（`/api/auth/session` POST を除く） |
| SEC-02 | 他ユーザーデータアクセス | User A の認証で User B の `/api/inventory/{itemId}` に PATCH | 403 Forbidden |
| SEC-03 | Firestore セキュリティルール | Firebase Emulator で `request.auth.uid != resource.data.userId` のクエリ | Permission Denied |
| SEC-04 | セッション Cookie 属性 | ログイン後の Set-Cookie ヘッダーを検証 | `httpOnly`, `Secure`, `SameSite=Strict` |
| SEC-05 | CSRF 対策 | Origin ヘッダーなしで `/api/chat` に POST | リクエスト拒否（SameSite Cookie で防御） |
| SEC-06 | 画像ファイル検証 | `/api/inventory/scan` に悪意のあるファイル（.exe, .svg+script）を送信 | 400 Bad Request（MIME タイプ検証） |
| SEC-07 | Cloud Storage 直接アクセス | Signed URL なしで Storage オブジェクトに直接アクセス | 403 Forbidden |
| SEC-08 | レート制限 | `/api/chat` に連続 20 リクエスト | 429 Too Many Requests（11回目以降） |

---

## 11. パフォーマンステスト

Design Doc §8 + CLAUDE_CODE_INSTRUCTIONS §16 準拠。

| # | テスト名 | 測定対象 | 目標 | ツール |
|---|---------|---------|------|-------|
| PERF-01 | 画像スキャン応答時間 | POST `/api/inventory/scan` → レスポンス完了 | P95 < 5秒 | k6 |
| PERF-02 | レシピ生成応答時間 | POST `/api/chat` → SSE 最終 chunk | P95 < 15秒 | k6 |
| PERF-03 | 在庫一覧表示速度 | GET `/api/inventory` → レスポンス完了 | P95 < 1秒 | k6 |
| PERF-04 | 負荷テスト | 10 同時ユーザー × 5分間 | エラー率 < 1% | k6 |
| PERF-05 | PWA Lighthouse | Lighthouse PWA カテゴリ | スコア ≥ 80 | Lighthouse CI |
| PERF-06 | First Contentful Paint | チャット画面初回表示 | < 2秒（3G 回線） | Lighthouse |
| PERF-07 | 画像アップロードサイズ | クライアント側リサイズ後のファイルサイズ | < 1MB | Vitest |

---

## 12. テストデータ

### 12.1 sample_inventory.json 拡張仕様

現在の `sample_inventory.json` は簡易版（7フィールド）。テスト実行前に CLAUDE_CODE_INSTRUCTIONS §8.1 準拠のフルスキーマに拡張すること。

```json
{
  "id": "item_001",
  "category": "Lip",
  "brand": "KATE",
  "productName": "リップモンスター",
  "colorCode": "03",
  "colorName": "陽炎",
  "colorDescription": "マットレッド（深みのある赤）",
  "texture": "matte",
  "price": 1540,
  "status": "HAVE",
  "estimatedRemaining": "80%",
  "openDate": null,
  "imageUrl": null,
  "confidence": "high",
  "source": "手動入力",
  "vector": {
    "hue": 0.0,
    "saturation": 0.85,
    "value": 0.45,
    "textureScore": 0.1
  },
  "hygiene": {
    "isOpened": true,
    "openedAt": "2025-12-01T00:00:00Z",
    "paoMonths": 18,
    "expiryDate": "2027-06-01T00:00:00Z",
    "daysRemaining": 472,
    "alertLevel": "safe"
  },
  "stats": {
    "pigment": 5,
    "longevity": 4,
    "shelf_life": 4,
    "natural_finish": 2
  },
  "rarity": "SR",
  "useCount": 12,
  "costPerWear": 128,
  "lastUsedAt": "2026-02-10T08:30:00Z",
  "createdAt": "2025-12-15T10:00:00Z",
  "updatedAt": "2026-02-10T08:30:00Z"
}
```

### 12.2 テスト画像セット

| # | ファイル名 | 内容 | 期待カテゴリ | 期待ブランド |
|---|----------|------|-----------|-----------|
| IMG-01 | `kate_lip_monster.jpg` | KATE リップモンスター 03番 鮮明写真 | Lip | KATE |
| IMG-02 | `romand_tint.jpg` | rom&nd ジューシーラスティングティント | Lip | rom&nd |
| IMG-03 | `canmake_cheek.jpg` | CANMAKE グロウフルールチークス | Cheek | CANMAKE |
| IMG-04 | `excel_shadow.jpg` | excel スキニーリッチシャドウ | Eye | excel |
| IMG-05 | `pouch_5items.jpg` | ポーチの中身 5 点 | 複数 | 複数 |
| IMG-06 | `blurry_cosme.jpg` | ピンボケのコスメ | — | — |
| IMG-07 | `pen_not_cosme.jpg` | ボールペン（非コスメ） | — | — |
| IMG-08 | `no_label_cosme.jpg` | ラベルが見えないリップ | Lip | 不明 |

### 12.3 テストユーザー

| ユーザー | メール | 用途 |
|---------|--------|------|
| Test User A | `test-a@alcheme.dev` | メインテスト（15 アイテム在庫） |
| Test User B | `test-b@alcheme.dev` | セキュリティテスト（権限分離検証） |
| Test User C | `test-c@alcheme.dev` | 空在庫テスト |

---

## 13. prompts-catalog §8 テストシナリオ対応表

prompts-catalog v3 の T1-T17 が本ドキュメントのどのテストに対応するかの参照表。

| prompts-catalog | テスト名 | 本ドキュメント | 層 |
|-----------------|---------|------------|---|
| T1 | 単品スキャン（高精度） | AGT-01 | Agent Eval |
| T2 | 複数アイテム | AGT-02 | Agent Eval |
| T3 | ブランド不明 | AGT-03 | Agent Eval |
| T4 | 非コスメ | AGT-04 | Agent Eval |
| T5 | ぼやけた画像 | AGT-05 | Agent Eval |
| T6 | 基本レシピ | AGT-06 | Agent Eval |
| T7 | 代用テクニック | AGT-07 | Agent Eval |
| T8 | 在庫不足 | AGT-08 | Agent Eval |
| T9 | Hallucination 検知 | AGT-09 | Agent Eval |
| T10 | 韓国風リクエスト | AGT-10 | Agent Eval |
| T11 | 特定成功 | AGT-11 | Agent Eval |
| T12 | 複数候補 | AGT-12 | Agent Eval |
| T13 | 廃盤商品 | AGT-13 | Agent Eval |
| T14 | 画像→登録→レシピ | AGT-14, E2E-02+E2E-03 | Agent Eval + E2E |
| T15 | マルチターン | AGT-15 | Agent Eval |
| T16 | 範囲外質問 | AGT-16 | Agent Eval |
| T17 | 雑談 | AGT-17 | Agent Eval |

---

## 14. CI/CD パイプライン統合

### 14.1 GitHub Actions ワークフロー

```yaml
# .github/workflows/ci-frontend.yml
name: Frontend CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test            # UT-F + INT + API テスト
      - run: npx playwright install
      - run: npm run test:e2e        # E2E テスト
      - run: npx lighthouse ci       # PERF-05, PERF-06
```

```yaml
# .github/workflows/ci-agent.yml
name: Agent CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -e ".[dev]"
        working-directory: agent
      - run: pytest tests/            # UT-P テスト
        working-directory: agent
      - run: adk eval alcheme tests/eval/  # AGT テスト
        working-directory: agent
```

### 14.2 テスト実行タイミング

| トリガー | 実行するテスト | 目的 |
|---------|-------------|------|
| **push to feature/** | UT-P + UT-F + lint | 高速フィードバック |
| **PR to develop** | UT-P + UT-F + INT + API + AGT-09(Hallucination) | マージブロッカー |
| **merge to develop** | 上記 + E2E + SEC | 統合品質確認 |
| **release candidate** | 全テスト + PERF | リリース判定（QG-1〜QG-9） |

### 14.3 テストファイル配置

```
alcheme/
├── agent/
│   └── tests/
│       ├── test_inventory_tools.py    # UT-P01〜UT-P10
│       ├── test_recipe_tools.py       # UT-P11〜UT-P14
│       ├── test_schemas.py            # UT-P15〜UT-P20
│       ├── test_rakuten_api.py        # UT-P21〜UT-P23
│       ├── test_hallucination.py      # AGT-09（専用、全レシピに対して実行）
│       ├── test_tone_voice.py         # AGT-18〜AGT-20
│       ├── fixtures/
│       │   └── images/                # IMG-01〜IMG-08
│       └── eval/
│           ├── inventory.test.json    # AGT-01〜AGT-05
│           ├── alchemist.test.json    # AGT-06〜AGT-10
│           ├── product_search.test.json # AGT-11〜AGT-13
│           └── concierge.test.json    # AGT-14〜AGT-17
│
├── __tests__/                         # or tests/ (frontend)
│   ├── unit/
│   │   ├── types.test.ts              # UT-F01〜UT-F03
│   │   ├── utils.test.ts              # UT-F04〜UT-F08
│   │   ├── components/
│   │   │   ├── cosme-card.test.tsx    # UT-F09〜UT-F10
│   │   │   ├── rarity-badge.test.tsx  # UT-F11
│   │   │   ├── stat-bar.test.tsx      # UT-F12
│   │   │   ├── recipe-feedback.test.tsx # UT-F13
│   │   │   ├── bottom-nav.test.tsx    # UT-F14
│   │   │   ├── category-filter.test.tsx # UT-F15
│   │   │   └── empty-state.test.tsx   # UT-F17
│   │   └── hooks/
│   │       ├── use-inventory.test.ts  # UT-F18〜UT-F19
│   │       ├── use-chat.test.ts       # UT-F20〜UT-F21
│   │       └── use-auth.test.ts       # UT-F23
│   ├── integration/
│   │   ├── firestore.test.ts          # INT-01〜INT-06
│   │   └── storage.test.ts            # INT-07〜INT-08
│   ├── api/
│   │   ├── auth.test.ts               # API-01〜API-06
│   │   ├── inventory.test.ts          # API-07〜API-16
│   │   ├── chat.test.ts               # API-17〜API-18
│   │   └── recipes.test.ts            # API-19〜API-22
│   ├── security/
│   │   └── access-control.test.ts     # SEC-01〜SEC-08
│   └── e2e/
│       ├── auth.spec.ts               # E2E-01
│       ├── scan-register.spec.ts      # E2E-02
│       ├── recipe-generation.spec.ts  # E2E-03
│       ├── inventory.spec.ts          # E2E-04
│       ├── recipe-detail.spec.ts      # E2E-05
│       └── full-flow.spec.ts          # E2E-06
│
├── playwright.config.ts
└── vitest.config.ts
```

---

## Appendix A: テスト総数サマリー

| 層 | テスト数 | 自動化 |
|----|---------|--------|
| Unit — Python (UT-P) | 23 | ✅ pytest |
| Unit — Frontend (UT-F) | 23 | ✅ Vitest |
| Integration (INT) | 8 | ✅ Vitest + Emulator |
| API (API) | 22 | ✅ Vitest + Supertest |
| Agent Eval (AGT) | 20 | ✅ pytest + ADK Eval |
| E2E | 6 | ✅ Playwright |
| Security (SEC) | 8 | 部分自動 |
| Performance (PERF) | 7 | ✅ k6 + Lighthouse |
| **合計** | **117** | |

## Appendix B: 禁止語句リスト（AGT-18 用）

トーン検証テストで使用する禁止ゲーム用語の完全リスト（PRD §5.3 / CLAUDE_CODE §2 準拠）。

```python
BANNED_GAME_TERMS = [
    "クエスト", "デッキ", "錬成", "攻撃力", "防御力",
    "デバフ", "バフ", "レベルアップ", "ステータス",
    "HP", "MP", "経験値", "XP", "ダンジョン",
    "装備", "パーティ", "スキル", "アビリティ",
    "ミッション", "ドロップ", "ガチャ", "レア度",
    "SSR", "SR",  # ユーザー向け出力では使用しない（内部分類のみ）
]

# stats の内部名が出力に漏れていないか
BANNED_INTERNAL_TERMS = [
    "pigment", "longevity", "shelf_life", "natural_finish",
    "attack", "defense", "durability", "stealth",
]
```

---

*— End of Document —*
*Version 1.0 | Last Updated: 2026-02-14*
*Author: Eri Kaneko (Product Owner)*
