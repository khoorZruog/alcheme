# alche:me — Claude Code 開発指示書

> **このファイルは Claude Code が最初に読むべきエントリーポイントです。**
> Phase 1 MVP の開発を自律的に進めるために必要な全コンテキストを集約しています。

| | |
|---|---|
| **Version** | 1.6 |
| **Date** | 2026-02-17 |
| **Product** | alche:me（アルケミー） |
| **Phase** | Phase 2 Complete → Phase 2.5 (バグ修正 + Quick Wins) → Phase 3 |
| **Author** | Eri Kaneko (Product Owner) |

### Changelog

| Version | Date | 変更内容 |
|---------|------|---------|
| 1.0 | 2026-02-13 | 初版作成 |
| 1.1 | 2026-02-14 | §1 ドキュメント読み順にプロンプトカタログ・UI仕様書を追加。§5 をボイラープレートからの移行ガイドに全面改訂。§12 週次ロードマップを現状反映。 |
| 1.2 | 2026-02-14 | PRD v4 整合: §2 トーンからRPGメタファー指示を削除（PRD §5.3準拠）。§8.1 ユーザープロフィールをLIPS水準に拡張。§8.1 インベントリスキーマをAppendix C準拠に拡張。§3.2 F9 の名称をコスメ用語に変更。 |
| 1.3 | 2026-02-14 | PRD v4 アライメントレビュー反映（全18項目）: §0 RPG表現をモチーフ表現に修正(B-5)。§7 sample_inventory.json 注記追加(A-2)。§8.1 stats スキーマをコスメ用語4軸(pigment/longevity/shelf_life/natural_finish)に統一(A-1)。§8.1 status フィールドに Phase 2 拡張注記追加(A-4)。§8.1 stats 内部1-5/UI変換ルール明記(A-5)。§5.2 auth-provider コンテキスト拡張一覧を更新。§5.2 onboarding パスを(auth)レイアウトに移動(C-4)。§5.4 ディレクトリ構造で onboarding を(auth)配下に移動(C-4)。§5.4 docs/ 内の prompts-catalog 参照を v2 に修正(D-2/D-3)。 |
| 1.4 | 2026-02-15 | **Phase 1 完了**: リアルタイム進捗表示、おまかせテーマ提案、get_today_context ツール、BottomNav レシピタブ、ADK State プロフィール注入、買い足し楽天リンク、レシピ保存フロー修正（フィールド名正規化）。Phase 1 完了監査実施。Phase 2+3 実装計画策定。 |
| 1.5 | 2026-02-16 | **Phase 2 完了 (Batch 0.5〜8.5)**: Agent Engine→Cloud Run+FastAPI+ADK Runner に全面移行。ドキュメント整合性更新（設計書・実装計画・監査レポート）。アーキテクチャ: 2サービス構成 (alcheme-web + alcheme-agent)、Cloud Build CI/CD、10エージェント体制。 |
| 1.6 | 2026-02-17 | **Phase 2 完了後のユーザーテスト実施**: 既知バグ2件（天気API / 買い足し手動追加）発見・記録。残存タスク・バックログ文書作成 (`backlog_and_remaining_tasks.md`)。手動E2Eテストガイド v2.0（233テストケース）。βテストガイド v2.0。Phase 2.5〜3 のロードマップ策定。 |

---

## 0. クイックコンテキスト（30秒で理解）

**alche:me** は、手持ちのコスメ在庫から最適なメイクレシピを AI エージェントが提案するアプリ。「錬金術」を世界観のモチーフに、「コスメ迷子」の女性が毎朝のメイクで新しい自分に出会える体験を作る。

**Phase 0（完了）:** Zenn ハッカソンで Streamlit + ADK のプロトタイプを構築。コア機能（画像→在庫登録→レシピ生成）の動作を確認済み。

**Phase 1（完了）:** Next.js Web アプリ + Firebase + ADK エージェントによる MVP。4エージェント（Concierge, Inventory, Product Search, Alchemist）。

**Phase 2（完了 — Batch 0.5〜8.5）:** 10エージェント体制。Simulator、Memory、SNS、Beauty Log、Trend/TPO、Profiler/Instructor。UX改善（登録4パターン、フィルタ/ソート、テーマ提案タップ）。Cloud Run 2サービス構成でデプロイ。

**現在地:** Phase 2 全バッチ完了。テスト全パス（E2E 12、Unit 127）。Cloud Run デプロイ済み。デプロイ後のユーザーテストで既知バグ2件（天気API / 買い足し手動追加）を発見。残存タスク・改善提案を `backlog_and_remaining_tasks.md` に整理済み。次のステップは Phase 2.5（バグ修正 + Quick Wins）→ Phase 3（UX改善 + 機能拡張）。

---

## 1. ドキュメント読み順（必ずこの順番で）

Claude Code は作業開始前に、以下のドキュメントを**この順番で**読んでください。

| 順序 | ファイル | 読む目的 | 重点セクション |
|------|---------|--------|-------------|
| 1 | **本ファイル（これ）** | 全体像とルールの把握 | 全セクション。特に **§5 移行ガイド**を必読 |
| 2 | `alcheme_rollout-plan_phase-0.md` | Phase 0 の成果物と Phase 1 スコープの把握 | §3（実装済みコンポーネント）、§5（Phase 1 スコープ）、§6（技術的注意事項）、§7（コード再利用マップ） |
| 3 | `alcheme_PRD_v4.md` | 要件とユースケースの把握 | §5（要件 — P0/P1 優先度）、§9（ロードマップ）、Appendix C（データスキーマ） |
| 4 | `alcheme_design-doc_v1.md` | 技術設計の把握 | §2（アーキテクチャ）、§4（データモデル）、§5（API設計）、§6（エージェント設計）、付録B（ADR） |
| 5 | `alcheme_prompts-catalog_v3.md` | **エージェントプロンプトの実装仕様** | §2-5（各エージェントのプロンプト・JSON I/O）、§7（Hallucination 防止ルール）、§8（テストシナリオ） |
| 6 | `alcheme_ui-specs_phase1_v2.md` | **フロントエンド画面仕様** | §1（デザインシステム）、§2（画面遷移）、§4-13（各画面のワイヤーフレーム・コンポーネント）、§14（アニメーション）、§16（ファイル対応表） |
| 7 | `adk_docs_build-agents.md` | ADK の使い方 | §3-7（エージェント種類・マルチエージェント）、§8-9（ツール）、§14（alche:me 適用ノート） |
| 8 | `adk_docs_components.md` | ADK コンポーネント詳細 | Session/State/Artifact、§13（alche:me 適用メモ） |
| 9 | `COSME_MIXOLOGIST_HANDOFF.md` | Phase 0 コードの詳細 | エージェント設計、ツール関数 |
| 10 | `sample_inventory.json` | テストデータ確認 | 全体（15アイテム） |

