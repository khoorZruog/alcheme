# Phase 1 (MVP) 完了状況監査レポート

**Date:** 2026-02-16 (Updated)
**Auditor:** Claude Code (Opus 4.6)
**Status:** ✅ Phase 1 全項目完了 → Phase 2 Batch 0.5〜8.5 完了

---

## 1. Phase 1 スコープ定義 (PRD §9.1)

> Inventory Manager + Product Search + Alchemist + Concierge + **Simulator**。
> 基本的なエンゲージメント機能（コスメカード・スキャン体験）。仕上がりプレビュー（Gemini 2.0 Flash Image）。
> ワンタップ評価。Next.js PWA Webアプリ。Firebase Auth。**Cloud Run デプロイ**（当初計画の Agent Engine ではなく Cloud Run + FastAPI + ADK Runner を採用）。楽天API連携。

---

## 2. 画面・ページ実装状況

| # | 画面 (UI Spec) | ルート | 状態 | 備考 |
|---|---------------|--------|------|------|
| S01 | ログイン | `/(auth)/login` | ✅ 完了 | Google + Email対応 |
| S02 | オンボーディング | `/(auth)/onboarding` | ✅ 完了 | 3ステップフロー |
| S03 | ホーム（チャット） | `/(main)/chat` | ✅ 完了 | SSEストリーミング、レシピカード表示、リアルタイム進捗表示 |
| S04 | コスメスキャン | `/(main)/scan` | ✅ 完了 | マルチ画像(最大4枚)対応 |
| S05 | 鑑定演出 + 確認 | `/(main)/scan/confirm` | ✅ 完了 | アニメーション + 編集シート |
| S06 | 在庫一覧 | `/(main)/inventory` | ✅ 完了 | カテゴリフィルタ + 検索 |
| S07 | アイテム詳細 | `/(main)/inventory/[itemId]` | ✅ 完了 | スペック表示、画像表示 |
| S08 | レシピカード | `/(main)/recipes/[recipeId]` | ✅ 完了 | ステップ表示、フィードバック |
| S09 | レシピ一覧 | `/(main)/recipes` | ✅ 完了 | BottomNavから遷移可能 |
| S10 | 設定 / プロフィール | `/(main)/settings/*` | ✅ 完了 | LIPS風プロフィール、編集5サブページ |

---

## 3. API エンドポイント実装状況

| エンドポイント | 状態 | 備考 |
|---------------|------|------|
| `POST /api/auth/session` | ✅ | Firebase Auth セッション管理 |
| `GET /api/users/me` | ✅ | ユーザープロフィール取得 |
| `GET /api/inventory` | ✅ | 在庫一覧取得 |
| `POST /api/inventory/scan` | ✅ | 画像スキャン → Agent Server |
| `POST /api/inventory/confirm` | ✅ | 鑑定結果の在庫登録 |
| `GET/PUT/DELETE /api/inventory/[id]` | ✅ | 個別アイテム CRUD |
| `POST /api/inventory/seed` | ✅ | テストデータ投入 |
| `POST /api/chat` | ✅ | チャット SSE ストリーミング |
| `GET /api/recipes` | ✅ | レシピ一覧取得（camelCase/snake_case両対応） |
| `GET/DELETE /api/recipes/[recipeId]` | ✅ | レシピ詳細・削除（フィールド名正規化済み） |
| `POST /api/recipes/[recipeId]/feedback` | ✅ | ワンタップ評価 |

---

## 4. エージェント実装状況

| エージェント | PRD優先度 | 状態 | 備考 |
|-------------|----------|------|------|
| Concierge Bot | P0 | ✅ | ルーティング、テーマ提案、get_today_context |
| Inventory Manager | P0 | ✅ | 画像解析、Firestore保存 |
| Product Search | P0 | ✅ | google_search ツール |
| Cosmetic Alchemist | P0 | ✅ | レシピ生成、代用テクニック、買い足し楽天リンク |
| **Simulator** | **P0** | **✅ Phase 2 B1** | 仕上がりプレビュー画像生成（Gemini 2.0 Flash Image）。Phase 2 Batch 1 で実装完了。SSE `preview_image` イベントでリアルタイム配信。 |

### ADK ツール一覧

