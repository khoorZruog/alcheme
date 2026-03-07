# alche:me — 残存タスク・バックログ・改善提案

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-02-17 |
| **Author** | Eri Kaneko (Product Owner) |
| **Status** | Active |
| **Related** | alcheme_PRD_v4.md, alcheme_design-doc_v1.md, manual_e2e_test_guide.md |

> 本ドキュメントは、デプロイ後のユーザーテストで発見されたバグ、アーキテクチャ上の課題、UX改善提案、および将来の機能拡張アイデアを体系的に整理する。Deep Research が必要な項目、技術的に調査が必要な項目、実装可能な項目に分類する。

---

## 目次

1. [バグ・不具合（要修正）](#1-バグ不具合要修正)
2. [アーキテクチャ課題（要調査・設計）](#2-アーキテクチャ課題要調査設計)
3. [UX改善（要デザイン・実装）](#3-ux改善要デザイン実装)
4. [機能拡張（Deep Research 後に設計）](#4-機能拡張deep-research-後に設計)
5. [データ戦略・ビジネス基盤](#5-データ戦略ビジネス基盤)
6. [ブランディング・サービス設計](#6-ブランディングサービス設計)
7. [優先度マトリクス](#7-優先度マトリクス)
8. [実施ロードマップ案](#8-実施ロードマップ案)

---

## 1. バグ・不具合（要修正）

### BUG-001: 天気API連携の失敗 ✅ RESOLVED (2026-02-17)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-02-17）** |
| **現象** | AIチャットで天気情報を利用しようとすると「天気情報の取得に失敗しました。本日の東京の天気、気温、湿度を教えて頂けますでしょうか？」とユーザーに逆質問される |
| **根本原因** | Google Weather API (`weather.googleapis.com`) が **日本（および韓国）を地理的にサポートしていない**。APIキー自体は有効だが、東京・大阪等の日本の都市に対して HTTP 404 "Information is not supported for this location" を返す。米国・欧州・シンガポール等では正常動作。 |
| **対応内容** | **Open-Meteo API** をフォールバック天気データソースとして実装。Google Weather API を第一候補として試行し、404（地域未対応）またはエラー時に Open-Meteo に自動切替する二段構え方式を採用。 |
| **変更ファイル** | ① `agent/alcheme/tools/weather_tools.py` — `_fetch_open_meteo()` 追加、`get_weather()` にフォールバック処理追加 ② `app/api/weather/route.ts` — `fetchGoogleWeather()` + `fetchOpenMeteo()` の二段構え実装 ③ `app/(main)/settings/page.tsx` — CC BY 4.0 クレジット表記追加 ④ `cloudbuild.yaml` — Web サービスへの `GOOGLE_WEATHER_API_KEY` 環境変数追加 |
| **デプロイ** | Cloud Run 両サービスに反映済み（agent: rev `alcheme-agent-00005-jw8`、web: rev `alcheme-web-00006-gcx`）。URLは変更なし。 |
| **動作確認** | 東京（曇り, 6°C）、大阪（晴れ, 8°C）— Open-Meteo 経由で正常取得 |
| **ライセンス** | Open-Meteo は **CC BY 4.0** ライセンス。クレジット表記を設定画面UIに追加済み。詳細は後述「Open-Meteo ライセンス対応」参照 |

#### Open-Meteo ライセンス対応

| 項目 | 詳細 |
|------|------|
| **ライセンス** | Creative Commons Attribution 4.0 International (CC BY 4.0) |
| **要件** | ① クレジット表記（Attribution）: データ提供元としてOpen-Meteo.comを明記 ② ライセンスへのリンク |
| **対応状況** | ✅ 設定画面UIにクレジット表記 + リンク表示済み ✅ ソースコード内にもコメント・docstring で記載 ✅ APIレスポンスに `attribution` フィールド付与 |
| **無料枠** | 1日 10,000 APIコール（商用利用OK、API キー不要） |
| **監視** | ✅ **対応済み** — 構造化ログ + Agent インメモリキャッシュ実装済み。Cloud Monitoring 設定は `docs/guides/cloud-monitoring-setup.md` 参照（→ OPS-001 解決済み） |

### BUG-003: GET /api/users/me 初回 401 エラー ✅ RESOLVED (2026-02-19)

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **ステータス** | **✅ 解決済み（2026-02-19）** |
| **現象** | アプリ起動時に `GET /api/users/me 401` がコンソールに表示される。その後 `POST /api/auth/session 200` → `GET /api/users/me 200` と正常に続くが、初回リクエストが不要な 401 を返す |
| **根本原因** | レースコンディション。Firebase クライアント SDK の `onAuthStateChanged` で `setUser(user)` が即座に実行され、`app/(main)/layout.tsx` の SWR が `user` の存在だけでフェッチを開始。しかしセッション Cookie は `POST /api/auth/session` 完了後にしか設定されないため、先行する `GET /api/users/me` は未認証で 401 を返していた |
| **対応内容** | `layout.tsx` の SWR キーを `user ? ...` から `!loading && user ? ...` に変更。`loading` は AuthProvider のセッション作成完了後に `false` になるため、Cookie 設定済みの状態でのみフェッチが発生する |
| **変更ファイル** | `app/(main)/layout.tsx` (L30) |
| **検証** | `tsc --noEmit` 型エラーなし、`vitest run` 127テスト全パス |

### BUG-002: Next Cosme（旧: 買い足し候補）の手動追加失敗 ✅ RESOLVED (2026-02-17)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-02-17）** |
| **現象** | Next Cosme を手動追加しようとすると「追加に失敗しました」と表示される |
| **根本原因** | `app/api/suggestions/route.ts` の POST ハンドラで、リクエストボディに含まれないオプションフィールド（`item_type`, `product_url` 等）が `undefined` のまま Firestore `docRef.set()` に渡されていた。Firestore は `undefined` 値を拒否するため 500 エラー。AI経由の候補追加は全フィールドが充填されるため正常動作するが、手動追加フォームは最小限のフィールドしか送らないため失敗していた。 |
| **対応内容** | `docRef.set()` に渡すオブジェクトから `undefined` 値を除外。必須フィールドのみ初期オブジェクトに含め、オプションフィールドは値がある場合のみ追加する方式に変更。 |
| **変更ファイル** | `app/api/suggestions/route.ts` (L89-109) |
| **検証** | `tsc --noEmit` 型エラーなし、`vitest run` 127テスト全パス |
| **同時対応** | UI用語リネーム: 「買い足し」→ **Next Cosme**、「Vanity/コスメ」→ **My Cosme**（詳細は `docs/plans/2026-02-17_BUG-002_UI-rename.md`） |

---

## 2. アーキテクチャ課題（要調査・設計）

### ARCH-001: Agent Engine ではなく Cloud Run にデプロイされている理由

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium（理解・整理のため） |
| **経緯** | Design Doc §2.1 の注記に記載済み:「当初 Vertex AI Agent Engine の利用を検討したが、SSEストリーミングやカスタムセッション管理の要件から Cloud Run + FastAPI + ADK Runner 構成を採用した」 |
| **背景** | Agent Engine はマネージドサービスとして便利だが、①SSEストリーミングの柔軟なカスタマイズ ②カスタムセッション/メモリ管理 ③進捗メッセージの細かい制御 が必要だったため、Cloud Run + FastAPI の構成を選択。これはADR-002として記録済み |
| **現状の利点** | ・SSEイベント9種類（text_delta / progress / recipe_card / preview_image / product_card / technique_card / agent_used / done / error）の細かい制御が可能 ・DatabaseSessionService（SQLite）によるセッション永続化 ・18のツール進捗メッセージ + 8のエージェント転送メッセージのリアルタイム表示 |
| **将来検討** | Agent Engine がSSE対応やカスタムセッション管理に対応した場合、移行を再検討。現状は Cloud Run で問題なし |

### ARCH-002: ADK Memory の永続化と学習機能

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **現象** | セッションは `DatabaseSessionService` (SQLite) で保存されているが、Memory は `InMemoryMemoryService` でプロセス再起動時に消失する |
| **問題** | ユーザーの傾向（好みの色、よく使うアイテム、メイクスタイルの嗜好等）が会話横断で学習・蓄積されない。Cloud Run のコンテナ再起動やスケーリングでメモリが消える |
| **短期対応** | **✅ 完了（2026-02-17）** — Profiler Agent の `analyze_preference_history()` 実行時に分析結果を Firestore `users/{userId}.preferences` に永続化。セッション開始時に `_build_user_state()` で `user:profiler_preferences` として全エージェントに自動注入。詳細は `docs/plans/2026-02-17_ARCH-002_profiler-persistence.md` |
| **中期対応** | 未着手 — ① ADK の `MemoryService` をカスタム実装し、Firestore バックエンドの `PersistentMemoryService` を作成 ② Cloud SQL (PostgreSQL) ベースの `DatabaseMemoryService` を検討 ③ Vertex AI Vector Search を活用したセマンティック記憶検索 |
| **長期対応** | 未着手 — ① Beauty Log / レシピ履歴 / フィードバックデータを統合分析し、ユーザーごとの嗜好モデルを構築 ② BigQuery ML によるクラスタリング分析と傾向予測 |
| **対応工数** | ~~短期: 中（1-2日）~~✅、中期: 大（1-2週間）、長期: 大（Phase 3-4） |

### ARCH-003: 共有商品カタログ（グローバル商品マスタ） ✅ RESOLVED (2026-02-21)

| 項目 | 詳細 |
|------|------|
| **重要度** | High（Phase 3.5 → Phase 3 に前倒し） |
| **ステータス** | **✅ 解決済み（2026-02-21）** |
| **背景** | 商品マスタ（`users/{userId}/products/`）がユーザーごとに独立しており、同一商品の情報が共有されない。登録の手間が大きい |
| **対応内容** | グローバルな `catalog/` コレクションを追加。ユーザー横断で普遍的な商品情報（ブランド、商品名、カテゴリ、色、テクスチャ、画像等）を共有。在庫はユーザーごとに管理を維持。3層構造: `catalog/{catalogId}` → `users/{uid}/products/{pid}` → `users/{uid}/inventory/{iid}` |
| **主要機能** | ① 決定的 ID（SHA-256 ハッシュ）で O(1) 重複チェック ② 全4登録フローに自動カタログ upsert 追加 ③ カタログ検索 API + Agent ツール ④ マッチバナー（既存フローでカタログ候補を自動表示）⑤「みんなの登録商品から検索」新規登録方法 ⑥ AI 画像加工（背景除去 + 正規化）⑦ マイグレーション API |
| **変更ファイル** | 新規13ファイル + 既存11ファイル修正。詳細は `docs/plans/2026-02-21_ARCH-003_shared-catalog.md` |
| **検証** | TypeScript: 200テスト全パス、tsc クリーン。Python: 18カタログテスト全パス |

---

## 3. UX改善（要デザイン・実装）

### UX-001: メイクレシピとプレビュー画像の同時生成 ✅ RESOLVED (2026-02-22)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-02-22）** |
| **現象** | メイクレシピが生成された後にプレビュー画像の生成（10-15秒）を待つ間、チャットUIがロック状態になる |
| **対応内容** | `content_done` SSEイベントを新設。テキスト＋レシピカード出力完了時に発行し、フロントエンドは即座にUIをアンロック。プレビュー画像はSSEストリーム上で非同期に到着し、自動表示される |
| **変更ファイル** | ① `types/chat.ts` — `SSEEventType` に `content_done` 追加 ② `agent/server.py` — 主パス・リトライパスで `content_done` 発行 ③ `hooks/use-chat.ts` — `content_done` ハンドリング + abort安全策 |
| **計画書** | `docs/plans/2026-02-22_UX-001_content-done-sse.md` |

### UX-002: レシピ一覧UIの在庫一覧UIとの統一 ✅ RESOLVED (2026-03-07)

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **ステータス** | **✅ 解決済み（2026-03-07）** |
| **現象** | レシピ一覧 (`recipes/page.tsx`) と在庫一覧 (`inventory/page.tsx`) で UIパターンが異なる |
| **対応内容** | ① `BulkActionBar` を `children` スロットで汎用化 ② `RecipeSummaryCard` を glass-card パターン + aspect-square + 右上丸型チェックボックスに統一 ③ `RecipeListItem` を divide-y ラップ + 丸型チェックボックスに統一 ④ インラインバルクバーを `BulkActionBar` コンポーネントに置換 ⑤ `aspect-[4/3]` → `aspect-square` を recipe-card-inline, recipe-omikuji-overlay, loading-skeleton にも適用 |
| **変更ファイル** | `components/bulk-action-bar.tsx`, `app/(main)/recipes/page.tsx`, `components/recipe-list-item.tsx`, `components/recipe-card-inline.tsx`, `components/recipe-omikuji-overlay.tsx`, `components/loading-skeleton.tsx` |
| **計画書** | `docs/plans/2026-03-07_UX-002_recipe-list-unification.md` |

### UX-003: ブランド名・商品名のサジェスト・入力規制

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **現象** | 手動登録時にブランド名・商品名の表記ゆれが発生しうる。例:「KATE」「kate」「ケイト」「KANEBO KATE」が全て別ブランドとして扱われる。重複登録のリスクも高い |
| **対応策** | ① **オートコンプリート**: ユーザーの既存在庫からブランド名・商品名をサジェスト。入力中にリアルタイム候補表示 ② **ブランド名正規化**: 登録時にブランド名を正規化ルール（大文字統一、全角→半角、読み仮名対応）で変換 ③ **重複検知**: 同一ブランド + 同一商品名 + 同一色番号の組み合わせが既に登録されている場合、警告を表示 ④ **商品マスタ参照**: 他ユーザーが登録済みの商品名DB（`products/`コレクション）からもサジェスト（中期） |
| **共通コンポーネント化** | `BrandAutocomplete`, `ProductNameAutocomplete` コンポーネントを作成し、My Cosme 登録・Next Cosme 登録・手動登録すべてで共有 |
| **対応工数** | 中（5-7日） |

### UX-004: Next Cosme の登録方法統一

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **現象** | My Cosme 登録は4つの方法（スキャン鑑定 / 楽天検索 / Web検索 / 手動）があるが、Next Cosme の登録は手動追加のみ |
| **対応策** | ① `add-method-sheet.tsx` を共通化し、My Cosme 登録・Next Cosme 登録の両方で利用可能にする ② Next Cosme でも AI提案 / 楽天検索 / Web検索 / 手動登録 の4オプションを提供 ③ `ItemEditSheet` も共通化（登録先: inventory vs suggestion をプロパティで切替） |
| **対応工数** | 中（共通コンポーネントの抽出・リファクタリングで3-5日） |

### UX-005: Next Cosme の画像URL → 画像アップロード

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **現象** | Next Cosme の手動登録で Web URL から画像を取得する方式は便利だが、①著作権の問題 ②URLが変わる可能性 ③多ユーザー利用時のスケーラビリティ で問題がある |
| **対応策** | ① 在庫登録と同様に Cloud Storage への画像アップロード方式に変更 ② URL入力もフォールバックとして残す（URLから画像をダウンロードしてCloud Storageに保存するバックエンド処理） ③ 画像なしでも登録可能に |
| **対応工数** | 小〜中（2-3日） |

### UX-006: 価格フィールドの在庫登録への逆輸入

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **現象** | Next Cosme には `price_range` フィールドがあるが、My Cosme アイテム (`InventoryItem`) には価格フィールドがない |
| **対応策** | ① `InventoryItem` スキーマに `purchase_price` (購入価格), `tax_included` (税込/税抜) フィールドを追加 ② 楽天検索から登録時は自動プリフィル ③ 手動登録フォームにも価格入力欄を追加 |
| **活用用途** | ・ユーザー用分析（月間コスメ支出、カテゴリ別支出割合） ・論文用データ分析（価格帯と使用頻度の相関） ・企業向けデータ提供（価格感度分析） |
| **税込/税抜の統一** | アプリ内では「税込」を標準とし、入力時に「税込/税抜」を選択可能にする。内部保存は全て税込に正規化 |
| **対応工数** | 中（スキーマ変更 + UI変更 + マイグレーションで3-5日） |

### UX-007: チャット履歴の管理機能強化

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **現象** | ChatGPT や Claude のようなチャット管理機能が不足している |
| **現状の実装** | `chat-history-sidebar.tsx` でチャット履歴一覧表示、削除機能あり。`conversations` コレクションに永続化済み。会話名の変更UIは部分的に実装 |
| **追加要望** | ① チャット名の変更（タイトル編集）— 部分実装済み、UI強化が必要 ② チャット履歴の自主削除 — 実装済み ③ プロジェクト（フォルダ）機能でチャットをグループ管理 — 未実装 |
| **対応策** | ① チャット名編集UIの改善（インライン編集、ダブルタップで編集モード） ② プロジェクト機能: `conversations` ドキュメントに `projectId` フィールド追加、プロジェクト一覧UI作成 ③ ピン留め機能 ④ 検索機能（会話内容のフルテキスト検索） |
| **対応工数** | 中〜大（プロジェクト機能含めて5-10日） |

### UX-008: みんなのコスメ UX改善 + have_countバグ修正 ✅ RESOLVED (2026-03-07)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-03-07）** |
| **現象** | みんなのコスメページで①デフォルトカテゴリが「リップ」②ブランドピルがスケールしない③カードクリックで即編集モード④「保存」ボタン命名が世界観に合わない⑤DuplicateWarning配置が悪い⑥登録済み商品に「保存」表示⑦have_count未インクリメント |
| **対応内容** | ①デフォルト→「全て」+Browse APIのcategoryオプション化 ②ブランドピル→Selectドロップダウン ③カード→詳細シート→編集の2段階フロー ④ボタン「My Cosmeに追加」/「変更を保存」 ⑤DuplicateWarningをシート上部に移動+exact時ボタンdisabled ⑥詳細シートで所有チェック ⑦エラーログ追加+SWRキャッシュinvalidate |
| **計画** | `docs/plans/2026-03-07_UX-004_community-page-ux.md` |

---

## 4. 機能拡張（Deep Research 後に設計）

### FEAT-001: メイク日記の再設計 ✅ RESOLVED (2026-02-19)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-02-19）** Phase 2.5B で実装完了。計画: `docs/plans/2026-02-19_Phase2.5B_beauty-log-redesign.md` |
| **現象** | 現在のメイク日記（Beauty Log）の機能が「ほぼ日手帳」や「Day One」と比較して劣っている |
| **現状の実装** | カレンダー表示 + タイムライン表示。日次ログにムード、天気、写真、評価、レシピリンクを記録可能 |
| **Deep Research** | **✅ 完了（2026-02-18）** — ほぼ日手帳/Day One/LIPS/Instagram Stories を包括的に調査。詳細は `docs/research/diary_app_ux_analysis.md` および `docs/research/deep_research_synthesis.md` |
| **主要インサイト** | ① **Quick Log（15秒記録）**: 写真+評価の最小フロー（Day One の最短10秒記録に着想） ② **自動メタデータ**: 天気・気温・湿度を API 自動取得（Day One パターン、Open-Meteo 既存実装活用） ③ **振り返りが継続のエンジン**: Weekly Beauty Report + On This Day + 月間写真グリッド ④ **ストーリーズトレイ**: Instagram Stories パターンでチャット画面上部に今週のルック表示 ⑤ **Beauty Palette**: ほぼ日手帳のコレクション感 + Duolingo ストリーク ⑥ **「書かなくてもOK」設計**: ほぼ日手帳の「罰しない」思想を踏襲 |
| **改善方向性（確定）** | ① **Quick Log**: 写真+評価の2ステップで完了 ② **テンプレート**: Quick Snap / Morning Routine / Event Look 等 ③ **自動補完**: Open-Meteo API 自動取得 ④ **振り返り**: Weekly Beauty Report / On This Day / Beauty Journey ⑤ **ガミフィケーション**: Beauty Palette（カレンダーをパレットに見立て、記録日にカラーが付く） ⑥ **日替わりコンテンツ**: Today's Beauty Tip / Color of the Day |
| **対応工数** | 大（設計 2-3日 + 実装 1-2週間）※ Deep Research 完了済み |

### FEAT-002: モバイルアプリのナビゲーション再設計 ✅ RESOLVED (2026-02-21)

| 項目 | 詳細 |
|------|------|
| **重要度** | **High**（Medium → High に格上げ。全UIの基盤） |
| **ステータス** | **✅ 解決済み（2026-02-21）** — Phase 2.5A でタブ構成再設計 + カテゴリ/ブランドビュー切替完了。Phase 3 で SNS 導線改善完了 |
| **Deep Research** | **✅ 完了（2026-02-18）** — TikTok/Instagram/LIPS/@cosme のナビゲーションを包括的に調査 |
| **Phase 2.5A 対応** | タブ構成再設計（My Cosme + Next Cosme 統合、マイページ新設、中央「+」ボタン）、カテゴリ/ブランドビュー切替 |
| **Phase 3 対応（SNS 導線改善）** | ① ボトムナビの Recipe タブを Feed タブに置換 ② フィードページに「レシピ」タブ追加（3タブ: みんな/フォロー中/レシピ）③ フォロー/フォロワーリスト API + ページ新設 ④ プロフィールのフォロー数/フォロワー数をタップ可能リンクに変更 ⑤ フィード投稿にフォローボタン追加 ⑥ posts API の user_filter バグ修正 |
| **変更ファイル** | 新規10ファイル + 既存8ファイル修正。詳細は `docs/plans/2026-02-21_FEAT-002_sns-navigation.md` |
| **検証** | TypeScript: 223テスト全パス（38ファイル）、tsc クリーン |

### FEAT-003: エージェント動作の可視化

| 項目 | 詳細 |
|------|------|
| **重要度** | Low |
| **現象** | 10人（将来14-16人）のエージェントのうち、ユーザーと直接対話するのは Concierge のみ。他のエージェントが実際に動いているかユーザーからは分からない |
| **現状** | ThinkingIndicator でエージェント名とツール名を進捗表示（「手持ちコスメを確認中...」「TPOに合わせた提案を準備中...」等）。18のツール進捗メッセージ + 8のエージェント転送メッセージが定義済み |
| **改善案** | ① **エージェントアバター**: 各エージェントにキャラクターアイコンを設定し、進捗表示時にそのアイコンを表示 ② **エージェントマップ**: デバッグ/教育用に、現在どのエージェントが動いているかをビジュアルフローで表示（設定画面から有効化） ③ **処理概要**: レシピ詳細画面の「AIの思考プロセス」セクションで、どのエージェントがどのような判断をしたかを説明 |
| **対応工数** | 中（5-7日） |

### FEAT-004: スケジュール連携（Google Calendar / Notion Calendar 等） ✅ RESOLVED (2026-03-07)

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **ステータス** | **✅ 解決済み（2026-03-07）** — Google Calendar OAuth 2.0 連携 + カレンダー選択 + 手動入力 + Agent TPO Tactician 統合 |
| **背景** | AIの返答で「📅 予定: 未登録（汎用的なメイクを提案します）」と表示され、予定情報がないためTPOベースの提案精度が限定的。メイク提案のコア体験に予定は不可欠 |
| **対応内容** | ① Google Calendar OAuth 2.0（読み取り専用）— 認証URL生成・コールバック・トークンリフレッシュ・失効。② カレンダー選択UI — 複数カレンダーから取得対象を選択。③ 手動スケジュール入力 — Calendar未連携ユーザー向け free-text 入力。④ Agent `calendar_tools.py` を実装更新 — Google Calendar API / 手動 / チャット入力の3段フォールバック。⑤ TPO Tactician が実予定を使用してメイク戦略を生成。 |
| **変更ファイル** | 新規19ファイル + 既存11ファイル修正。詳細は `docs/plans/2026-03-07_FEAT-004_google-calendar.md` |
| **検証** | TypeScript: 303テスト全パス（50ファイル）、tsc クリーン。Python: 19カレンダーテスト全パス |

### FEAT-005: メイクテーマ提案 & レシピ提案のフロー化UI

| 項目 | 詳細 |
|------|------|
| **重要度** | High |
| **背景** | 現状はチャットベースでのメイク提案のみ。「急いでいるときにサクッと選びたい」需要と「じっくり相談して作りたい」需要の両方を満たすUIが必要 |
| **機能概要** | |

#### A. メイクテーマ提案（テーマカード UI）✅ RESOLVED (2026-02-22)

| 項目 | 詳細 |
|------|------|
| **ステータス** | **✅ 解決済み（2026-02-22）** |
| **トリガー** | 「メイクテーマ提案」チップ（チャット画面） |
| **UI** | AI生成イメージ画像付きカード形式で3テーマを提案。Tinder風スワイプ（Framer Motion drag）。テーマはFirestore永続化 |
| **インタラクション** | 右フリック/♥ボタン = Like（選択→レシピ生成）、左フリック/✕ボタン = Skip。全スキップ時は「もう一度提案」ボタン |
| **生成フロー** | ① テーマタイトル + 概要をGeminiで生成（3-5秒）→ カード表示 ② 3枚のイメージ画像を並列生成（10-15秒）→ 順次カードに表示 ③ Like選択 → チャットメッセージ送信 → Concierge → Alchemist でレシピ生成 |
| **設計思想** | パーソナルカラーに「似合わない」色も塗り方・重ね方・ニュアンスチェンジャーで似合わせるテクニックを積極提案 |
| **変更ファイル** | 新規11ファイル + 既存3ファイル修正。詳細は `docs/plans/2026-02-22_FEAT-005A_theme-card-ui.md` |
| **検証** | TypeScript: 258テスト全パス、tsc クリーン。Python: 12テーマテスト全パス |

#### B. メイクレシピ提案（おみくじ風 UI）✅ RESOLVED (2026-02-22)

| 項目 | 詳細 |
|------|------|
| **ステータス** | **✅ 解決済み（2026-02-22）** |
| **トリガー** | 「今日のメイクおみくじ」チップ（チャット画面 QuickActionChips） |
| **ロジック** | 保存済みレシピを天気一致(+30)・お気に入り(+20)・高評価(+20)・新しさ(+15)・ランダム(+15)でスコアリング → 上位3つから重み付きランダム選択 → おみくじ風演出で表示。BFFのみで完結（agent不要） |
| **UX要素** | おみくじアニメーション(2秒) → 結果表示(レシピ名+スコア+理由タグ+プレビュー画像) → 「このレシピで始める」or「別のレシピを引く」 |
| **使い切りフロー** | 全レシピ引き終わり → 「新しいレシピを作る」ボタン → チャットに送信 → AI新規生成フローへ接続 |
| **変更ファイル** | 新規5ファイル + 既存4ファイル修正。詳細は `docs/plans/2026-02-22_FEAT-005BC_omikuji-greeting.md` |
| **検証** | TypeScript: 276テスト全パス、tsc クリーン |

#### C. チャット開始メッセージの改善 ✅ RESOLVED (2026-02-22)

| 項目 | 詳細 |
|------|------|
| **ステータス** | **✅ 解決済み（2026-02-22）** |
| **変更内容** | ① `INITIAL_MESSAGE` を時間帯別の動的メッセージに変更（朝/昼/夜） ② QuickActionChips に「今日のメイクおみくじ」チップ追加（計6チップ）。ChatGreeting は既存デザインを維持 |

| **対応工数** | 大（テーマカードUI: 1-2週間、レシピ提案フロー: 1週間、チャット改善: 2-3日） |

### OPS-001: Open-Meteo APIコール監視 & アラート ✅ RESOLVED (2026-02-17)

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **ステータス** | **✅ コード変更完了（2026-02-17）** / GCP 設定は手順書に従い適用待ち |
| **背景** | Open-Meteo の無料枠は **1日 10,000 APIコール**。現在の利用量は少ないが、ユーザー増加時に上限に達するリスクがある |
| **対応内容** | ① 構造化ログ追加（`weather_api_call` JSON ログ — Cloud Logging の Log-based Metrics で集計可能） ② Python Agent にインメモリキャッシュ追加（TTL 15分、同一地点の重複リクエスト削減） ③ Cloud Monitoring 設定手順書を `docs/guides/cloud-monitoring-setup.md` に作成（Log-based Metric / Alert Policy / Dashboard の gcloud CLI 手順） |
| **変更ファイル** | `app/api/weather/route.ts`, `agent/alcheme/tools/weather_tools.py` |
| **GCP 設定** | 手順書に従い GCP コンソールまたは gcloud CLI で Log-based Metric + Alert Policy を作成する必要あり（詳細は `docs/guides/cloud-monitoring-setup.md`） |
| **検証** | `tsc --noEmit` 型エラーなし、`vitest run` 127テスト全パス |
| **計画書** | `docs/plans/2026-02-17_OPS-001_monitoring.md` |

---

## 5. データ戦略・ビジネス基盤

### DATA-001: 価格データの体系的収集

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **背景** | PRD §2.1 で定義されたデータ収集基盤の一環。コスメの価格データは以下に活用可能: ① ユーザー向け支出分析 ② 論文用分析（価格帯と使用頻度の相関） ③ 企業向けデータ提供（価格感度分析） |
| **対応** | UX-006（価格フィールドの逆輸入）と連動 |

### DATA-002: 在庫稼働率データの可視化

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **背景** | PRD §2.1 の「コスメティック・パラドックス」仮説を検証するためのデータ。登録アイテム数に対する実際の使用頻度分布を可視化 |
| **対応策** | ① Beauty Log データとInventoryデータを突合して稼働率を計算 ② ユーザーダッシュボードで「最も使ったアイテム Top 5」「3ヶ月未使用アイテム」等を表示 ③ BigQuery によるクロスユーザー集計分析（Phase 3+） |

---

## 6. ブランディング・サービス設計

### BRAND-001: AI美容部員のキャラクター設計

| 項目 | 詳細 |
|------|------|
| **重要度** | Medium |
| **現象** | 「コンシェルジュ」から「AI美容部員」に表現を変更したが、人と対話している感覚を演出するためのビジュアルが不足 |
| **提案** | ① alche:me のイメージキャラクターを作成（イラストレーター or AI生成） ② アプリ内でキャラクターのアバターをチャット画面に表示 ③ エージェントテーマ（maid / kpop / bestfriend）ごとにキャラクターのビジュアルを切替 ④ キャラクターの表情をメッセージ内容に合わせて変化（嬉しい、考え中、提案中等） |
| **Deep Research テーマ** | ① AIチャットボットにおけるキャラクター設計のベストプラクティス ② 日本のモバイルアプリにおけるマスコットキャラクターの効果 ③ エモーショナルデザインによるユーザーエンゲージメント向上 |
| **対応工数** | 大（キャラクターデザイン + 実装で2-3週間） |

### BRAND-002: デザインアセット（ロゴ・アイコン・OG画像）

| 項目 | 詳細 |
|------|------|
| **重要度** | High（ブランディングの基盤） |
| **ステータス** | 未着手 |
| **背景** | 現在のアプリはプレースホルダーの仮アセットのみで、ブランド認知・ストア掲載・SNS共有に必要なデザインアセットが未整備 |

#### 必要なアセット一覧

| # | アセット | 現状 | 用途 | 対応ファイル |
|---|---------|------|------|-------------|
| 1 | **Favicon** | ❌ 未設定（Next.js デフォルト） | ブラウザタブのアイコン | `app/favicon.ico` or `app/icon.svg` |
| 2 | **OG画像** | ❌ 未設定 | SNS共有時のプレビュー画像（Twitter/LINE/Facebook） | `app/opengraph-image.png` (1200×630) |
| 3 | **PWA アイコン (192×192)** | ⚠️ 仮（ゴールド矩形 + "a:m" テキスト） | ホーム画面追加時のアイコン | `public/icons/icon-192.svg` → PNG 推奨 |
| 4 | **PWA アイコン (512×512)** | ⚠️ 仮（同上） | スプラッシュスクリーン・ストア掲載 | `public/icons/icon-512.svg` → PNG 推奨 |
| 5 | **ログイン画面ロゴ** | ⚠️ テキストのみ（`<h1>alche:me</h1>`） | ログイン/サインアップ画面のブランドロゴ | `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` |
| 6 | **Apple Touch Icon** | ❌ 未設定 | iOS Safari でホーム画面追加時 | `public/apple-touch-icon.png` (180×180) |
| 7 | **スプラッシュスクリーン** | ❌ 未設定 | PWA 起動時の読み込み画面 | `public/icons/` + `manifest.json` |

#### 備考
- PWA アイコンは PNG 形式推奨（SVG は一部ブラウザで未サポート）
- OG画像は `app/opengraph-image.png` に配置すると Next.js が自動で `<meta property="og:image">` を生成
- ロゴデザイン確定後、上記全アセットを一括で差し替え
- テーマカラー `#C9A96E`（ゴールド）、背景色 `#FFF8F3`（warm cream）は `manifest.json` で定義済み

### BRAND-003: サービス全体の設計見直し

| 項目 | 詳細 |
|------|------|
| **重要度** | Low（長期的に重要） |
| **提案** | 実際に手を動かしてみて分かったことやアイデアが多いため、サービス全体の設計を振り返り、ユーザー体験のコアバリューを再確認する |
| **検討テーマ** | ① 「毎朝の5分」がコアユースケースだが、実際のユーザーフローでそれが実現できているか ② SNS機能の位置づけ（メイン vs サブ） ③ コスメ管理とメイク提案のバランス ④ 他サービス（@cosme, LIPS等）との差別化ポイントの明確化 |

---

## 7. 優先度マトリクス

### P0: 即座に対応（バグ修正）

| ID | タイトル | 工数 | 影響度 |
|----|---------|------|--------|
| ~~BUG-001~~ | ~~天気API連携の失敗~~ | ~~小~~ | ✅ 解決済み（Open-Meteo フォールバック実装） |
| ~~BUG-002~~ | ~~Next Cosme の手動追加失敗~~ | ~~小~~ | ✅ 解決済み（undefined 除外 + UI用語リネーム） |
| ~~BUG-003~~ | ~~GET /api/users/me 初回 401~~ | ~~小~~ | ✅ 解決済み（SWR キーの loading ゲート追加） |

### P1: 早期対応（UX改善・コア機能）

| ID | タイトル | 工数 | 影響度 |
|----|---------|------|--------|
| FEAT-005 | メイクテーマ・レシピ提案のフロー化UI | 大 | コアUX体験の革新 |
| ~~FEAT-004~~ | ~~スケジュール連携（Google Calendar等）~~ | ~~中〜大~~ | ✅ 完了（Google Calendar OAuth + カレンダー選択 + 手動入力 + Agent統合） |
| ~~ARCH-002(短期)~~ | ~~ADK Memory の永続化（短期策）~~ | ~~中~~ | ✅ 完了（Profiler結果のFirestore永続化 + セッション自動注入） |
| UX-001 | レシピ・プレビュー画像の同時生成 ✅ | 中 | ユーザー体験の滑らかさ |
| ~~OPS-001~~ | ~~Open-Meteo APIコール監視 & アラート~~ | ~~小〜中~~ | ✅ 解決済み（構造化ログ + キャッシュ + 設定手順書） |
| ~~UX-003~~ | ~~ブランド名・商品名のサジェスト~~ | ~~中~~ | ✅ 完了（AutocompleteInput + DuplicateWarning — 3画面統合・32テスト通過） |
| ~~UX-002~~ | ~~レシピ一覧UIの統一~~ | ~~中~~ | ✅ 完了（glass-card + aspect-square + BulkActionBar 共有 — 6ファイル変更・335テスト通過） |

### P2: 計画的に対応（機能拡張）

| ID | タイトル | 工数 | 影響度 |
|----|---------|------|--------|
| FEAT-004(Phase2) | マルチカレンダー連携（Notion/Apple/Outlook） | 中 | スケジュール連携の拡張 |
| FEAT-001 | メイク日記の再設計 | 大 | エンゲージメント向上 |
| UX-004 | Next Cosme の登録方法統一 | 中 | 機能一貫性 |
| UX-005 | Next Cosme 画像アップロード | 小〜中 | スケーラビリティ |
| UX-006 | 価格フィールドの逆輸入 | 中 | データ戦略基盤 |
| UX-007 | チャット履歴管理強化 | 中〜大 | ユーザビリティ |
| ~~ARCH-003~~ | ~~商品マスタの階層構造~~ | ~~大~~ | ✅ 完了（共有商品カタログ実装） |

### P3: 将来検討（Deep Research 必要）

| ID | タイトル | 工数 | 影響度 |
|----|---------|------|--------|
| ~~FEAT-001(DR)~~ | ~~メイク日記の Deep Research~~ | ~~中~~ | ✅ 完了（2026-02-18）包括的調査レポート作成 |
| ~~FEAT-002(DR)~~ | ~~モバイルナビゲーションの Deep Research~~ | ~~中~~ | ✅ 完了（2026-02-18）包括的調査レポート作成 |
| ~~FEAT-002(残存)~~ | ~~SNS 導線改善（フィード・フォローの発見性向上）~~ | ~~中~~ | ✅ 完了（2026-02-21）ボトムナビ Feed 昇格 + フォローリスト + フィードフォローボタン |
| FEAT-003 | エージェント動作の可視化 | 中 | 透明性・教育 |
| BRAND-001 | AI美容部員キャラクター設計 | 大 | ブランドエンゲージメント |
| BRAND-002 | デザインアセット（ロゴ・アイコン・OG画像） | 中 | ブランディング基盤 |
| BRAND-003 | サービス全体設計見直し | 大 | 長期ビジョン |

---

## 8. 実施ロードマップ案

### Phase 2.5: バグ修正 + Quick Wins（1-2週間）

- [x] BUG-001: 天気API — Open-Meteo フォールバック実装 ✅
- [x] BUG-002: Next Cosme 手動追加の修正 ✅
- [x] OPS-001: Open-Meteo APIコール監視 & アラート設定 ✅
- [x] ARCH-002（短期）: Profiler結果のFirestore永続化 ✅
- [x] FEAT-001/002: Deep Research — Claude 調査（成功アプリ11本の包括的 UI/UX 調査）✅
- [x] FEAT-001/002: Deep Research — Gemini 統合レポート ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #1 LIPS アプリ最新 UI/UX ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #2 @cosme アプリ最新 UI/UX ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #3 iOS 26 Liquid Glass ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #4 Apple Journal → Beauty Log ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #5 Generative UI (GenUI) 実装パターン ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #6 Duolingo ガミフィケーション設計 ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #7 TikTok/Instagram 最新ナビゲーション ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #8 Sephora/YouCam バーチャルトライオン ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #9 ChatGPT/Gemini/Claude 最新チャット UI ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #10 NOIN/Lemon8 等 新興美容アプリ ✅
- [x] FEAT-001/002: Deep Research — Gemini 個別 #11 WEAR コーデアプリ UI/UX ✅

### Phase 2.5A: ナビゲーション再構築（1-2週間）— Deep Research 知見に基づく

- [x] FEAT-002(部分): タブ構成の再設計（My Cosme + Next Cosme 統合、マイページ新設、中央「+」ボタン）✅ Batch 1-3 完了
- [x] FEAT-002(部分): カテゴリ/ブランドビュー切替（LIPS パターン応用 — フィルタモード切替 + Level 2 サブカテゴリチップ）✅ Batch 9 完了
- ⚠️ FEAT-002 残存: SNS 導線改善（フィード・フォロー機能へのアクセス向上）→ **Phase 3 に移行**
- [x] UX-002: Recipe タブの Explore 風グリッド化 + ヒーローCTA + クイックフィルタ ✅ Batch 4 完了
- [x] BRAND-002: デザインアセット生成プロンプト作成 ✅ `docs/guides/brand-asset-prompts.md`（アセット画像自体は手動生成待ち）

### Phase 2.5B: Beauty Log ホリスティック・リデザイン ✅ 完了（2026-02-19）

- [x] FEAT-001: Schema 拡張（temp/humidity）+ Weather API 湿度返却 + Beauty Log API start/end クエリ + used_items 自動埋め ✅
- [x] FEAT-001: Today's Beauty Forecast（チャット画面 — 天気×過去パターン → おすすめレシピ + 美容アドバイス + Streak）✅
- [x] FEAT-001: ストーリーズトレイ（チャット画面上部に過去7日のルック表示）✅
- [x] FEAT-001: Weekly Beauty Report + AI 洞察（天気×評価相関、気分パターン、シーン偏り検知）✅
- [x] FEAT-001: Calendar Beauty Palette（Daylio Year in Pixels 着想、rating カラー塗り + 月間サマリー）✅
- [x] FEAT-001: Timeline フォトファースト・カード（Dribbble/Instagram Feed スタイル）✅
- [x] FEAT-001: 詳細画面 + カード天気表示（気温/湿度バッジ）✅
- 計画: `docs/plans/2026-02-19_Phase2.5B_beauty-log-redesign.md`

### Phase 2.5C: チャット UI 改善 ✅ 完了（2026-02-19）

- [x] Chat: チャットスターター改善（パーソナライズ挨拶 + データ駆動固定ラベル4チップ）✅
- [x] Chat: 停止ボタン + リトライ/再生成 ✅
- [x] Chat: リッチコンテンツカード拡充（商品カード、テクニックカード + SSEパイプライン）✅
- [x] Chat: match_score ラベル改善（再現度 → 手持ちコスメ一致率 + 色分け）✅
- 計画: `docs/plans/2026-02-19_Phase2.5C_chat-ui-improvement.md`

### Phase 2.5D: バグ修正 + UX 改善 ✅ 完了（2026-02-19）

- [x] A1: チャットヘッダー "A" サークル削除 ✅
- [x] A2: メイク日記フォームの戻るボタン修正（PageHeader `onBack` prop + Suspense 境界）✅
- [x] A3: ストーリーズトレイの遷移先修正（`?date=` / `?new=true` パラメータ対応）✅
- [x] A4: ラベル統一「手持ちコスメ一致率」（5ファイル + 色分け追加）✅
- [x] B1: プロのコツ glass-card リデザイン + ナンバリング ✅
- [x] B2: フィードバックセクション glass-card ラッパー ✅
- [x] B3: 手持ち/代用テクバッジ + サマリー行 ✅
- [x] B4: レシピ詳細 PC レスポンシブ 2 カラムレイアウト ✅
- [x] C1: マイページカテゴリ ツールチップ + クリック→在庫フィルタ ✅
- 計画: `docs/plans/2026-02-19_Phase2.5D_bugfix-ux-improvement.md`

### Phase 3: コアUX革新 + 機能拡張（2-4週間）

- [x] FEAT-002(残存): SNS 導線改善 ✅（ボトムナビ Feed 昇格 + フォローリスト + フィードフォローボタン。計画: `docs/plans/2026-02-21_FEAT-002_sns-navigation.md`）
- [x] コスメ指定レシピ提案 + AI プロアクティブ提案 ✅（コスメ選択 UI + 使用分析インサイト + Agent 連携。計画: `docs/plans/2026-02-22_FEAT-cosme-specification.md`）
- [x] FEAT-005A: メイクテーマ提案カードUI（Tinder風スワイプ + AI画像生成）✅（計画: `docs/plans/2026-02-22_FEAT-005A_theme-card-ui.md`）
- [x] FEAT-005B: メイクレシピ提案フロー（おみくじ風UI）✅（計画: `docs/plans/2026-02-22_FEAT-005BC_omikuji-greeting.md`）
- [x] FEAT-005C: チャット開始メッセージの改善 ✅
- [x] UX-011: チャットページ整理 — コンテンツ再配置 ✅（BeautyTodayCard+StoriesTray→Beauty Log、CosmeInsightsCard→Inventory、ChatContextStrip新設、QuickActionChips 2行ラップ化。計画: `docs/plans/2026-02-22_UX-011_chat-page-declutter.md`）
- [x] FEAT-006: アバター髪型カスタマイズ ✅（設定で髪型6種+髪色8種を選択 → AI生成プレビュー画像に反映。計画: `docs/plans/2026-02-23_FEAT-006_avatar-hairstyle.md`）
- [ ] FEAT-007: 顔タイプ診断 → カスタムアバター（顔写真 AI 分析 → 特徴反映アバター生成、再生成可）
- [x] UX-008: レシピステップにコスメ画像表示 ✅（RecipeStep型にimage_url追加、レシピ詳細ページでinventoryのimage_url/rakuten_image_urlをエンリッチ、RecipeStepCardに36pxサムネイル表示）
- [x] UX-009: レシピ提案の柔軟性強化 ✅（CosmePickerSheet に「レシピカスタマイズ」統合: 3段階スナップスライダー「持ってるコスメ活用⇔新しい自分発見」+ ブランド指定チップ + コスメ選択。ChatInput上にモード・ブランド・コスメのサマリーチップ表示。match_mode + selected_brands を BFF→Agent→Alchemist プロンプトに伝搬。用語「手持ちコスメ一致率」→「再現度」にリネーム + コンセプト説明ポップオーバー。代用テク情報を SubstitutionInfo として構造化、楽天検索URL自動付与、RecipeStepCard に構造化カードUI表示）
- [x] UX-010: レシピ一覧の再現度フィルター ✅（useRecipes に matchScoreFilter 追加、80%以上/50%以上/50%未満 のクイックフィルターチップ + フィルターシートに再現度セクション追加。アクティブフィルターバッジ対応）
- [x] FEAT-004: Google Calendar API 連携 ✅（OAuth 2.0 + カレンダー選択 + 手動入力 + Agent TPO Tactician 統合。計画: `docs/plans/2026-03-07_FEAT-004_google-calendar.md`）
- [x] UX-001: レシピ・プレビュー画像の同時生成 ✅ (2026-02-22)
- [x] UX-003: ブランド名・商品名サジェスト + 重複検知 ✅ (2026-03-07)
- [ ] UX-004: Next Cosme の登録方法統一（共通コンポーネント化）
- [ ] UX-005: Next Cosme 画像アップロード方式への移行
- [ ] UX-006: 価格フィールドの追加
- [ ] UX-007: チャット履歴管理強化

### Phase 3.5: 追加 Deep Research + 拡張（2-4週間）

- [ ] FEAT-004(Phase2): マルチカレンダー連携（Notion/Apple/Outlook）
- [x] ARCH-003: 共有商品カタログ実装 ✅（Phase 3 に前倒し実施。計画: `docs/plans/2026-02-21_ARCH-003_shared-catalog.md`）
- [ ] BRAND-001: AI美容部員キャラクターデザイン

### Phase 4: ビジネス基盤（Phase 3完了後）

- [ ] ARCH-002（長期）: Memory永続化の本格実装
- [ ] FEAT-003: エージェント動作の可視化
- [ ] DATA-001, DATA-002: データ分析基盤
- [ ] BRAND-002: サービス全体設計見直し

---

### インフラ改善（2026-03-07）

- [x] Secret Manager 移行: 10個の機密値を `availableSecrets` 方式に移行 ✅
- [x] Cloud Build トリガー: GitHub 2nd-gen 接続 + `main` ブランチ push 自動デプロイ ✅
- [x] 画像加工パイプライン: スキャン自動加工 + バッチ API + 楽天リンク規約対応 ✅
- [x] PhotoEditSheet: Instagram風画像編集UI（背景除去 + フィルター + 調整 + 回転）✅
- [x] NAV-001: ナビゲーション再構築 — ボトムナビ5タブ(ホーム/発見/AI美容部員/Next Cosme/マイページ) + FAB + サイドメニュー重複解消 ✅
- [x] NAV-001-D: ホーム画面LIPS風アイコングリッド — 6ショートカット(AI診断/ランキング/レシピ/スキャン/メイク日記/My Cosme) + タイトル「ホーム」+ タブ名「おすすめ」 ✅
- [x] UX-MyPage: マイページ全体リデザイン — カレンダーサイドメニュー統合 + 戻るボタンrouter.back()修正 + レイアウト再構成(BeautyLogPreview/CategoryBadgesタブ内移動、スティッキータブ) ✅

*Created: 2026-02-17*
*Last Updated: 2026-03-08 (UX-MyPage マイページリデザイン 完了)*