---

## 2. プロダクト名とブランディング

### リネーム規則

Phase 0 コード内の旧名称を以下のように置換すること。

| 旧名称 | 新名称 | 適用箇所 |
|--------|--------|---------|
| `Cosme Mixologist` | `alche:me` | UIテキスト、README、ドキュメント |
| `cosme_mixologist` | `alcheme` | Python パッケージ名、ディレクトリ名、変数名 |
| `cosme-mixologist` | `alcheme` | npm パッケージ名、URL パス |
| `APP_NAME = "cosme_mixologist"` | `APP_NAME = "alcheme"` | ADK Runner の app_name |

### トーン＆ボイス

- コンセプト: 「手持ちコスメで、まだ見ぬ私に出会う」
- UI テキストは**親しみやすく、ワクワクする美容部員**のトーン
- 錬金術の世界観は内部処理名（agent名、stats フィールド名等）に留め、ユーザー向けUIテキストやチャット出力では**美容・コスメ用語**で表現する。ゲーム用語（クエスト、デッキ、錬成、攻撃力、防御力、デバフ等）は使用せず、コスメ・ファッション好きな20-30代女性に自然に馴染む「美容の楽しさ」に寄せたワーディングとする（PRD §5.3 準拠）。
- エラーメッセージも世界観を壊さない表現にする

---

## 3. Phase 1 MVP スコープ

### 3.1 ゴールと制約

| 項目 | 内容 |
|------|------|
| **期間** | 4週間（Month 2-3） |
| **ゴール** | クローズドβ 50人が使える Web アプリ |
| **エージェント数** | 4体（Inventory Manager + Product Search + Alchemist + Concierge） |
| **フロントエンド** | Next.js 16 + React 19 + TypeScript + Tailwind CSS + shadcn/ui |
| **バックエンド** | Cloud Run (FastAPI + ADK Runner) |
| **認証** | Firebase Auth (Email/Password + Google OAuth) |
| **DB** | Cloud Firestore |
| **ストレージ** | Cloud Storage |
| **ゲーミフィケーション** | カード化・スキャン演出（基本的なもの）。ゲーム用語は使わず美容の楽しさに寄せた演出 |

### 3.2 Phase 1 で実装する機能（P0 = Must Have）

| # | 機能 | 優先度 | 説明 |
|---|------|--------|------|
| F1 | ユーザー認証 | P0 | Firebase Auth。Email/Password + Google OAuth |
| F2 | コスメスキャン | P0 | カメラ/画像アップロード → Gemini Vision で解析 → 候補表示 → 確認して登録 |
| F3 | 在庫一覧 | P0 | カードUI で在庫表示。カテゴリフィルタ、検索 |
| F4 | メイクレシピ生成 | P0 | 手持ち在庫のみでレシピ生成。Hallucination 厳禁 |
| F5 | チャット対話 | P0 | Concierge Bot との自然言語会話。SSE ストリーミング |
| F6 | レシピフィードバック | P0 | ワンタップ評価（♡/△/×） |
| F7 | 商品検索補完 | P0 | Product Search Agent。画像認識で特定できない商品を Google 検索 + 楽天 API で補完 |
| F8 | 鑑定演出 | P1 | スキャン時に「レアアイテム発見！」等のエフェクト |
| F9 | コスメスペック | P1 | 各アイテムに発色力・持続力・製品寿命・ナチュラルさ等のスペックを付与し、美容用語で表示 |
| F10 | 仕上がりプレビュー | P1 | Gemini 2.5 Flash Image で AI キャラクター画像にメイク合成 |

### 3.3 Phase 1 で実装しないもの（明示的スコープ外）

- SNS/コミュニティ機能（Phase 2）
- 今日のメイク提案 / モーニングルーティン（Phase 2）
- Beauty Log / メイクカレンダー（Phase 2）
- ヒットパン・ゲージ / Project Pan（Phase 2）
- デッキ機能（Phase 3）
- EC 購入導線（Phase 3）
- B2B データインテリジェンス（Phase 3）
- ネイティブアプリ（Phase 4）

---

## 4. 技術スタックと設計方針

### 4.1 技術スタック

```
Frontend:
  Next.js 16 (App Router, React 19, TypeScript)
  Tailwind CSS + shadcn/ui
  PWA 対応（Service Worker, manifest.json）

Backend:
  Python 3.12+
  Google ADK (google-adk)
  FastAPI（BFF から Agent Engine への橋渡し、または直接ホスト）

AI/Agent:
  Gemini 2.5 Flash（メイン推論・画像認識 — Vertex AI 経由）
  Gemini 2.5 Pro（複雑な推論タスク用、コスト注意）
  Gemini 2.0 Flash（仕上がりプレビュー画像生成 — us-central1）

Infrastructure:
  Firebase Auth
  Cloud Firestore
  Cloud Storage
  Cloud Run（2サービス: web + agent）
  Cloud Build (CI/CD) + GitHub Actions (lint/test)
```

### 4.2 アーキテクチャパターン

**BFF（Backend for Frontend）パターン**を採用。2つの Cloud Run サービスで構成。

```
[Next.js Frontend + PWA]
        │
        │ HTTPS (REST + SSE)
        ▼
[Cloud Run: alcheme-web]
  Next.js API Routes (BFF)
  - Firebase Auth Token 検証
  - レート制限
  - リクエスト整形
  - SSEストリーミング中継
        │
        │ REST (X-API-Key 認証)
        ▼
[Cloud Run: alcheme-agent]
  FastAPI + ADK Runner
  root_agent (Concierge) — 10 sub-agents
  ├── inventory_agent, product_search_agent
  ├── alchemist_agent, simulator (後処理)
  ├── memory_keeper, trend_hunter, tpo_tactician
  └── profiler, makeup_instructor
        │
        ▼
[Cloud Firestore] [Cloud Storage] [Gemini via Vertex AI] [External APIs]
```

**CI/CD:** `cloudbuild.yaml` で main ブランチ push 時に両サービスを自動デプロイ。GitHub Actions で lint/type-check/test を実行。

### 4.3 設計原則（Design Doc ADR より）