| ツール | エージェント | 状態 |
|--------|------------|------|
| `get_inventory_summary` | Concierge | ✅ |
| `search_inventory` | Concierge, Alchemist | ✅ |
| `filter_inventory_by_category` | Concierge, Alchemist | ✅ |
| `get_today_context` | Concierge | ✅ |
| `get_inventory` | Alchemist | ✅ |
| `validate_recipe_items` | Alchemist | ✅ |
| `save_recipe` | Alchemist | ✅ (フィールド名正規化済み) |
| `add_items_to_inventory` | Inventory | ✅ |
| `generate_item_id` | Inventory | ✅ |
| `search_rakuten_api` | Inventory, Server fallback | ✅ |
| `google_search` | Product Search | ✅ (ADK built-in) |

---

## 5. ADK Sessions & Memory 活用状況

### 現状 (Phase 2 Batch 2 完了後)

| 項目 | 状態 | 詳細 |
|------|------|------|
| SessionService | ✅ `DatabaseSessionService` | SQLAlchemy async backend (sqlite+aiosqlite)。サーバー再起動後も会話履歴維持 |
| Session ID | ✅ サーバー主導 | `chat-{userId}` 固定ID。フロントからのセッションID送信を廃止 |
| Session State `user:id` | ✅ 設定済み | ツールがFirestoreアクセスに使用 |
| Session State `user:personal_color` | ✅ 設定済み | `_build_user_state()` でFirestoreから注入 |
| Session State `user:skin_type` | ✅ 設定済み | 同上 |
| Session State `user:display_name` | ✅ 設定済み | 同上 |
| Session State `user:beauty_goals` | ✅ 設定済み | 同上 |
| Session State `session:current_inventory_summary` | ✅ | `get_inventory_summary` が設定 |
| Memory Service | ✅ `InMemoryMemoryService` | クロスセッション記憶。セッション上限20イベント超過時にメモリ抽出 |

### Phase 3 改善ポイント

1. **RAG Memory**: `InMemoryMemoryService` → `VertexAiRagMemoryService` への移行（再起動耐性）
2. **セッションDB**: SQLite → Cloud SQL or Firestore への移行（マルチインスタンス対応）

---

## 6. 楽天API連携状況

| 用途 | 状態 | 備考 |
|------|------|------|
| スキャン時の商品補完 | ✅ | `search_rakuten_for_candidates()` でブランド+商品名検索 |
| 鑑定結果の候補表示 | ⚠️ Phase 2 | 候補選択UIはPhase 6計画に含む |
| 買い足し提案→購入リンク | ✅ | Alchemistプロンプトに楽天検索URL生成指示を追加済み |
| レシピ内の不足アイテム→EC | ✅ | 「プラスワン・マジック」として楽天検索リンク生成 |

---

## 7. 完了した修正一覧

### ✅ Critical (Phase 1 ブロッカー) — 全完了

| # | 項目 | 修正内容 |
|---|------|---------|
| C1 | BottomNav にレシピタブ追加 | `bottom-nav.tsx` に5番目のタブ (BookOpen/Recipe → `/recipes`) を追加 |
| C2 | ADK State にユーザープロフィール注入 | `server.py` に `_build_user_state()` を追加。FirestoreからpersonalColor, skinType, displayName, beautyGoals を取得しセッション状態に注入 |
| C3 | レシピ保存→一覧連携の修正 | `recipe_tools.py` でフィールド名正規化 (title→recipe_name, createdAt→created_at)。API routes で camelCase/snake_case 両対応。レシピID をSSEイベントに注入し「詳しく見る」リンクを機能させた |

### ✅ Important (Phase 1 品質向上) — 全完了

| # | 項目 | 修正内容 |
|---|------|---------|
| I1 | 買い足し提案の楽天リンク | `alchemist.py` に「プラスワン・マジック」セクション追加。楽天検索URL自動生成 |
| I2 | チャット内レシピカード「詳しく見る」リンク | 既に実装済み + レシピID注入で完全動作 |

### Phase 2 先送り項目の完了状況

