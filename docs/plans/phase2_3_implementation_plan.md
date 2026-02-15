# Phase 2+3 統合実装計画

**Date:** 2026-02-15
**Status:** Batch 0.5 + 1 + 2 + 3 + 4 実装完了
**前提:** Phase 1 MVP 完了済み

---

## 0. 実装方針

Phase 2 (Beta) と Phase 3 (Launch) を **10バッチに分割** し、依存関係順に実装する。
各バッチは **独立してデプロイ可能** な単位で設計。

### 優先度基準
- **P-Critical:** ユーザー体験のコアに直結（Simulator, Memory, テスト）
- **P-High:** ユーザーエンゲージメント向上（SNS, Beauty Log）
- **P-Medium:** パーソナライゼーション強化（Trend, TPO, Profiler）
- **P-Low:** ビジネス基盤（B2B, EC拡張）

---

## Batch 0.5: ショッピング相談 — P-High ✅ 実装済み

### 概要
購入検討中の商品と手持ちコスメの相性チェック、2商品の比較機能。
新規エージェントは不要 — Concierge に 2 ツール + プロンプトルーティングを追加。

### 実装内容

| # | タスク | ファイル | Status |
|---|--------|---------|--------|
| 1 | **shopping_tools.py 作成** — `analyze_product_compatibility`, `compare_products_against_inventory` | `agent/alcheme/tools/shopping_tools.py` (新規) | ✅ |
| 2 | **Concierge プロンプト更新** — パターンA (単品相性) / パターンB (2商品比較) のルーティング追加 | `agent/alcheme/prompts/concierge.py` | ✅ |
| 3 | **Concierge ツール登録** — `search_rakuten_api`, `analyze_product_compatibility`, `compare_products_against_inventory` を追加 (4→7ツール) | `agent/alcheme/agents/concierge.py` | ✅ |
| 4 | **進捗メッセージ追加** — `_TOOL_PROGRESS_MAP` にショッピングツール用メッセージ追加 | `agent/server.py` | ✅ |

### 設計方針
- ツールは相性データ（重複リスク、ギャップ分析、類似アイテム）を返す。買う/買わないの判断は LLM が行う
- `_slim_item()`, lazy Firestore singleton パターンを踏襲
- カテゴリ名は EN/JA 両対応で正規化

### 検証
- 「KATE リップモンスターの05番を買おうか迷ってます」→ 相性レポートが返る
- 「CEZANNEのチークとCANMAKEのチーク、どっちがいい？」→ 比較テーブルが返る

---

## Batch 1: Simulator (仕上がりプレビュー) — P-Critical ✅ 実装済み

**Phase 1 繰り越し。PRDで「MVPスキップ不可」と明記。最優先。**

### 概要
Gemini 2.5 Flash (Image Generation) を使って、レシピの仕上がりイメージをAIキャラクターで可視化。

### 実装方針（実際の実装）
サーバーサイド後処理として実装（ADK sub-agent ではなく）。レシピ保存後に `server.py` が直接 Gemini Image Generation API を呼び出し、GCS にアップロードし、`preview_image` SSE イベントを配信。

### 実装内容

| # | タスク | ファイル | Status |
|---|--------|---------|--------|
| 1 | **プロンプト設計** — メイクステップ→顔領域マッピング + 3テーマ (cute/cool/elegant) | `agent/alcheme/prompts/simulator.py` (新規) | ✅ |
| 2 | **generate_preview_image** — Gemini API → GCS upload → Firestore update | `agent/alcheme/tools/simulator_tools.py` (新規) | ✅ |
| 3 | **Agent stub** — Phase 3+ 用の前方互換スタブ | `agent/alcheme/agents/simulator.py` (新規) | ✅ |
| 4 | **SSEイベント: `preview_image`** — recipe_card 後に 15s timeout で生成・配信 | `agent/server.py` | ✅ |
| 5 | **フロントエンド型更新** — `preview_image_url`, `character_theme`, SSE event type | `types/recipe.ts`, `types/chat.ts` | ✅ |
| 6 | **SSE ハンドラ** — `preview_image` イベント処理 | `hooks/use-chat.ts` | ✅ |
| 7 | **レシピカードにプレビュー画像表示** | `components/recipe-card-inline.tsx`, `components/chat-message.tsx` | ✅ |
| 8 | **レシピ詳細ページにプレビュー画像** — テーマラベル付き | `app/(main)/recipes/[recipeId]/page.tsx` | ✅ |
| 9 | **レシピ一覧にサムネイル** | `app/(main)/recipes/page.tsx` | ✅ |