1. **ADR-001:** Next.js API Routes を BFF として採用。フロントエンドから Agent Engine への直接通信は行わない。
2. **ADR-002:** Cloud Run + FastAPI + ADK Runner を採用（当初 Agent Engine を検討したが、SSE/カスタムセッション管理の要件から Cloud Run を選択）。
3. **ADR-003:** 自社コスメ DB は構築しない。AI 画像認識 + Google Search + 楽天 API + Gemini 世界知識 + ユーザー登録データで補完。
4. **ADR-004:** 仕上がりプレビューは AI キャラクターイメージ方式。ユーザー顔写真は使わない（肖像権リスク回避）。

---

## 5. ボイラープレートからの移行ガイド（⚠️ 最重要セクション）

### 5.1 現状（ボイラープレート）

プロジェクトには Next.js + Firebase + shadcn/ui のボイラープレートが存在する。これは**チケット管理 + RBAC + 汎用AIワークフロー**のテンプレートであり、alche:me のドメインロジックは含まれていない。

**活用可能な資産:**
- Firebase Auth 認証基盤（login/signup/Google OAuth/session middleware）
- Firebase Admin SDK 初期化（ADC/cert 自動切替）
- Firestore 汎用 CRUD ヘルパー
- Cloud Storage 操作
- shadcn/ui コンポーネント群（button, card, input, badge 等）
- App Router レイアウト構造のパターン
- セッション Cookie 管理（middleware.ts）
- Dockerfile + cloudbuild.yaml

**削除すべきもの（alche:me に不要）:**
- チケット関連すべて（types, API routes, Firestore 操作）
- RBAC / Custom Claims ロール管理
- Vertex AI agents（coordinator/research/writer/orchestrator） — alche:me は Python ADK を使用
- ダークモード（theme-provider.tsx）— alche:me は固定テーマ
- dashboard/agents/tickets ページ

### 5.2 移行マップ（ファイル単位）

#### 🟢 流用（そのまま or 軽微な修正）

| 現在のファイル | alche:me での扱い | 修正内容 |
|-------------|-----------------|---------|
| `middleware.ts` | **流用** | ルート保護のパス一覧を `/chat`, `/scan`, `/inventory`, `/recipes`, `/settings` に書き換え |
| `next.config.ts` | **流用** | そのまま |
| `tailwind.config.js` | **流用 + 拡張** | `alcheme` カスタムカラーと `fontFamily` を追加（ui-specs §1.1, 1.2 参照） |
| `tsconfig.json` | **流用** | そのまま |
| `package.json` | **流用 + 依存追加** | `framer-motion`, `swr` 追加。不要な依存削除 |
| `components.json` | **流用** | そのまま |
| `Dockerfile` | **流用** | そのまま |
| `cloudbuild.yaml` | **流用** | そのまま |
| `lib/utils.ts` | **流用** | そのまま（`cn()` ヘルパー） |
| `lib/firebase/client.ts` | **流用** | そのまま |
| `lib/firebase/admin.ts` | **流用** | そのまま（ADC/cert 自動切替） |
| `lib/firebase/auth.ts` | **流用** | そのまま（login, signup, Google OAuth, logout） |
| `lib/firebase/firestore.ts` | **流用** | 汎用 CRUD はそのまま活用 |
| `lib/firebase/storage.ts` | **流用** | そのまま |
| `components/ui/*.tsx` | **流用** | 全 shadcn/ui コンポーネントをそのまま利用。追加で `dialog, drawer, sheet, tabs, scroll-area, skeleton, separator, progress, toast, textarea, toggle-group, dropdown-menu` をインストール |
| `components/auth/auth-provider.tsx` | **流用 + 拡張** | `user` に加え `displayName`, `bio`, `personalColor`, `skinType`, `skinTone`, `hairType`, `bodyType`, `faceType`, `occupation`, `interests`, `favoriteBrands`, `agentTheme` をコンテキストに追加。§8.1 users スキーマ参照 |
| `components/auth/login-form.tsx` | **流用 + UI変更** | alche:me ブランドカラー・コピーに変更（ui-specs §4 参照） |
| `components/auth/signup-form.tsx` | **流用 + UI変更** | 同上 |
| `app/layout.tsx` | **流用 + 修正** | ThemeProvider 削除、フォント設定変更（Noto Sans JP + Zen Maru Gothic）、PWA メタタグ追加 |
| `app/globals.css` | **流用 + 修正** | ダークモード CSS 変数を削除、alche:me カスタム変数に置換 |
| `app/(auth)/layout.tsx` | **流用** | 中央寄せレイアウトをそのまま利用 |
| `app/(auth)/login/page.tsx` | **流用 + UI変更** | alche:me ログイン画面に変更（ui-specs §4 参照） |
| `app/(auth)/signup/page.tsx` | **流用 + UI変更** | 同上 |
| `app/api/auth/session/route.ts` | **流用** | セッション Cookie 管理はそのまま |

#### 🟡 リネーム + リファクタ

| 現在のファイル | alche:me での対応 | 変更内容 |
|-------------|-----------------|---------|
| `app/(protected)/` | → `app/(main)/` | ルートグループ名を変更 |
| `app/(protected)/layout.tsx` | → `app/(main)/layout.tsx` | ナビバーを BottomNav に置換（ui-specs §3 参照）。ダッシュボード的なレイアウトからモバイルファーストに変更 |
| `types/index.ts` | → `types/inventory.ts` + `types/recipe.ts` + `types/chat.ts` | チケット型を削除、alche:me 型定義に置換（§8 データモデル参照） |

#### 🔴 削除

| 現在のファイル | 理由 |
|-------------|------|
| `lib/firebase/tickets.ts` | チケット固有ロジック。不要 |
| `lib/firebase/roles.ts` | RBAC。alche:me は単一ロール |
| `lib/vertexai/` **ディレクトリ全体** | TypeScript Vertex AI agents。alche:me は Python ADK を使用 |
| `components/theme-provider.tsx` | ダークモード不要 |
| `components/ai/workflow-panel.tsx` | 汎用ワークフローUI。不要 |
| `app/(protected)/dashboard/` | チケットダッシュボード。不要 |
| `app/(protected)/agents/` | 汎用AIエージェントページ。不要 |
| `app/(protected)/tickets/` | チケット管理ページ。不要 |
| `app/api/ai/` **ディレクトリ全体** | TypeScript AI 生成 API。alche:me は Python ADK 経由 |
| `app/api/tickets/` **ディレクトリ全体** | チケット API。不要 |

#### 🔵 新規作成