| # | 項目 | 状態 | 備考 |
|---|------|------|------|
| I3 | 仕上がりプレビュー (Simulator) | ✅ Batch 1 | Gemini 2.0 Flash Image で実装完了 |
| N1 | Freshness Guardian エージェント | 🔜 Phase 3 | 未実装 |
| N2 | Portfolio Analyst エージェント | 🔜 Phase 3 | 未実装 |
| N3 | Memory Service (クロスセッション) | ✅ Batch 2 | InMemoryMemoryService 導入済み |
| N4 | 永続 SessionService | ✅ Batch 2 | DatabaseSessionService (SQLAlchemy) |
| N5 | E2E テスト (Playwright) | ✅ Batch 3 | 12テスト全パス |
| N6 | PWA Service Worker | ✅ Batch 3 | cache-first (static) / network-first (API) |
| N7 | Cloud Run デプロイ | ✅ Batch 3 | Dockerfile + cloudbuild.yaml 構築済み |

---

## 8. Firestore データアーキテクチャ

全永続データは Firestore に保存されています（ローカル保存なし）:

```
firestore_root/
├── users/{userId}/                    ← ユーザープロフィール
│   ├── inventory/ (サブコレクション)  ← 在庫アイテム
│   │   └── {itemId}
│   └── recipes/ (サブコレクション)    ← メイクレシピ
│       └── {recipeId}
```

- Firebase Console では `users` のみ表示されますが、各ユーザードキュメント内にサブコレクションとして `inventory` と `recipes` が存在します
- Python Agent Server (google-cloud-firestore) と Next.js BFF (firebase-admin) の両方が同じパスを参照
- sessionStorage はスキャンワークフローの一時データのみに使用（ブラウザセッション内）

---

## 9. テスト実装状況

| テスト層 | 仕様要件 | 実装済み | 状態 |
|---------|---------|---------|------|
| Unit (Python) | UT-P01〜P14 | 100テスト (Batch 0.5/1/2含む) | ✅ 完了 |
| Unit (Frontend) | UT-F01〜F14 | 127テスト (API + Hook + Component) | ✅ 完了 |
| Integration | INT-01〜INT-08 | API テストで部分カバー | ⚠️ 部分的 |
| API (BFF) | API-01〜API-19 | 19テスト (auth/inventory/chat/recipes) | ✅ 完了 |
| Agent Eval | AGT-01〜AGT-17 | Hallucination テスト実装済み | ⚠️ 部分的 |
| E2E | E2E-01〜E2E-06 | 12テスト (Playwright) | ✅ 完了 |
| Security | SEC-01〜SEC-04 | 3テスト (2ファイル) | ⚠️ 部分的 |
| CI/CD | GitHub Actions | frontend + agent 並列ジョブ | ✅ 完了 |

---

## 10. Phase 2 完了状況 & Phase 3 への引き継ぎ

### Phase 2 (Beta) — ✅ 完了 (Batch 0.5〜8.5)

| バッチ | 内容 | 状態 |
|--------|------|------|
| B0.5 | ショッピング相談（相性チェック・比較） | ✅ |
| B1 | Simulator（仕上がりプレビュー） | ✅ |
| B2 | Memory Service + 永続セッション | ✅ |
| B3 | テスト基盤 + Cloud Run デプロイ + PWA | ✅ |
| B4 | 安定化 + UXポリッシュ | ✅ |
| B5 | Beauty Log + Memory Keeper | ✅ |
| B6 | SNS基本機能（フィード・フォロー・いいね・コメント） | ✅ |
| B7 | Trend Hunter + TPO Tactician | ✅ |
| B8 | Profiler + Makeup Instructor | ✅ |
| B8.5 | UX改善（登録4パターン・フィルタ/ソート・テーマ提案タップ） | ✅ |

**エージェント数: 10体**（Concierge, Inventory, Product Search, Alchemist, Simulator, Memory Keeper, Trend Hunter, TPO Tactician, Profiler, Makeup Instructor）

### Phase 3 (Launch) 残タスク

| バッチ | 内容 | 優先度 |
|--------|------|--------|
| B9 | Content Curator, Health Monitor, Event Strategist, Product Scout | P-Low |
| B10 | B2B基盤 (BigQuery), 商品ページ, レシピツリー, つくれぽ | P-Low |

### 未実装項目
- 使い切りチャレンジ (プログレスバー + バッジ UI)
- Freshness Guardian / Portfolio Analyst エージェント
- BigQuery ML K-means (Profiler 嗜好クラスタリング)
- VertexAiRagMemoryService (Beauty Log RAG ベース記憶)
- カスタムドメイン設定
- Cloud SQL への SessionDB 移行（マルチインスタンス対応）