### 技術要件
- Gemini native image generation (`gemini-2.0-flash-exp`, `SIMULATOR_MODEL` env var)
- Cloud Storage (`gs://alcheme-previews/{userId}/{recipeId}.webp`, `GCS_PREVIEW_BUCKET` env var)
- 15s timeout — 超過時はレシピカードのみ表示（画像なし）
- 失敗はログのみ（ユーザーにはエラー非表示）

### 検証
- レシピ生成 → プレビュー画像が表示される
- 3テーマそれぞれで画像が生成される
- Cloud Storage に画像が保存される
- タイムアウト/エラー時もレシピカードは正常表示

---

## Batch 2: Memory Service + 永続セッション — P-Critical ✅ 実装済み

### 概要
InMemorySessionService → DatabaseSessionService (SQLAlchemy) 永続化。InMemoryMemoryService でクロスセッション記憶。

### 実装内容

| # | タスク | ファイル | Status |
|---|--------|---------|--------|
| 1 | **DatabaseSessionService (SQLAlchemy)** — `SESSION_DB_URL` env var で設定 (default: sqlite+aiosqlite) | `agent/server.py` | ✅ |
| 2 | **InMemoryMemoryService 導入** — セッションオーバーフロー時にメモリ抽出 | `agent/server.py` | ✅ |
| 3 | **セッションID安定化** — サーバー主導の `chat-{userId}` 固定ID。フロント/BFF からセッションID送信を廃止 | `hooks/use-chat.ts`, `app/api/chat/route.ts`, `agent/server.py` | ✅ |
| 4 | **コンシェルジュ プロンプト更新** — メモリ活用セクション追加（好み反映、マンネリ防止） | `agent/alcheme/prompts/concierge.py` | ✅ |
| 5 | **依存追加** — `aiosqlite` | `agent/pyproject.toml` | ✅ |
| 6 | **環境設定** — `SESSION_DB_URL` | `agent/.env.example` | ✅ |

### 技術要件
- ADK `DatabaseSessionService` (SQLAlchemy async backend, default: sqlite+aiosqlite)
- ADK `InMemoryMemoryService` でクロスセッション記憶（再起動で消失、Phase 3 で VertexAI RAG に移行予定）
- セッション上限: 20 イベント（超過時にメモリ抽出 → セッションリセット）
- メモリ抽出失敗時はログのみ（セッションローテーションは継続）

### 検証
- サーバー再起動後も会話履歴が維持される
- 過去のレシピ好みが新セッションで反映される

---

## Batch 3: テスト基盤 + Cloud Run デプロイ — P-Critical ✅ 実装済み

### 概要
品質ゲート達成とプロダクション環境構築。

### 実装内容

| # | タスク | ファイル | Status |
|---|--------|---------|--------|
| 1 | **Python Unit Tests** — UT-P01〜P14 (Phase 1 で実装済み) | `agent/tests/test_inventory_tools.py`, `test_recipe_tools.py` 等 (8 files) | ✅ |
| 2 | **Hallucination Test** — AGT-09 (Phase 1 で実装済み) | `agent/tests/test_hallucination.py` | ✅ |
| 3 | **Python Tests — Batch 0.5/1/2 新機能** | `agent/tests/test_shopping_tools.py` (17 tests), `test_simulator_prompts.py` (21 tests), `test_simulator_tools.py` (5 tests) | ✅ |
| 4 | **API Tests** — API-01〜03, 07〜08, 12, 17〜22 | `__tests__/api/auth.test.ts` (3), `inventory.test.ts` (5), `chat.test.ts` (4), `recipes.test.ts` (7) = 19 tests | ✅ |
| 5 | **E2E Tests (Playwright)** — E2E-01〜E2E-05 (Phase 1 で実装済み) | `__tests__/e2e/*.spec.ts` (5 files) | ✅ |
| 6 | **Cloud Run デプロイ** — Dockerfile + cloudbuild.yaml + deploy.sh (Phase 1 で実装済み) | `Dockerfile`, `agent/Dockerfile`, `cloudbuild.yaml`, `scripts/deploy.sh` | ✅ |
| 7 | **PWA Service Worker** — キャッシュ戦略: static=cache-first, API=network-first | `public/sw.js`, `lib/register-sw.ts`, `components/sw-register.tsx` | ✅ |
| 8 | **CI/CD パイプライン** — GitHub Actions: frontend (tsc+vitest) + agent (pytest) の 2 並列ジョブ | `.github/workflows/ci.yml` | ✅ |