| 新規ファイル/ディレクトリ | 仕様参照先 |
|----------------------|----------|
| **ページ** | |
| `app/(main)/chat/page.tsx` | ui-specs §6（ホーム/チャット） |
| `app/(main)/scan/page.tsx` | ui-specs §7（コスメスキャン） |
| `app/(main)/scan/confirm/page.tsx` | ui-specs §8（鑑定演出 + 確認） |
| `app/(main)/inventory/page.tsx` | ui-specs §9（在庫一覧） |
| `app/(main)/inventory/[itemId]/page.tsx` | ui-specs §10（アイテム詳細） |
| `app/(main)/recipes/page.tsx` | ui-specs §12（レシピ一覧） |
| `app/(main)/recipes/[recipeId]/page.tsx` | ui-specs §11（レシピカード） |
| `app/(main)/settings/page.tsx` | ui-specs §13（設定） |
| `app/(auth)/onboarding/page.tsx` | ui-specs §5（オンボーディング） |
| **API Routes** | |
| `app/api/inventory/route.ts` | 本ファイル §9（GET 在庫一覧） |
| `app/api/inventory/scan/route.ts` | 本ファイル §9（POST スキャン） |
| `app/api/inventory/confirm/route.ts` | 本ファイル §9（POST 登録確定） |
| `app/api/inventory/[itemId]/route.ts` | 本ファイル §9（PATCH, DELETE） |
| `app/api/chat/route.ts` | 本ファイル §9（POST SSE ストリーミング） |
| `app/api/recipes/route.ts` | 本ファイル §9（GET 一覧） |
| `app/api/recipes/[recipeId]/route.ts` | 本ファイル §9（GET 詳細） |
| `app/api/recipes/[recipeId]/feedback/route.ts` | 本ファイル §9（POST 評価） |
| `app/api/users/me/route.ts` | 本ファイル §9（GET, PATCH プロフィール） |
| **コンポーネント** | |
| `components/bottom-nav.tsx` | ui-specs §3.2 |
| `components/page-header.tsx` | ui-specs §3.3 |
| `components/cosme-card.tsx` | ui-specs §9.3 |
| `components/cosme-card-mini.tsx` | ui-specs §11.2 |
| `components/appraisal-card.tsx` | ui-specs §8.3 |
| `components/appraisal-effect.tsx` | ui-specs §14.2 |
| `components/recipe-card-inline.tsx` | ui-specs §6.2 |
| `components/recipe-step-card.tsx` | ui-specs §11.2 |
| `components/recipe-feedback.tsx` | ui-specs §11.2 |
| `components/stat-bar.tsx` | ui-specs 共通 |
| `components/rarity-badge.tsx` | ui-specs 共通 |
| `components/category-filter.tsx` | ui-specs §9.2 |
| `components/remaining-bar.tsx` | ui-specs 共通 |
| `components/chat-message.tsx` | ui-specs §6.2 |
| `components/chat-input.tsx` | ui-specs §6.2 |
| `components/quick-action-chips.tsx` | ui-specs §6.2 |
| `components/scan-camera.tsx` | ui-specs §7.3 |
| `components/item-edit-sheet.tsx` | ui-specs §8.4 |
| `components/empty-state.tsx` | ui-specs 共通 |
| `components/loading-skeleton.tsx` | ui-specs 共通 |
| **Hooks** | |
| `hooks/use-auth.ts` | ui-specs §15.3（AuthProvider を拡張） |
| `hooks/use-inventory.ts` | ui-specs §15.3 |
| `hooks/use-chat.ts` | ui-specs §15.3 |
| `hooks/use-recipes.ts` | ui-specs §15.3 |
| **Lib** | |
| `lib/api-client.ts` | BFF API クライアント（fetch ラッパー） |
| **Agent（Python、別ディレクトリ）** | |
| `agent/` | 本ファイル §10、Design Doc §6、prompts-catalog 参照 |

### 5.3 移行の実行順序

```
Step 1: 削除（不要ファイルを除去して認知負荷を下げる）
  └── tickets, roles, vertexai, theme-provider, workflow-panel, 不要ページ・API

Step 2: リネーム + 基盤修正
  └── (protected) → (main), types 再構成, tailwind 拡張, layout 修正

Step 3: 共通コンポーネント作成
  └── bottom-nav, page-header, stat-bar, rarity-badge, remaining-bar, empty-state

Step 4: 各画面を順番に実装
  └── S01(ログイン) → S02(オンボーディング) → S04(スキャン) → S05(鑑定)
  └── → S06(在庫一覧) → S07(アイテム詳細)
  └── → S03(チャット) → S08(レシピカード) → S09(レシピ一覧) → S10(設定)

Step 5: API Routes 実装
  └── auth(既存) → inventory → chat(SSE) → recipes

Step 6: agent/ ディレクトリ作成（Python ADK）
  └── prompts-catalog の定義をそのまま実装
```

### 5.4 ターゲットリポジトリ構造

移行完了後の最終形。