### テストカバレッジ
- **Python:** 100 tests (48 new for Batch 0.5/1/2 + 52 existing)
- **Frontend:** 61 tests (19 new API + 42 existing unit/hook/security)
- **E2E:** 5 Playwright specs (auth, scan, recipe, inventory, detail)

### API テスト手法
Next.js App Router のルートハンドラー関数を直接インポートし、`vi.hoisted()` + `vi.mock()` で `firebase-admin` と `@/lib/api/auth` をモック。`NextRequest` を構築してハンドラーを呼び出し、レスポンスの status とボディを検証。

### 品質ゲート
- QG-1: Hallucination Rate = 0% (`test_hallucination.py` で検証)
- QG-7: Unit tests 100% pass (Python 96/100 pass — 4 failures は既存の schema/rakuten テストのエンコーディング問題)
- QG-9: E2E flows pass (5 specs)

---

## Batch 4: 安定化 + UXポリッシュ + デプロイ準備 — P-Critical ✅ 実装済み

### 概要
エラーハンドリング、Toast通知、デプロイ設定修正。（旧Batch 4「楽天/EC連携強化」は Batch 5+ に移動）

### バグ修正（前セッション）
- `/recipes/undefined` ナビゲーション → recipe_id抽出の堅牢化 + 条件付きリンク
- 待機UX改善 (45-60s 静的 "考え中...") → シマーアニメーション + 回転ヒント
- 60sタイムアウト → 120sに延長 + `maxDuration` 設定

### 実装内容

| # | タスク | ファイル | Status |
|---|--------|---------|--------|
| 1 | **Error Boundaries** — Root + Main layout | `app/error.tsx`, `app/(main)/error.tsx` (新規) | ✅ |
| 2 | **Toast通知** — フィードバック送信成功/失敗 | `hooks/use-recipe.ts` | ✅ |
| 3 | **Toast通知** — コスメ登録成功/失敗 | `app/(main)/scan/confirm/page.tsx` | ✅ |
| 4 | **SWRエラー表示** — レシピ一覧、レシピ詳細、インベントリ | `app/(main)/recipes/page.tsx`, `app/(main)/recipes/[recipeId]/page.tsx`, `app/(main)/inventory/page.tsx` | ✅ |
| 5 | **フィードバック送信中状態** — ボタン無効化 | `components/recipe-feedback.tsx` | ✅ |
| 6 | **デプロイ設定修正** — `NEXT_PUBLIC_APP_URL` ビルド引数追加 | `cloudbuild.yaml`, `scripts/deploy.sh` | ✅ |
| 7 | **環境変数ドキュメント** — 全必要変数リスト | `.env.example` (新規) | ✅ |
| 8 | **テスト追加** — Error boundary + Feedback toast | `__tests__/unit/components/error-boundary.test.tsx`, `__tests__/unit/hooks/use-recipe-feedback.test.ts` (新規) | ✅ |

---

## Batch 5: Beauty Log + Memory Keeper — P-High

### 概要
日々のメイク記録機能。AI提案 vs 実績の差分学習基盤。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **Memory Keeper Agent** — セルフィーからメイク自動タグ付け | `agent/alcheme/agents/memory_keeper.py` (新規) |
| 2 | **ツール: save_beauty_log, auto_tag_items** | `agent/alcheme/tools/beauty_log_tools.py` (新規) |
| 3 | **Firestore: beauty_logs コレクション** — `users/{userId}/beauty_logs/{date}` | スキーマ定義 |
| 4 | **Beauty Log ページ** — カレンダー表示 + 日別メイク記録 | `app/(main)/beauty-log/page.tsx` (新規) |
| 5 | **AI提案 vs 実績 差分表示** — 提案時の記録と実行時の差分 | UIコンポーネント |
| 6 | **BottomNav 更新** or **設定からのアクセス** — Beauty Log への導線 | ナビゲーション更新 |

### Firestore スキーマ
```
users/{userId}/beauty_logs/{date}
  - proposed_recipe_id: string     ← AI提案レシピID
  - actual_recipe_id?: string      ← 実際に使ったレシピID
  - selfie_url?: string            ← セルフィー画像URL
  - auto_tags: string[]            ← AI判定のメイク要素
  - user_note?: string             ← ユーザーメモ
  - weather?: string               ← 天気情報
  - mood?: string                  ← 気分
  - created_at: Timestamp
```

---

## Batch 6: SNS基本機能 — P-High