```
alcheme/
├── README.md
├── .github/
│   └── workflows/
│       ├── ci-frontend.yml
│       └── ci-agent.yml
│
├── .env.local                   # 環境変数
├── middleware.ts                 # ルート保護
├── next.config.ts
├── tailwind.config.js           # alcheme カスタムカラー追加済み
├── postcss.config.js
├── tsconfig.json
├── package.json
├── components.json
├── Dockerfile
├── cloudbuild.yaml
│
├── types/
│   ├── inventory.ts             # InventoryItem, Category, Stats
│   ├── recipe.ts                # RecipeCard, RecipeStep
│   └── chat.ts                  # ChatMessage
│
├── lib/
│   ├── utils.ts                 # cn()
│   ├── api-client.ts            # BFF fetch ラッパー
│   └── firebase/
│       ├── client.ts            # Client SDK（既存流用）
│       ├── admin.ts             # Admin SDK（既存流用）
│       ├── auth.ts              # 認証関数（既存流用）
│       ├── firestore.ts         # 汎用 CRUD（既存流用）
│       └── storage.ts           # Cloud Storage（既存流用）
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-inventory.ts
│   ├── use-chat.ts
│   └── use-recipes.ts
│
├── components/
│   ├── ui/                      # shadcn/ui（既存 + 追加インストール）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx            # 在庫一覧のテーブルビューで利用可能
│   │   ├── textarea.tsx         # 追加
│   │   ├── dialog.tsx           # 追加
│   │   ├── sheet.tsx            # 追加
│   │   ├── tabs.tsx             # 追加
│   │   ├── progress.tsx         # 追加
│   │   ├── skeleton.tsx         # 追加
│   │   ├── toast.tsx            # 追加
│   │   ├── toggle-group.tsx     # 追加
│   │   ├── dropdown-menu.tsx    # 追加
│   │   ├── scroll-area.tsx      # 追加
│   │   ├── separator.tsx        # 追加
│   │   └── avatar.tsx           # 追加
│   │
│   ├── auth/
│   │   ├── auth-provider.tsx    # 既存 + personalColor/skinType 拡張
│   │   ├── login-form.tsx       # 既存 → alche:me UI に変更
│   │   └── signup-form.tsx      # 既存 → alche:me UI に変更
│   │
│   ├── bottom-nav.tsx           # 新規
│   ├── page-header.tsx          # 新規
│   ├── cosme-card.tsx           # 新規
│   ├── cosme-card-mini.tsx      # 新規
│   ├── appraisal-card.tsx       # 新規
│   ├── appraisal-effect.tsx     # 新規
│   ├── recipe-card-inline.tsx   # 新規
│   ├── recipe-step-card.tsx     # 新規
│   ├── recipe-feedback.tsx      # 新規
│   ├── stat-bar.tsx             # 新規
│   ├── rarity-badge.tsx         # 新規
│   ├── category-filter.tsx      # 新規
│   ├── remaining-bar.tsx        # 新規
│   ├── chat-message.tsx         # 新規
│   ├── chat-input.tsx           # 新規
│   ├── quick-action-chips.tsx   # 新規
│   ├── scan-camera.tsx          # 新規
│   ├── item-edit-sheet.tsx      # 新規
│   ├── empty-state.tsx          # 新規
│   └── loading-skeleton.tsx     # 新規
│
├── app/
│   ├── layout.tsx               # 既存修正（ThemeProvider削除、フォント変更）
│   ├── globals.css              # 既存修正（ダークモード削除、alcheme テーマ）
│   ├── page.tsx                 # ランディング / ログイン導線
│   │
│   ├── (auth)/
│   │   ├── layout.tsx           # 既存流用
│   │   ├── login/page.tsx       # 既存 → alche:me UI
│   │   ├── signup/page.tsx      # 既存 → alche:me UI
│   │   └── onboarding/page.tsx  # 新規（BottomNav なしの中央寄せレイアウト）
│   │
│   ├── (main)/                  # ★ (protected) からリネーム
│   │   ├── layout.tsx           # ★ BottomNav レイアウトに全面改訂
│   │   ├── chat/page.tsx        # 新規
│   │   ├── scan/
│   │   │   ├── page.tsx         # 新規
│   │   │   └── confirm/page.tsx # 新規
│   │   ├── inventory/
│   │   │   ├── page.tsx         # 新規
│   │   │   └── [itemId]/page.tsx # 新規
│   │   ├── recipes/
│   │   │   ├── page.tsx         # 新規
│   │   │   └── [recipeId]/page.tsx # 新規
│   │   └── settings/page.tsx    # 新規
│   │
│   └── api/
│       ├── auth/session/route.ts    # 既存流用
│       ├── users/me/route.ts        # 新規
│       ├── inventory/
│       │   ├── route.ts             # 新規（GET 一覧）
│       │   ├── scan/route.ts        # 新規（POST スキャン）
│       │   ├── confirm/route.ts     # 新規（POST 登録確定）
│       │   └── [itemId]/route.ts    # 新規（PATCH, DELETE）
│       ├── chat/route.ts            # 新規（POST SSE ストリーミング）
│       └── recipes/
│           ├── route.ts             # 新規（GET 一覧）
│           └── [recipeId]/
│               ├── route.ts         # 新規（GET 詳細）
│               └── feedback/route.ts # 新規（POST 評価）
│
├── public/
│   ├── manifest.json            # PWA マニフェスト（新規）
│   └── icons/                   # PWA アイコン（新規）
│
├── agent/                       # ★ Python ADK エージェント（新規ディレクトリ）
│   ├── pyproject.toml
│   ├── .env.example
│   ├── alcheme/
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── concierge.py
│   │   │   ├── inventory.py
│   │   │   ├── product_search.py
│   │   │   └── alchemist.py
│   │   ├── prompts/
│   │   │   ├── __init__.py
│   │   │   ├── concierge.py
│   │   │   ├── inventory.py
│   │   │   ├── product_search.py
│   │   │   └── alchemist.py
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── inventory_tools.py
│   │   │   ├── recipe_tools.py
│   │   │   └── rakuten_api.py
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── inventory.py
│   │       └── recipe.py
│   ├── tests/
│   │   ├── test_inventory_tools.py
│   │   ├── test_alchemist.py
│   │   └── eval/
│   │       └── test_recipe_quality.py
│   └── Dockerfile
│
├── shared/
│   └── sample_inventory.json
│
├── docs/
│   ├── CLAUDE_CODE_INSTRUCTIONS.md
│   ├── alcheme_PRD_v4.md
│   ├── alcheme_design-doc_v1.md
│   ├── alcheme_rollout-plan_phase-0.md
│   ├── alcheme_prompts-catalog_v3.md
│   ├── alcheme_ui-specs_phase1_v2.md
│   └── adk_docs_*.md
│
├── docker-compose.yml
└── .env.example
```

---

## 6. コーディング規約

### 6.1 共通ルール

- **言語:** コードは英語。コメントは英語。ただし、ユーザー向け UI テキスト・プロンプト・テストデータは日本語。
- **コミットメッセージ:** Conventional Commits 形式（`feat:`, `fix:`, `docs:`, `refactor:`, `test:`）。メッセージ本文は英語。
- **ブランチ:** `main` ← `develop` ← `feature/xxx`

### 6.2 TypeScript / Next.js

- **厳密モード:** `"strict": true` in tsconfig.json
- **コンポーネント:** 関数コンポーネント + Hooks のみ。クラスコンポーネント禁止。
- **命名規則:**
  - コンポーネント: PascalCase（`CosmeCard.tsx`）
  - ファイル名: kebab-case（`cosme-card.tsx`）
  - 型/インターフェース: PascalCase, `I` プレフィックスなし（`InventoryItem`, not `IInventoryItem`）
  - hooks: `use-xxx.ts`
- **状態管理:** React 19 の `use`, `useOptimistic`, `useActionState` を積極的に活用。グローバル状態管理ライブラリは Phase 1 では不要。SWR を Firestore リアルタイム同期に使用。
- **データフェッチ:** Server Components + Server Actions を優先。クライアント fetch は `use-xxx` hooks で抽象化。
- **スタイリング:** Tailwind CSS ユーティリティクラスのみ。カスタム CSS は原則禁止。shadcn/ui コンポーネントをベースにカスタマイズ。
- **import 順序:** React → Next.js → ライブラリ → components → lib → types

### 6.3 Python / ADK（agent/）

- **バージョン:** Python 3.12+
- **パッケージ管理:** `pyproject.toml`（pip or uv）
- **型ヒント:** 全関数に型ヒント必須。Pydantic モデルで入出力を定義。
- **命名規則:**
  - ファイル/モジュール: snake_case
  - クラス: PascalCase
  - 関数/変数: snake_case
  - 定数: UPPER_SNAKE_CASE