### 概要
レシピ公開・共有、フォロー、いいね、コメントの基本SNS機能。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **Firestore SNSスキーマ** — posts, follows, likes, comments | スキーマ設計 |
| 2 | **レシピ公開トグル** — 公開/非公開切り替え | `app/(main)/recipes/[recipeId]/page.tsx` |
| 3 | **ソーシャルフィード** — 公開レシピのタイムライン | `app/(main)/feed/page.tsx` (新規) |
| 4 | **フォロー機能** — ユーザーフォロー/アンフォロー | API + UI |
| 5 | **いいね/保存** — レシピへのリアクション | API + UI |
| 6 | **コメント** — テキストコメント + クイックリアクション | API + UI |
| 7 | **AIキャラクターイメージ** — Simulatorと連携したプロフィール画像 | Gemini Image Generation |
| 8 | **BottomNav or タブ追加** — フィードへの導線 | ナビゲーション更新 |

### Firestore スキーマ
```
social/posts/{postId}
  - user_id: string
  - recipe_id: string
  - recipe_name: string
  - preview_image_url?: string
  - visibility: "public" | "private"
  - like_count: number
  - comment_count: number
  - arrange_count: number
  - created_at: Timestamp

social/follows/{userId}/following/{followId}
  - created_at: Timestamp

social/likes/{postId}/users/{userId}
  - created_at: Timestamp

social/comments/{postId}/items/{commentId}
  - user_id: string
  - text: string
  - type: "comment" | "reaction"
  - created_at: Timestamp
```

---

## Batch 7: Trend Hunter + TPO Tactician — P-Medium

### 概要
トレンド分析と天気・予定に基づくコンテキスト提案。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **Trend Hunter Agent** — SNSトレンド解析 (ParallelAgent) | `agent/alcheme/agents/trend_hunter.py` (新規) |
| 2 | **TPO Tactician Agent** — 天気API + カレンダー連携 (SequentialAgent) | `agent/alcheme/agents/tpo_tactician.py` (新規) |
| 3 | **ツール: get_weather** — OpenWeatherMap API | `agent/alcheme/tools/weather_tools.py` (新規) |
| 4 | **ツール: get_calendar_events** — Google Calendar API | `agent/alcheme/tools/calendar_tools.py` (新規) |
| 5 | **Concierge ルーティング更新** — Trend/TPO エージェントへの委譲 | `agent/alcheme/agents/concierge.py` |
| 6 | **天気表示UI** — チャット内に天気コンテキスト表示 | UIコンポーネント |

---

## Batch 8: Profiler + Makeup Instructor — P-Medium

### 概要
ユーザー嗜好分析と手順ガイド強化。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **Profiler Agent** — 嗜好クラスタリング、マンネリ検出 | `agent/alcheme/agents/profiler.py` (新規) |
| 2 | **Makeup Instructor Agent** — 代用テクニックの詳細手順 | `agent/alcheme/agents/instructor.py` (新規) |
| 3 | **ツール: analyze_preference_history** — Beauty Log分析 | `agent/alcheme/tools/profiler_tools.py` (新規) |
| 4 | **使い切りチャレンジ** — プログレスバー + バッジ | `app/(main)/challenges/page.tsx` (新規) |
| 5 | **Concierge プロンプト更新** — Profiler/Instructor への委譲 | `agent/alcheme/prompts/concierge.py` |

---

## Batch 9: Phase 3 エージェント群 — P-Low

### 概要
Content Curator, Health Monitor, Event Strategist, Product Scout。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **Content Curator** — 手持ちアイテムを使うYouTube動画/レシピ逆引き | `agent/alcheme/agents/content_curator.py` (新規) |
| 2 | **Health Monitor** — Google Fit / Apple HealthKit 連携 | `agent/alcheme/agents/health_monitor.py` (新規) |
| 3 | **Event Strategist** — カレンダーイベント → 逆算美容ToDoリスト | `agent/alcheme/agents/event_strategist.py` (新規) |
| 4 | **Product Scout** — Rakuten/Amazon リアルタイム在庫検索 | `agent/alcheme/agents/product_scout.py` (新規) |
| 5 | **Concierge ルーティング最終更新** — 全14エージェントへのルーティング | `agent/alcheme/agents/concierge.py` |

---

## Batch 10: B2B基盤 + SNS拡張 — P-Low

### 概要
BigQueryデータ分析基盤、商品ページ自動生成、レシピツリー可視化。

### 実装内容