- **エージェント定義:** `root_agent` は必須の変数名（ADK 規約）。
- **ツール関数の docstring:** ADK がツール説明として使用するため、英語で明確に記述。引数名も英語。
- **エラーハンドリング:** ツール関数は例外を投げず、`{"status": "error", "message": "..."}` の dict を返す。
- **プロンプト:** `alcheme_prompts-catalog_v3.md` の §2.2, §3.2, §4.2, §5.2 に定義されたシステムプロンプトを**そのまま**使用すること。

### 6.4 重要な ADK 制約

- **`google_search` ツールは単独 Agent に割り当てる。** 他のツールとの併用不可。Product Search Agent は独立サブエージェントとして設計。
- **`root_agent`** は Python モジュールの必須エクスポート変数名。
- **State プレフィックス:** `user:` でユーザー永続データ、`app:` でアプリ設定、プレフィックスなしでセッション一時データ。

---

## 7. Phase 0 コード再利用マップ

Phase 0 のコードを Phase 1 で再利用する際の方針。

| Phase 0 ファイル | 再利用度 | Phase 1 での扱い |
|-----------------|---------|----------------|
| `tools.py` | ★★★★ | ツール関数のロジックは大部分流用可能。`load_inventory()` / `save_inventory()` の I/O 層を Firestore に差し替え。`generate_item_id()`, `get_inventory_summary()`, `search_inventory()`, `filter_inventory_by_category()`, `validate_recipe_items()` はロジックをそのまま流用。 |
| `prompts.py` | ★★★★ | 3エージェント分のシステムプロンプトは品質確認済み。`alcheme_prompts-catalog_v3.md` に Phase 1 版として詳細定義済み。カタログの定義をそのまま実装すること。 |
| `agent.py` | ★★★☆ | ADK エージェント定義の構造は参考になる。`cosme_mixologist` → `alcheme` にリネーム。Product Search Agent を追加。 |
| `app.py` | ★☆☆☆ | Streamlit → Next.js に完全移行。UI フローの参考のみ。直接流用不可。 |
| `sample_inventory.json` | ★★★★★ | テスト・開発用サンプルデータとしてそのまま使用。**ただし現在のスキーマは簡易版（7フィールド）のため、Week 1 で §8.1 Appendix C 準拠のフルスキーマ（vector, hygiene, stats 等を含む）に拡張すること。** |
| `saved_recipes.json` | ★★★★ | レシピ JSON 構造のリファレンスとして使用。 |

---

## 8. データモデル（Firestore コレクション）

### 8.1 コレクション構造

```
firestore/
├── users/{userId}
│   ├── displayName: string              # ニックネーム
│   ├── bio: string | null               # 自己紹介（最大200文字）
│   ├── gender: string | null            # "女性" | "男性" | "その他" | "回答しない"
│   ├── birthdate: Timestamp | null      # 生年月日（年代表示にのみ使用）
│   ├── personalColor: string | null     # "イエベ春" | "イエベ秋" | "ブルベ夏" | "ブルベ冬"
│   ├── skinType: string | null          # "乾燥肌" | "脂性肌" | "混合肌" | "普通肌" | "敏感肌"
│   ├── skinTone: string | null          # "色白" | "標準" | "やや暗め" | "暗め"
│   ├── hairType: string | null          # "ストレート" | "ウェーブ" | "カーリー" | "ショート"
│   ├── bodyType: string | null          # "ストレート" | "ウェーブ" | "ナチュラル"（骨格診断）
│   ├── faceType: string | null          # "フレッシュ" | "キュート" | "フェミニン" | "クール" | "クールカジュアル" | "エレガント" | "ソフトエレガント" | "アクティブキュート"
│   ├── occupation: string | null        # 職業（自由入力）
│   ├── interests: string[]              # 興味関心・悩み（例: ["乾燥", "毛穴", "トレンドメイク"]）
│   ├── favoriteBrands: string[]         # 好きなブランド（例: ["NARS", "ADDICTION"]）
│   ├── socialLinks: {                   # SNSリンク（任意）
│   │   twitter: string | null,
│   │   instagram: string | null,
│   │   youtube: string | null,
│   │   tiktok: string | null,
│   │   website: string | null
│   │ }
│   ├── privacySettings: {              # フィールドごとの公開設定
│   │   birthdate: "public" | "private",  # publicの場合は「20代前半」等の年代表示のみ
│   │   gender: "public" | "private",
│   │   skinType: "public" | "private",
│   │   personalColor: "public" | "private",
│   │   socialLinks: "public" | "private"
│   │ }                                  # デフォルトは全て "private"
│   ├── agentTheme: string               # "maid" | "kpop" | "bridesmaid"（エージェントキャラテーマ, デフォルト: "maid"）
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│
├── users/{userId}/inventory/{itemId}
│   ├── category: string ("Lip" | "Eye" | "Cheek" | "Base" | "Other")
│   ├── brand: string
│   ├── productName: string
│   ├── colorCode: string | null
│   ├── colorName: string | null
│   ├── colorDescription: string
│   ├── texture: string ("matte" | "glossy" | "satin" | "shimmer" | "cream")
│   ├── price: number | null             # 購入価格（円）
│   ├── status: string                   # "HAVE" | "USED_UP" | "DISPOSED"  ※Phase 2 で "WANT" | "ARCHIVE" を追加予定
│   ├── estimatedRemaining: string       # "100%" | "80%" | "60%" | "40%" | "20%" | "ほぼ空"
│   ├── openDate: Timestamp | null
│   ├── imageUrl: string | null          # Cloud Storage パス
│   ├── confidence: string ("high" | "medium" | "low")
│   ├── source: string                   # "画像認識" | "手動入力" | "画像認識 + 検索補完"
│   ├── vector: {                        # 色・質感ベクトル（類似検索・代用判定用）
│   │   hue: number,                     # 0.0-1.0
│   │   saturation: number,              # 0.0-1.0
│   │   value: number,                   # 0.0-1.0
│   │   textureScore: number             # 0.0-1.0（マット0↔ツヤ1）
│   │ }
│   ├── hygiene: {                       # 衛生管理（PAO準拠）
│   │   isOpened: boolean,
│   │   openedAt: Timestamp | null,
│   │   paoMonths: number,               # PAO期間（月数）。Appendix D 参照
│   │   expiryDate: Timestamp | null,    # openedAt + paoMonths で自動算出
│   │   daysRemaining: number | null,    # 残日数
│   │   alertLevel: string               # "safe" | "warning" | "expired"
│   │ }
│   ├── stats: {                         # コスメスペック（内部は数値1-5、UIでは★表示+美容テキスト）
│   │   pigment: number,                 # 発色力 1-5
│   │   longevity: number,               # 持続力 1-5
│   │   shelf_life: number,              # 製品寿命 1-5（PAO準拠）
│   │   natural_finish: number           # ナチュラルさ 1-5
│   │ }
│   │   # ⚠️ 内部値 → UI表示の変換ルール:
│   │   #   5=S → ★★★★★  4=A → ★★★★☆  3=B → ★★★☆☆  2=C → ★★☆☆☆  1=D → ★☆☆☆☆
│   │   # UI表示ラベル（PRD §5.3 準拠、ゲーム用語禁止）:
│   │   #   pigment → 「発色力」（例: ★★★★☆「しっかり発色」）
│   │   #   longevity → 「持続力」（例: ★★★★★「ウォータープルーフで崩れにくい」）
│   │   #   shelf_life → 「製品寿命」（例: ★★★★☆「パウダー系で長持ち」）
│   │   #   natural_finish → 「ナチュラルさ」（例: ★★★★★「素肌感のある仕上がり」）
│   ├── rarity: string | null            # "SSR" | "SR" | "R" | "N"（内部分類用）
│   ├── useCount: number
│   ├── costPerWear: number | null       # price ÷ useCount
│   ├── lastUsedAt: Timestamp | null
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│
├── users/{userId}/recipes/{recipeId}
│   ├── title: string
│   ├── occasion: string | null
│   ├── theme: string | null
│   ├── steps: RecipeStep[]
│   ├── usedItems: string[]             # itemId の配列
│   ├── matchScore: number              # 0-100（再現度）
│   ├── previewImageUrl: string | null
│   ├── feedback: { rating, wasExecuted, modifications }
│   ├── generatedBy: string             # "alchemist" | "concierge"
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

### 8.2 Cloud Storage バケット構造

```
gs://alcheme-{env}/
├── cosme-images/{userId}/{itemId}/
│   ├── original.jpg
│   ├── thumbnail.webp     # 200x200
│   └── card.webp           # 400x400
├── simulations/{userId}/{recipeId}.webp
└── avatars/{userId}/avatar.webp
```

---

## 9. API エンドポイント（BFF）

Phase 1 で実装する Next.js API Routes。

### 認証

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/auth/session` | Firebase Token → Session Cookie |
| DELETE | `/api/auth/session` | セッション破棄 |
| GET | `/api/users/me` | プロフィール取得 |
| PATCH | `/api/users/me` | プロフィール更新 |

### インベントリ

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/inventory` | 在庫一覧（フィルタ・ソート） |
| POST | `/api/inventory/scan` | 画像アップ → AI 解析 → 候補返却 |
| POST | `/api/inventory/confirm` | 解析結果を確認して登録 |
| PATCH | `/api/inventory/{itemId}` | アイテム更新 |
| DELETE | `/api/inventory/{itemId}` | アイテム削除 |
| POST | `/api/inventory/{itemId}/use` | 使用記録 |

### エージェント対話

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/chat` | Concierge へメッセージ送信（SSE レスポンス） |
| POST | `/api/recipe/generate` | レシピ生成リクエスト |

### レシピ

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/recipes` | レシピ一覧 |
| GET | `/api/recipes/{recipeId}` | レシピ詳細 |
| POST | `/api/recipes/{recipeId}/feedback` | 評価送信 |

---

## 10. ADK エージェント構成（Phase 1）

```python
# agent/alcheme/agent.py

root_agent (Concierge Bot)          # LlmAgent — ユーザーとの対話窓口
├── inventory_agent                 # LlmAgent — コスメ画像解析・在庫管理
│   (tools: inventory_tools, rakuten_api)
├── product_search_agent            # LlmAgent — Google検索で商品補完
│   (tools: google_search)          # ⚠️ google_search は単独Agentに割り当て必須
└── alchemist_agent                 # LlmAgent — メイクレシピ生成
    (tools: recipe_tools, inventory_tools[read-only])
```

### エージェント間の連携フロー

```
ユーザー: 「この写真のコスメを登録して」
  → Concierge → inventory_agent（画像解析）
    → ブランド不明の場合 → product_search_agent（Google検索で補完）
    → 結果を Concierge 経由でユーザーに返却

ユーザー: 「今日のオフィスメイクを提案して」
  → Concierge → alchemist_agent（在庫を参照してレシピ生成）
    → レシピ + 使用アイテムリストを返却
```

### Hallucination 防止ルール（最重要）

Alchemist Agent は**手持ち在庫に存在するアイテムのみ**でレシピを生成する。在庫にないアイテムを「持っている」と仮定してはならない。Phase 0 の `validate_recipe_items()` ツールで在庫との突合検証を行うこと。

詳細ルールは `alcheme_prompts-catalog_v3.md` §7 を参照。

---

## 11. 環境変数

`.env.example` として以下を用意する。

```bash
# === Google AI / Vertex AI ===
GOOGLE_GENAI_USE_VERTEXAI=TRUE         # TRUE: Vertex AI, FALSE: Google AI Studio
GOOGLE_CLOUD_PROJECT=alcheme-dev       # GCP プロジェクト ID
GOOGLE_CLOUD_LOCATION=asia-northeast1  # リージョン（東京）
# GOOGLE_API_KEY=                      # Google AI Studio 使用時のみ