| # | タスク | ファイル |
|---|--------|---------|
| 1 | **BigQuery プロジェクト設定** — レシピ/在庫データのETL | インフラ設定 |
| 2 | **Pub/Sub イベントストリーミング** — レシピ公開 → 集計更新 | Cloud Functions |
| 3 | **商品ページ自動生成** — 全レシピで使用されている商品の集約ページ | `app/(main)/products/[productId]/page.tsx` (新規) |
| 4 | **レシピツリー可視化** — オリジナル → アレンジの連鎖表示 | `app/(main)/recipes/[recipeId]/tree/page.tsx` (新規) |
| 5 | **タグコミュニティ (Nook)** — #イエベ春 #プチプラ 等 | `app/(main)/community/page.tsx` (新規) |
| 6 | **B2Bダッシュボード** — 管理者向けトレンドレポート | `app/(admin)/dashboard/page.tsx` (新規) |
| 7 | **つくれぽ (アレンジ投稿)** — 他ユーザーレシピを自分の在庫でアレンジ | APIエンドポイント + UI |

---

## 実装順序と依存関係

```
Batch 1 (Simulator) ──┐
                       ├──→ Batch 4 (楽天EC) ──→ Batch 6 (SNS基本) ──→ Batch 10 (B2B+SNS拡張)
Batch 2 (Memory) ─────┘                            │
                                                     ├──→ Batch 7 (Trend+TPO)
Batch 3 (Tests+Deploy) ──────────────────────────────┘         │
                                                                ├──→ Batch 9 (Phase 3 Agents)
Batch 5 (Beauty Log) ──→ Batch 8 (Profiler+Instructor) ───────┘
```

### Phase マッピング

| バッチ | Phase | 依存 | 新規エージェント数 |
|--------|-------|------|-------------------|
| B1 | 2 | なし | +1 (Simulator) |
| B2 | 2 | なし | 0 (インフラ) |
| B3 | 2 | B1, B2 | 0 (テスト) |
| B4 | 2 | なし | 0 (EC強化) |
| B5 | 2 | B2 | +1 (Memory Keeper) |
| B6 | 2 | B1 | 0 (SNS) |
| B7 | 2+3 | B3, B6 | +2 (Trend, TPO) |
| B8 | 2 | B5 | +2 (Profiler, Instructor) |
| B9 | 3 | B7, B8 | +4 (Curator, Health, Event, Scout) |
| B10 | 3 | B6, B9 | 0 (B2B+SNS) |

---

## エージェント総数ロードマップ

| Phase | エージェント | 累計 |
|-------|------------|------|
| Phase 1 (完了) | Concierge, Inventory, Alchemist, Product Search | 4 |
| Phase 2 B1 | + Simulator | 5 |
| Phase 2 B5 | + Memory Keeper | 6 |
| Phase 2 B7 | + Trend Hunter, TPO Tactician | 8 |
| Phase 2 B8 | + Profiler, Makeup Instructor | 10 |
| Phase 3 B9 | + Content Curator, Health Monitor, Event Strategist, Product Scout | 14 |

---

## Firestore コレクション拡張計画

### Phase 1 (現状)
```
users/{userId}/
  ├── inventory/{itemId}
  └── recipes/{recipeId}
```

### Phase 2 追加
```
users/{userId}/
  ├── inventory/{itemId}
  ├── recipes/{recipeId}
  └── beauty_logs/{date}          ← NEW: Beauty Log

social/
  ├── posts/{postId}              ← NEW: 公開レシピ
  ├── follows/{userId}/following/{followId}  ← NEW
  ├── likes/{postId}/users/{userId}         ← NEW
  └── comments/{postId}/items/{commentId}   ← NEW
```

### Phase 3 追加
```
products/{productId}              ← NEW: 商品ページ (自動生成)
communities/{tagId}/              ← NEW: タグコミュニティ
  └── members/{userId}
analytics/                        ← NEW: B2Bデータ (BigQuery連携)
```

---

## 成功指標

| Phase | 指標 | 目標値 |
|-------|------|--------|
| Phase 2 | DAU/MAU | 40%+ |
| Phase 2 | Hallucination Rate | 0% |
| Phase 2 | AI提案採用率 | 70%+ |
| Phase 2 | ベータユーザー数 | 500人 |
| Phase 3 | NPS | 60+ |
| Phase 3 | コミュニティ投稿 | 月間10,000件+ |
| Phase 3 | ユーザー数 | 5,000人+ |

---

## 次のアクション

1. **Batch 1 (Simulator) と Batch 2 (Memory) を並行開始**
2. Batch 3 (Tests + Deploy) はBatch 1/2 と並行で進行可能
3. Batch 4 (楽天EC) は独立して開始可能
4. Batch 5 (Beauty Log) は Batch 2 完了後に開始