# === Firebase ===
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK（サーバーサイド用）
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# === 楽天 API ===
RAKUTEN_APP_ID=                        # 楽天ウェブサービスのアプリID

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADK_AGENT_URL=http://localhost:8080    # Agent Engine or Cloud Run の URL
```

---

## 12. 週次ロードマップ

### Week 1: コアエンジン再構築 + ボイラープレート移行
**ゴール:** Python で「画像 → 在庫登録 → レシピ JSON」が動く + フロントエンドの骨格

- [x] GCP プロジェクト作成、Firebase プロジェクト初期化
- [x] `agent/` ディレクトリ構造作成
- [x] Phase 0 の `tools.py` / `prompts.py` を移植・リファクタ
- [x] Firestore CRUD のツール関数実装（`inventory_tools.py`）
- [x] Product Search Agent 新規実装（`google_search` ツール）
- [x] `adk web alcheme` で動作確認（ADK v1.25.0, http://127.0.0.1:8000 で起動確認済み）
- [x] `sample_inventory.json` を Firestore にシード（`agent/scripts/seed_inventory.py` で 15 アイテムを `users/test-user-001/inventory/` に投入済み）
- [x] **ボイラープレート移行 Step 1-2:** 不要ファイル削除、(protected)→(main) リネーム、tailwind 拡張

### Week 2: エージェント協調 + フロントエンド共通部品
**ゴール:** ADK でエージェント間の連携が動作 + フロントエンド共通コンポーネント完成

- [x] root_agent (Concierge) + 3サブエージェントの協調動作
- [x] Session State 管理（ユーザーコンテキスト保持）— ToolContext + output_key パターン実装
- [x] Firebase Auth セットアップ（Email + Google OAuth）— alche:me UI に変更、AlchemeUserProfile 導入
- [x] Firestore セキュリティルール設定 — `firestore.rules` 作成
- [x] Cloud Storage バケット作成 + 画像アップロード機能 — `lib/cosme-image.ts` 作成
- [x] 楽天 API 連携（`rakuten_api.py`）— 実装・検証済み
- [x] **ボイラープレート移行 Step 3:** 共通コンポーネント作成（page-header, stat-bar, rarity-badge, remaining-bar, cosme-card, category-filter, empty-state, loading-skeleton）

### Week 3: フロントエンド画面実装
**ゴール:** スマホで触れる Web アプリ

- [x] **ボイラープレート移行 Step 4:** 全画面を順番に実装（ui-specs 参照）
- [x] ログイン / サインアップ画面（既存 UI を alche:me デザインに変更）
- [x] オンボーディング（新規）
- [x] 在庫一覧画面（カード UI）
- [x] コスメスキャン画面（カメラ + 画像アップロード + 鑑定演出）
- [x] チャット画面（SSE ストリーミング）
- [x] レシピカード表示
- [x] BFF API Routes 実装（→ Agent Engine 接続はモック、Week 4 で差し替え）
- [x] PWA マニフェスト（Service Worker は Week 4）

### Week 4: 統合テスト + デプロイ
**ゴール:** Cloud Run にデプロイ、β テスト準備完了

- [x] E2E テスト（スキャン → 登録 → レシピ生成 → フィードバック）
- [x] Hallucination 検知テスト（`validate_recipe_items` の検証）
- [x] Docker イメージビルド（frontend + agent）
- [x] Cloud Run デプロイ（cloudbuild.yaml + deploy.sh）
- [x] ドメイン設定 → Phase 1 は *.run.app デフォルト URL 使用（カスタムドメインは Phase 2）
- [x] パフォーマンス計測（P95 レスポンス < 15秒）
- [x] β テスターへの招待準備（docs/guides/beta-guide.md）

---

## 13. テスト方針

### ユニットテスト

| 対象 | ツール | カバレッジ目標 |
|------|--------|-------------|
| TypeScript (frontend) | Vitest | 主要コンポーネント + hooks |
| Python (agent) | pytest | ツール関数 100%、プロンプト品質テスト |

### 最重要テストケース

1. **Hallucination 検知:** `validate_recipe_items(recipe_steps, user_inventory)` — レシピ内の全アイテムが在庫に存在することを検証。偽アイテム混入時に fail すること。
2. **画像認識精度:** `sample_inventory.json` の 15 アイテムの画像をスキャンし、カテゴリ・ブランドの正答率 80%+ を確認。
3. **認証フロー:** Firebase Auth Token の検証。未認証リクエストが 401 を返すこと。
4. **レシピ品質:** 生成されたレシピが JSON スキーマに準拠し、`match_score` が含まれること。

### エージェントテスト

prompts-catalog §8 に定義された 17 テストシナリオ（T1-T17）を実装すること。

---

## 14. MCP サーバー設定（ADK ドキュメント参照用）

Claude Code から ADK 公式ドキュメントを参照するための MCP 設定:

```bash
claude mcp add adk-docs --transport stdio -- uvx --from mcpdoc mcpdoc \
  --urls AgentDevelopmentKit:https://google.github.io/adk-docs/llms.txt \
  --transport stdio
```

---

## 15. よくある質問（Claude Code 向け FAQ）

**Q: Gemini のモデル名は？**
A: メイン推論は `gemini-2.5-flash`。高精度タスクは `gemini-2.5-pro`。画像生成は `gemini-2.5-flash`（ネイティブ画像生成モード）。

**Q: ADK の `adk web` は本番で使える？**
A: いいえ。`adk web` は開発・デバッグ専用。本番は Agent Engine or Cloud Run にデプロイ。

**Q: SerpAPI は使える？**
A: いいえ。Google が DMCA 違反で訴訟中。ADK built-in の `google_search` ツールを使う。

**Q: コスメ DB はどこにある？**
A: 自社 DB は構築しない。Gemini の世界知識 + Google 検索 + 楽天 API + ユーザー登録データで補完する。

**Q: ユーザーの顔写真は使う？**
A: いいえ。仕上がりプレビューは AI キャラクターイメージ方式。肖像権リスクを回避。

**Q: 日本語のエンコーディング問題は？**
A: Phase 0 で UTF-8 文字化けが発生した。すべてのファイルは UTF-8（BOM なし）で保存すること。Python ファイルの先頭に `# -*- coding: utf-8 -*-` は不要（Python 3 はデフォルト UTF-8）。

**Q: ボイラープレートの `lib/vertexai/` は使う？**
A: いいえ。TypeScript Vertex AI agents は削除する。alche:me は Python ADK でエージェントを構築し、Next.js API Routes（BFF）経由でフロントエンドから呼び出す。

**Q: ダークモードは？**
A: Phase 1 では不要。`theme-provider.tsx` を削除し、alche:me の固定テーマ（`cream` 背景ベース）を使用する。

**Q: `(protected)` と `(main)` どちらを使う？**
A: `(main)` に統一する。ボイラープレートの `(protected)` を `(main)` にリネームすること。

---

## 16. 成功の定義

Phase 1 MVP が「完成」と言える条件:

- [x] Firebase Auth でログイン/サインアップできる
- [x] スマホのカメラでコスメを撮影し、AI が認識してカード化できる
- [x] 在庫一覧がカード UI で表示される
- [x] 「今日のメイクを提案して」とチャットすると、手持ち在庫のみでレシピが返る
- [x] レシピに在庫にないアイテムが含まれない（Hallucination ゼロ）
- [x] レシピにワンタップ評価ができる
- [ ] Cloud Run 上で動作し、スマホからアクセスできる ← cloudbuild.yaml + Dockerfile 構築済み、初回デプロイ待ち
- [x] P95 レスポンスタイム < 15秒

---

*— End of Document —*
*Version 1.5 | Last Updated: 2026-02-16*
*Author: Eri Kaneko (Product Owner)*
