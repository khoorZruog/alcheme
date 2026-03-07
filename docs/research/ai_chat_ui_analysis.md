# AI チャット UI 比較分析レポート

> **対象アプリ**: Claude / ChatGPT / Gemini
> **調査目的**: alche:me（美容コスメ AI アプリ）への UX パターン適用検討
> **作成日**: 2026-02-18
> **ステータス**: v1.0 — 初版

---

## 目次

1. [Claude チャット UI 分析](#1-claude-チャット-ui-分析)
2. [ChatGPT チャット UI 分析](#2-chatgpt-チャット-ui-分析)
3. [Gemini チャット UI 分析](#3-gemini-チャット-ui-分析)
4. [業界共通パターン](#4-業界共通パターン)
5. [alche:me 現状分析](#5-alcheme-現状分析)
6. [改善提案（優先度付き）](#6-改善提案優先度付き)
7. [リッチカード設計仕様](#7-リッチカード設計仕様)

---

## 1. Claude チャット UI 分析

### 1.1 全体レイアウト

Claude のインターフェースは「知的で温かみのあるミニマリズム」を基調としている。画面は大きく 3 つのゾーンに分割される。

| ゾーン | 位置 | 主要要素 |
|--------|------|----------|
| Sidebar | 左カラム (280px) | Conversation list, Projects, Search |
| Main Chat | 中央 (flex-1) | Message thread, Input area |
| Artifacts Panel | 右カラム (0 or 480px) | Code preview, Document preview, SVG render |

### 1.2 Artifacts Panel（サイドバイサイド表示）

Claude 最大の差別化ポイント。AI が生成したコード・文書・SVG をリアルタイムで右パネルにレンダリングする。

```
+------------------+------------------------+
|  Chat Thread     |   Artifacts Panel      |
|                  |  +------------------+  |
|  User: ...       |  | [Code] [Preview] |  |
|  Claude: ...     |  |                  |  |
|  (生成中 ->)     |  | (リアルタイム     |  |
|                  |  |  レンダリング)    |  |
|                  |  +------------------+  |
+------------------+------------------------+
```

**特徴**:
- Tab 切り替え: `Code` / `Preview` の 2 タブ
- Copy ボタン: ワンクリックでコード全体をコピー
- Download ボタン: ファイルとして直接ダウンロード
- Version history: Artifact の変更履歴をトラッキング

**alche:me への示唆**: レシピの "ステップ・バイ・ステップ" プレビューを右パネル表示するモバイル版パターンとして応用可能。ただしモバイルファーストの alche:me では、full-screen overlay もしくは bottom-sheet が現実的。

### 1.3 Extended Thinking（思考プロセスの可視化）

Claude は「考え中」の内部推論を collapsible セクションとして表示する。

```
+--------------------------------------+
| > Thinking...                        |
|  +-- Analyzing user's request...     |
|  +-- Checking context from project...|
|  +-- Formulating response...         |
|                                      |
| (展開すると推論ステップが読める)       |
+--------------------------------------+
```

| 属性 | 詳細 |
|------|------|
| デフォルト状態 | Collapsed (折りたたみ) |
| トグル | クリックで展開/折りたたみ |
| タイミング | 応答生成前〜中に表示 |
| 目的 | 透明性の確保、待ち時間の知覚的短縮 |

**alche:me への示唆**: 現行の `ThinkingIndicator` コンポーネントは既に SSE `progress` イベントを活用したリアルタイムステータス表示 + ローテーション TIPS + 経過時間表示を実装しており、業界水準を上回る。Claude の collapsible パターンは「なぜこのレシピを選んだか」の推論可視化に転用可能。

### 1.4 Projects 機能（共有ナレッジベース）

```
Projects
+-- Project A
|   +-- Custom Instructions
|   +-- Uploaded Files (PDF, code, docs)
|   +-- Conversation History (project-scoped)
+-- Project B
    +-- ...
```

- プロジェクト単位でファイルアップロード・カスタム指示を設定
- 会話はプロジェクトにスコープされ、アップロードされた文書を自動参照
- チームコラボレーション向け（有料プラン）

**alche:me への示唆**: 「マイコスメコレクション」をプロジェクト的に扱う概念と類似。ユーザーのインベントリ + 肌タイプ + 好みがプロジェクトの shared knowledge に相当する。

### 1.5 デザイントーン

| 要素 | Claude の特徴 |
|------|---------------|
| Typography | Serif (見出し) + Sans-serif (本文) の組み合わせ |
| カラーパレット | Warm beige (#FAF9F6) 背景 + Terra cotta アクセント |
| Tone of voice | 知的・丁寧・温かみ (例: "I'd be happy to help...") |
| アバター | なし（AI 側はロゴマーク、ユーザー側は頭文字アイコン） |
| 余白 | 広めの padding (24px+) で視認性重視 |

### 1.6 入力エリア

```
+----------------------------------------------+
| [Attach] | テキスト入力欄            [-> Send] |
| Model: Claude Opus 4.6 v                     |
+----------------------------------------------+
```

- 添付ファイル: 画像、PDF、テキストファイル対応
- Model selector: ドロップダウンでモデル切り替え
- 入力欄は auto-resize (複数行対応)
- `Shift+Enter` で改行、`Enter` で送信

### 1.7 会話管理

| 機能 | 実装 |
|------|------|
| Rename | 会話タイトルのインライン編集 |
| Archive | 会話のアーカイブ（サイドバーから非表示） |
| Search | サイドバー上部の検索バーでフルテキスト検索 |
| Delete | 会話の完全削除 |
| Export | なし（API 経由で取得は可能） |

### 1.8 Memory（記憶機能）

Claude は **セッション間での永続的な Memory を持たない**。これは ChatGPT との最大の差異である。

| 比較項目 | Claude | ChatGPT |
|----------|--------|---------|
| Cross-session memory | なし | あり（Memory 機能） |
| Project context | Projects 内で有効 | Custom GPTs で部分的 |
| User profile learning | なし | 自動学習 + 手動編集可能 |

---

## 2. ChatGPT チャット UI 分析

### 2.1 全体レイアウト

ChatGPT は「最もポピュラーなチャット AI」として、直感的なメッセージングアプリ風のインターフェースを採用している。

| ゾーン | 位置 | 主要要素 |
|--------|------|----------|
| Sidebar | 左カラム (260px, collapsible) | Conversation list, GPTs, Explore |
| Main Chat | 中央 (flex-1, max-width: 768px) | Message thread, Input area |
| Canvas | 右カラム (開閉式) | Collaborative editing panel |

### 2.2 "Memory updated" 通知バッジ -- 重要パターン

ChatGPT 最大のイノベーションの一つ。AI が会話から情報を学習・記憶した際に表示されるインライン通知。

```
+----------------------------------------------+
|  [Brain] Memory updated                       |
|  +----------------------------------------+  |
|  | "xxさんは乾燥肌で、赤みを気にして      |  |
|  |  いる" を記憶しました                   |  |
|  +----------------------------------------+  |
+----------------------------------------------+
```

**表示パターン**:

| 状態 | 表示 |
|------|------|
| 初期 | 小さなバッジ "Memory updated" |
| 展開 | クリックで記憶内容のサマリーを表示 |
| 管理画面 | Settings > Memory で全記憶を閲覧・編集・削除 |

**alche:me への適用 (高優先度)**:
- 「肌タイプ: 乾燥肌 を記憶しました」
- 「好きなブランド: NARS を記憶しました」
- 「苦手な色: オレンジ系 を記憶しました」
- プロフィール画面に「AIが学習した内容」セクションを追加

### 2.3 GPTs（カスタムエージェント・マーケットプレイス）

```
+-- GPTs Marketplace --------------------------+
|                                              |
|  [Design]  [Writing]  [Research]             |
|                                              |
|  +--------+  +--------+  +--------+         |
|  | Logo   |  | Logo   |  | Logo   |         |
|  | GPT名  |  | GPT名  |  | GPT名  |         |
|  | 説明   |  | 説明   |  | 説明   |         |
|  | *4.5   |  | *4.8   |  | *4.2   |         |
|  +--------+  +--------+  +--------+         |
|                                              |
+----------------------------------------------+
```

- ユーザーまたは OpenAI が作成したカスタムエージェント
- 特定ドメインに特化した instruction + tools
- 評価・レビュー・共有機能付きのマーケットプレイス

**alche:me への示唆**: 将来的に「パーソナルカラー診断 AI」「韓国メイクアドバイザー」「プチプラ専門家」など、専門分野別のエージェントペルソナを提供する際の参考モデル。

### 2.4 Canvas（協調編集パネル）

- 文章やコードを AI と共同編集するパネル
- ドキュメント内のテキストを選択して「ここを改善して」と指示可能
- 編集履歴のバージョン管理
- 右パネルで開く（Claude Artifacts と類似概念）

**alche:me への示唆**: メイクレシピの「カスタマイズモード」 -- ステップを選択して「この部分を時短にして」と指示する UX に応用可能。

### 2.5 Branching Navigation（分岐ナビゲーション）

```
                +-- Response A --+
User Message ---|                |
                +-- Response B --+

表示: < 1/2 >  (矢印で切り替え)
```

- AI の回答が不満な場合に「Regenerate」で別の回答を生成
- 過去の分岐も保持され、`< 1/2 >` のようなナビゲーションで行き来可能
- メッセージ単位でブランチが管理される

**alche:me への示唆**: 「別のレシピを提案して」機能の実装に直結。`< レシピ 1/3 >` のようにスワイプで複数提案を閲覧できる UX。

### 2.6 Voice Mode & Multimodal Input

| 入力モード | 説明 |
|-----------|------|
| Text | 標準テキスト入力 |
| Voice | リアルタイム音声会話（Advanced Voice Mode） |
| Image | カメラ撮影 or アップロード |
| File | PDF, DOCX, CSV, etc. |
| Web browse | URL を指定してページ内容を取得 |

**alche:me への示唆**: コスメ写真のカメラ撮影 -> AI鑑定の既存フローと整合。音声入力は「朝の忙しい時間にハンズフリーで相談」シナリオに有効。

### 2.7 Conversation Starters（会話開始カード）

空のチャット画面に表示される提案カード。

```
+----------------------------------------+
|         ChatGPT                        |
|                                        |
|  +--------------+  +--------------+    |
|  | Help me      |  | Give me      |    |
|  |   write      |  |   ideas      |    |
|  +--------------+  +--------------+    |
|  +--------------+  +--------------+    |
|  | Analyze      |  | Create       |    |
|  |   data       |  |   content    |    |
|  +--------------+  +--------------+    |
|                                        |
|  [テキスト入力欄]                      |
+----------------------------------------+
```

- 4つのカテゴリカード（Write / Ideas / Analyze / Create など）
- 各カードに短い説明テキスト
- クリックでプロンプトが入力欄に挿入される
- ログイン直後やリフレッシュ時に表示

**alche:me の現状**: `QuickActionChips` コンポーネントで「今日のメイク」「時短5分」「デートメイク」の 3 チップを実装済み。ChatGPT のカード型と比較してコンパクトだが、拡張の余地あり。

### 2.8 Memory システム（永続記憶）

ChatGPT のメモリは 3 層構造:

| レイヤー | スコープ | 例 |
|---------|---------|-----|
| Global Memory | 全会話共通 | "ユーザーはxxに住んでいる" |
| Custom Instructions | 全会話共通 | "回答は日本語で" |
| Conversation Context | 当該会話のみ | 直近のやり取り |

**管理画面の構造**:
```
Settings > Personalization > Memory
+------------------------------------+
| Memory                             |
|                                    |
| * "xxはデザイナーとして働いている"  | [x]
| * "Python と TypeScript を使う"    | [x]
| * "簡潔な回答を好む"              | [x]
|                                    |
| [Clear all memories]               |
+------------------------------------+
```

- 各記憶アイテムを個別に削除可能
- "Clear all memories" で一括リセット
- Memory を一時的にオフにするトグル

---

## 3. Gemini チャット UI 分析

### 3.1 全体レイアウト

Gemini は Google エコシステムとの深い統合を特徴とし、「汎用アシスタント」から「専門ドメインの情報提供」まで幅広くカバーする。

| ゾーン | 位置 | 主要要素 |
|--------|------|----------|
| Sidebar | 左カラム (collapsible) | Recent chats, Gems |
| Main Chat | 中央 (max-width: 780px) | Message thread, Input |
| Extensions | インライン | @mention で呼び出し |

### 3.2 @mention Extensions

```
入力欄: @YouTube 最新のメイクチュートリアル

対応 Extension:
+--------------------------------------+
| @YouTube    -- 動画検索・要約        |
| @Maps       -- 場所検索・経路案内    |
| @Flights    -- フライト検索          |
| @Hotels     -- ホテル検索・比較      |
| @Google Docs -- ドキュメント操作     |
| @Google Drive -- ファイル検索        |
+--------------------------------------+
```

- `@` をタイプすると Extension リストがオートコンプリート表示
- 各 Extension は Google サービスへの API コネクター
- 応答内にリッチカード（後述）として構造化データを表示

**alche:me への示唆**: 将来的に `@コスメDB` `@成分辞典` `@トレンド` のような Extension 的な呼び出しパターンを検討可能。

### 3.3 "Show drafts" -- 複数応答の並列生成

```
AI の応答メッセージ
---------------------
[Show drafts v]

展開すると:
+----------+  +----------+  +----------+
| Draft 1  |  | Draft 2  |  | Draft 3  |
| (current)|  |          |  |          |
+----------+  +----------+  +----------+
```

- AI が内部で複数のドラフトを同時生成
- ユーザーは "Show drafts" ボタンで代替回答を閲覧
- タブ切り替え式の UI で Draft 間をナビゲート
- ChatGPT の Branching とは異なり、事前に複数生成される点がユニーク

**alche:me への示唆**: 「3つのレシピ提案」を Draft タブ形式で表示する UX。現在の `parseThemeSuggestions` はインラインのタップ可能ボタンで実装しており、方向性は近い。

### 3.4 Post-actions（応答後のアクションボタン）

Gemini の回答直下に表示されるリファインメントボタン群。

```
AI の応答テキスト...

[Like] [Dislike] [Copy] [Regenerate] [Share] [...]

[Shorter] [Longer] [Simpler] [More casual] [More professional]
```

| ボタン | 機能 |
|--------|------|
| Shorter | 回答を短くリライト |
| Longer | 回答を長く・詳しくリライト |
| Simpler | よりシンプルな表現にリライト |
| More casual | カジュアルなトーンにリライト |
| More professional | フォーマルなトーンにリライト |

**alche:me への適用 (高優先度)**:

| Gemini ボタン | alche:me 版 | 用途 |
|--------------|-------------|------|
| Shorter | 時短で | ステップ数を減らした時短バージョン |
| Longer | 詳しく | より詳細な解説・テクニック付き |
| Simpler | 手持ちだけで | 追加購入不要のバージョン |
| -- | 別提案 | まったく異なるコンセプトのレシピ |

### 3.5 Google Grounding（検索統合）

- AI の回答に Web 検索結果を統合
- 「Google で検索」ボタンで根拠となるソースを表示
- ソース URL のリンクカード付き
- ファクトチェック的な信頼性向上

**alche:me への示唆**: コスメの成分情報や口コミを外部ソースから引用する際の参考パターン。

### 3.6 Flights / Hotels リッチカード -- 最重要パターン

Gemini の最大の特徴はドメイン固有のリッチカード表示。

```
+-- Flight Card -----------------------------------+
|                                                  |
|  [plane] ANA NH123                               |
|  東京 (NRT) -> 大阪 (ITM)                        |
|  10:00 -> 11:15  (1h15m)                         |
|                                                  |
|  Y12,500 ~                                       |
|  Economy | Non-stop                              |
|                                                  |
|  [Google Flights で詳細を見る ->]                 |
+--------------------------------------------------+

+-- Hotel Card ------------------------------------+
|  +------+                                        |
|  | img  | Hotel Name ****                        |
|  |      | Y15,000 / 泊                           |
|  +------+ 渋谷区...                              |
|                                                  |
|  Amenities: WiFi, Spa, Restaurant                |
|  [Google Hotels で予約 ->]                        |
+--------------------------------------------------+
```

**重要な設計原則**:
1. **構造化データ**: テキストではなくカード形式で情報を整理
2. **視覚的階層**: 重要情報（価格・時間）を大きく、補足情報を小さく
3. **CTA (Call-to-Action)**: 「詳細を見る」「予約する」の明確なアクションボタン
4. **ブランド統合**: Google のサービスへのディープリンク

**alche:me のドメイン固有カードへの直接応用**:
- **Product Card**: コスメ商品のリッチカード
- **Comparison Card**: 複数商品の比較カード
- **Technique Card**: テクニック手順カード

（詳細設計はセクション 7 で後述）

### 3.7 "Hello, [name]" パーソナライズド挨拶

```
+----------------------------------------+
|                                        |
|       こんにちは、xxさん                |
|                                        |
|  今日は何をお手伝いしましょうか？      |
|                                        |
|  [提案カード 1] [提案カード 2]         |
|  [提案カード 3] [提案カード 4]         |
|                                        |
+----------------------------------------+
```

- Google アカウントの表示名を使用
- 時間帯に応じた挨拶 (おはようございます / こんにちは / こんばんは)
- 直近のアクティビティに基づく提案カード

**alche:me への適用**:
現在 `INITIAL_MESSAGE` は固定テキスト「おはようございます！」だが、以下の動的化が可能:
- 時間帯別挨拶
- ユーザー名の挿入
- 天気情報に基づくメイク提案（例: 「今日は湿度が高いので崩れにくいメイクがおすすめ」）
- 前回の会話からの文脈引き継ぎ

### 3.8 Gems（カスタムインストラクション）

```
Gems
+-- Writing Editor -- 文章校正・編集の専門家
+-- Brainstormer -- アイデア出しの相棒
+-- Career Advisor -- キャリア相談
+-- + Create new Gem
```

- ユーザーが自然言語で「性格」「専門性」「応答スタイル」を定義
- Gem ごとに独立した会話スレッド
- ChatGPT の GPTs に近いが、より軽量（ノーコード）

---

## 4. 業界共通パターン

3 つの主要チャット AI を横断して共通する UI パターンを整理する。

### 4.1 共通パターン一覧

| # | パターン | Claude | ChatGPT | Gemini | alche:me 現状 |
|---|---------|--------|---------|--------|---------------|
| 1 | 非対称チャットバブル (user: 右, AI: 左) | o | o | o | o 実装済み |
| 2 | 画面下部固定の入力バー | o | o | o | o 実装済み |
| 3 | Progressive streaming (token-by-token) | o | o | o | o SSE 実装済み |
| 4 | 日付・時刻によるメッセージグルーピング | o | o | o | x 未実装 |
| 5 | 空状態での Conversation starters | x (最近追加) | o | o | o QuickActionChips |
| 6 | Copy / Share / Like-Dislike ボタン | o | o | o | x 未実装 |
| 7 | Typing / Thinking インジケーター | o (Extended) | o (dots) | o (dots) | o ThinkingIndicator |
| 8 | Code block + syntax highlighting | o | o | o | x 部分的 |
| 9 | Markdown レンダリング | o | o | o | o ReactMarkdown |
| 10 | Stop (中断) ボタン | o | o | o | x **未実装** |
| 11 | Retry / Regenerate | o | o | o | x **未実装** |
| 12 | 会話一覧 (Sidebar) | o | o | o | o ChatHistorySidebar |
| 13 | Dark mode | o | o | o | x 未対応 |
| 14 | 画像添付 | o | o | o | o 実装済み |
| 15 | Auto-scroll to bottom | o | o | o | o bottomRef |

### 4.2 各社固有の差別化パターン

| パターン | 提供元 | 差別化ポイント |
|---------|--------|---------------|
| Artifacts Panel | Claude | コード・ドキュメントのリアルタイムレンダリング |
| Extended Thinking | Claude | 推論プロセスの可視化 |
| Projects | Claude | 共有ナレッジベースによるコンテキスト管理 |
| Memory | ChatGPT | セッション横断の永続記憶 |
| GPTs Marketplace | ChatGPT | カスタムエージェントのエコシステム |
| Canvas | ChatGPT | 協調編集パネル |
| Branching Navigation | ChatGPT | `< 1/2 >` 形式の応答分岐ナビゲーション |
| @Extensions | Gemini | Google サービスとのインライン統合 |
| Show drafts | Gemini | 複数ドラフトの並列生成 |
| Post-actions | Gemini | 応答のリファインメントボタン |
| Rich Cards | Gemini | ドメイン固有の構造化カード (Flights/Hotels) |
| Google Grounding | Gemini | Web 検索によるファクトチェック |

### 4.3 入力エリアの比較

| 機能 | Claude | ChatGPT | Gemini | alche:me |
|------|--------|---------|--------|----------|
| テキスト入力 | o (auto-resize) | o (auto-resize) | o (auto-resize) | o (single line) |
| 画像添付 | o | o | o | o |
| ファイル添付 | o (PDF等) | o (多種) | o (限定的) | x |
| 音声入力 | x | o (Advanced Voice) | o | x |
| Model selector | o | o | o | x (固定) |
| Stop ボタン | o (生成中表示) | o (生成中表示) | o (生成中表示) | x **未実装** |
| Send ボタン形状 | 矢印 (up) | 矢印 (up) | 矢印 (right) | 矢印 (up) |

---

## 5. alche:me 現状分析

### 5.1 強み（業界水準を満たす or 上回る機能）

#### (A) ThinkingIndicator -- 業界をリードする実装

現行の `thinking-indicator.tsx` は以下の要素を組み合わせた高品質な実装:

| 要素 | 実装詳細 | 業界比較 |
|------|---------|---------|
| リアルタイムステータス | SSE `progress` イベントから動的更新 | Claude の Extended Thinking に近い |
| Shimmer animation | `framer-motion` による光沢アニメーション | 独自 -- 他社にない演出 |
| ローテーション TIPS | 4秒間隔で切り替わるヒントテキスト | 独自 -- 待ち時間の知覚的短縮 |
| Progress dots | ステータス履歴のドットインジケーター | 独自 -- 進捗の可視化 |
| 経過時間表示 | `{elapsed}s` のリアルタイム表示 | 独自 -- 透明性の確保 |

**評価**: ChatGPT の 3 dots や Gemini の標準的なローディングと比較して、大幅に高品質。ドメイン特化のコンテキスト（「季節や気温に合わせたアドバイスを準備中」等）が美容アプリとしてのブランド価値を高めている。

#### (B) RecipeCardInline -- ドメイン固有リッチカード

`recipe-card-inline.tsx` は Gemini の Flights/Hotels カードに相当するドメイン固有の構造化カード。

| 要素 | 実装 |
|------|------|
| Preview image | AI 生成プレビュー画像表示 |
| Match score | `MATCH 85%` バッジ表示 |
| Steps preview | 最初の 2 ステップをプレビュー |
| Substitution note | 代用品マーカー表示 |
| CTA | 「詳しく見る」グラデーションボタン |
| Favorite | ハートアイコンでお気に入り登録 |

**評価**: 業界の Rich Card パターンをコスメドメインに適切に転用。Gemini の Hotel Card の構造（画像 + 基本情報 + CTA）を踏襲している。

#### (C) parseThemeSuggestions -- 構造化レスポンス解析

`chat-message.tsx` 内の `parseThemeSuggestions` 関数は、AI の自然言語レスポンスからテーマ提案を抽出しタップ可能なボタンに変換する。

```
AI レスポンス (テキスト):
"今日はどんなテーマにしますか？
1) ナチュラル -- 透明感重視の素肌メイク
2) オフィス -- 好印象のきちんとメイク
3) 韓国風 -- グラスキン風の艶メイク"

変換後 (UI):
+-----------------------------------+
| 1  ナチュラル                      |
|    透明感重視の素肌メイク          |
+---------+---------+---------+-----+
| 2  オフィス                        |
|    好印象のきちんとメイク          |
+---------+---------+---------+-----+
| 3  韓国風                          |
|    グラスキン風の艶メイク          |
+-----------------------------------+
```

**評価**: AI レスポンスのパース -> リッチ UI 変換は ChatGPT / Gemini にはない独自の工夫。

### 5.2 不足機能（ギャップ分析）

| # | 不足機能 | 業界標準 | 影響度 | 現状の代替手段 |
|---|---------|---------|--------|---------------|
| G1 | **Stop ボタン** (生成中断) | 全 3 社が実装 | 高 | `AbortController` はあるが UI ボタンなし |
| G2 | **Retry / Regenerate** | 全 3 社が実装 | 高 | なし -- ユーザーは同じ質問を再送するしかない |
| G3 | **Post-actions** | Gemini | 中 | なし |
| G4 | **Memory visualization** | ChatGPT | 中 | なし -- プロフィール学習の可視化が欠如 |
| G5 | **Conversation search** | Claude + ChatGPT | 中 | なし -- サイドバーにタイトル一覧のみ |
| G6 | **Pin important messages** | なし (独自) | 低 | なし |
| G7 | **Copy / Like-Dislike ボタン** | 全 3 社が実装 | 中 | なし |
| G8 | **日付グルーピング** | 全 3 社が実装 | 低 | サイドバーでは実装済み (本文中は未対応) |
| G9 | **Auto-resize textarea** | 全 3 社が実装 | 低 | 現在は `<input type="text">` (1行固定) |

### 5.3 アーキテクチャ上の注目点

現行の `use-chat.ts` フックには以下のアーキテクチャ上の強みがある:

| 強み | 詳細 |
|------|------|
| SSE Streaming | `ReadableStream` + `TextDecoder` による本格的なストリーミング実装 |
| Event-driven data | `recipe_card`, `preview_image`, `progress`, `agent_used` のイベントタイプ別処理 |
| Firestore persistence | 会話の CRUD + メッセージ永続化が API 経由で完備 |
| AbortController | 中断ロジックは存在（UI ボタンが未実装なだけ） |
| Conversation management | 作成・読み込み・削除・リネームが全て実装済み |

---

## 6. 改善提案（優先度付き）

### 6.1 優先度マトリクス

| 優先度 | 機能 | 参照元 | 工数 | 期待効果 |
|--------|------|--------|------|---------|
| **P0** | Stop ボタン + Retry / Regenerate | 全 3 社 | S (1-2日) | ユーザビリティの基本要件。欠落は致命的 |
| **P1** | Chat starters 拡充 (挨拶パーソナライズ + 天気連動 + Quick actions 拡張) | Gemini + ChatGPT | S (2-3日) | 初回体験 (Empty state) の大幅改善 |
| **P2** | Post-actions (詳しく / 別提案 / 時短で / 手持ちだけで) | Gemini | S (2-3日) | 会話の深化・エンゲージメント向上 |
| **P3** | Product Card + Comparison Card + Technique Card | Gemini Flights/Hotels | M (5-7日) | ドメイン固有の情報提示力強化 |
| **P4** | Memory visualization (Profile banner + Learning badge) | ChatGPT | S (2-3日) | 「AI が自分を理解している」の実感向上 |
| **P5** | Conversation search + Pin | Claude + ChatGPT | M (3-5日) | 情報再発見性の向上 |

### 6.2 P0: Stop ボタン + Retry / Regenerate

**Stop ボタン**:

既存の `abortRef` を UI に接続するだけで実装可能。

```
実装箇所: chat-input.tsx + page.tsx

生成中の入力エリア:
+-------------------------------------------+
| [img] | AI が応答中...        [Stop icon]  |
+-------------------------------------------+

通常時の入力エリア:
+-------------------------------------------+
| [img] | 今日はどんな気分？    [Send icon]   |
+-------------------------------------------+
```

**Retry / Regenerate**:

メッセージ下部のアクションボタンとして実装。

```
AI メッセージの直下:
+-----------------------------+
| (AI の応答テキスト)          |
|                             |
| [Retry] [Copy]              |
+-----------------------------+
```

**実装方針**:
- `use-chat.ts` に `retryLastMessage()` 関数を追加
- 最後の assistant メッセージを削除し、最後の user メッセージを再送信
- `chat-message.tsx` に action bar コンポーネントを追加

### 6.3 P1: Chat Starters 拡充

```
現在の Empty State:
+----------------------------------+
| おはようございます！              |
| 今日はどんなメイクにしましょうか？|
|                                  |
| [今日のメイク] [時短5分]         |
| [デートメイク]                   |
+----------------------------------+

提案する改善 Empty State:
+------------------------------------+
| おはよう、xxさん                    |
| 今日の東京は晴れ、気温12C          |
| 乾燥が気になる季節ですね           |
|                                    |
| +--------------------------------+ |
| | [sun] 今日の天気に合ったメイク  | |
| | 乾燥対策のツヤ肌レシピ         | |
| +--------------------------------+ |
| +--------------------------------+ |
| | [clock] 5分で完成！時短メイク   | |
| | 朝の忙しい時間にぴったり       | |
| +--------------------------------+ |
| +--------------------------------+ |
| | [lipstick] 手持ちコスメ診断    | |
| | 最近追加したアイテムを活用      | |
| +--------------------------------+ |
| +--------------------------------+ |
| | [camera] コスメを撮影して鑑定  | |
| | カメラで撮るだけで AI が分析    | |
| +--------------------------------+ |
|                                    |
+------------------------------------+
```

**パーソナライズ要素**:

| 要素 | データソース | 優先度 |
|------|-------------|--------|
| ユーザー名 | Firebase Auth | 必須 |
| 時間帯別挨拶 | `new Date().getHours()` | 必須 |
| 天気情報 | OpenWeatherMap API | 推奨 |
| 前回の会話トピック | Firestore conversations | 推奨 |
| インベントリ状況 | Firestore inventory | 将来 |

### 6.4 P2: Post-actions

```
AI レシピ応答の下部:
+--------------------------------------+
| (AI のレシピ提案テキスト)             |
| (RecipeCardInline)                   |
|                                      |
| 気になるところはありますか？          |
|                                      |
| [詳しく] [別提案]                    |
| [時短で] [手持ちだけで]              |
+--------------------------------------+
```

| ボタン | 送信されるプロンプト |
|--------|-------------------|
| 詳しく | "このレシピをもっと詳しく説明して。各ステップのコツも教えて" |
| 別提案 | "全く別のコンセプトでもう一つレシピを提案して" |
| 時短で | "このレシピを3ステップ以内の時短バージョンにして" |
| 手持ちだけで | "追加購入なしで、今の手持ちコスメだけで作れるバージョンにして" |

**実装方針**:
- `PostActionChips` コンポーネントを新規作成
- `chat-message.tsx` で `recipeData` が存在する完了済みメッセージの末尾に表示
- 各ボタンクリック時に `onSendMessage` を呼び出し

### 6.5 P3: リッチカード拡充

（詳細はセクション 7 で記述）

### 6.6 P4: Memory Visualization

```
プロフィール画面 or サイドメニュー:
+----------------------------------------------+
| [brain] AI があなたについて学んだこと          |
|                                              |
| +------------------------------------------+ |
| | [tag] 肌タイプ: 乾燥肌                    | |
| |   2024/12/15 に学習                       | |
| +------------------------------------------+ |
| +------------------------------------------+ |
| | [tag] 好きなブランド: NARS, MAC           | |
| |   2025/01/03 に学習                       | |
| +------------------------------------------+ |
| +------------------------------------------+ |
| | [tag] メイクスタイル: ナチュラル           | |
| |   2025/01/10 に学習                       | |
| +------------------------------------------+ |
|                                              |
| [学習データをリセット]                        |
+----------------------------------------------+

チャット内 (ChatGPT 風バッジ):
+----------------------------------------------+
| [brain] Profile updated                       |
| 「乾燥肌で、特に頬の赤みが気になる」         |
| を記憶しました                                |
+----------------------------------------------+
```

### 6.7 P5: Conversation Search + Pin

```
ChatHistorySidebar の上部に検索バー追加:
+-- チャット履歴 -------------------------+
| [Search...]                             |
|                                         |
| 今日                                    |
| +- デートメイク相談            [pin]    |
| +- 時短メイクレシピ                     |
|                                         |
| 昨日                                    |
| +- コスメ鑑定（NARS ファンデ）          |
| +- オフィスメイク                       |
|                                         |
| ピン留め                                |
| +- [pin] デートメイク相談               |
+-----------------------------------------+
```

---

## 7. リッチカード設計仕様

### 7.1 カード体系の全体像

| カード種別 | 用途 | 実装状態 | 参照パターン |
|-----------|------|---------|-------------|
| Recipe Card | メイクレシピ表示 | o 実装済み | Gemini Hotel Card |
| Product Card | 個別コスメ商品の詳細表示 | x 未実装 | Gemini Hotel Card |
| Comparison Card | 複数商品の比較 | x 未実装 | Gemini Flight Card |
| Technique Card | テクニック手順の解説 | x 未実装 | 独自 |

### 7.2 Recipe Card（既存実装レビュー）

**現行実装**: `components/recipe-card-inline.tsx`

```
+-- Recipe Card --------------------------------+
| +------------------------------------------+ |
| |     [AI Generated Preview]               | |
| |     aspect-ratio: 4/3                    | |
| +------------------------------------------+ |
|                                              |
| [MATCH 85%]                           [heart]|
| ナチュラルグロウレシピ                        |
|                                              |
| +------------------------------------------+ |
| | [ベース] STEP 1                          | |
| | NARS シアーグロウファンデーション          | |
| +------------------------------------------+ |
| +------------------------------------------+ |
| | [アイ] STEP 2                    [代用]  | |
| | CANMAKE パーフェクトスタイリスト          | |
| +------------------------------------------+ |
|                                              |
| +------------------------------------------+ |
| | [play] 詳しく見る                [arrow] | |
| +------------------------------------------+ |
+----------------------------------------------+
```

**現行実装の評価**:

| 項目 | 評価 | コメント |
|------|------|---------|
| 視覚デザイン | o | glass-card + グラデーション CTA で洗練 |
| 情報構造 | o | Match score, Steps, Substitution が明確 |
| インタラクション | o | タップで詳細ページへ遷移、お気に入り登録 |
| レスポンシブ | o | `max-w-[85%]` でチャットバブル内に収まる |
| 改善余地 | - | Steps は 2 つまでのプレビュー。全ステップのサマリーが欲しい |

### 7.3 Product Card（新規設計）

コスメ商品の AI 鑑定結果やおすすめ商品を表示するカード。

```
+-- Product Card -----------------------------------+
|                                                   |
| +--------+  NARS                                  |
| |        |  ナチュラルラディアント                  |
| |  商品  |  ロングウェアファンデ                    |
| |  画像  |                                        |
| | (1:1)  |  ****  4.2 (1,280件)                   |
| |        |  Y6,820 (税込)                          |
| +--------+                                        |
|                                                   |
| +-----------------------------------------------+ |
| | タイプ: リキッド                                | |
| | カバー力: ミディアム                            | |
| | 仕上がり: セミマット                            | |
| | 肌タイプ: 乾燥肌〜普通肌                       | |
| +-----------------------------------------------+ |
|                                                   |
| [+ インベントリに追加]                             |
|                                                   |
+---------------------------------------------------+
```

**設計仕様**:

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `image_url` | `string` | 推奨 | 商品画像 URL (fallback: カテゴリアイコン) |
| `brand` | `string` | 必須 | ブランド名 |
| `product_name` | `string` | 必須 | 商品名 |
| `rating` | `number` | 任意 | 5段階評価 (0.0-5.0) |
| `review_count` | `number` | 任意 | 口コミ件数 |
| `price` | `number` | 任意 | 税込価格 |
| `attributes` | `Record<string, string>` | 任意 | 商品属性 (タイプ、カバー力など) |
| `category` | `string` | 必須 | カテゴリ (ファンデ、アイシャドウ等) |

**CTA デザイン**:

| CTA | アクション | 条件 |
|-----|----------|------|
| `+ インベントリに追加` | POST /api/inventory | 未登録の場合 |
| `[check] 登録済み` | なし (disabled) | 既にインベントリにある場合 |
| `詳細を見る ->` | 外部リンク or 内部ルート | 商品詳細ページがある場合 |

### 7.4 Comparison Card（新規設計）

2〜3 商品を並べて比較するカード。Gemini の Flight Card で複数フライトを横並びにする UX を応用。

```
+-- Comparison Card ----------------------------------------+
| [search] ファンデーション比較                             |
|                                                          |
| +-----------+  +-----------+                             |
| |  [画像]   |  |  [画像]   |                             |
| |   NARS    |  |   MAC     |                             |
| |  NR ロング |  | Studio Fix|                            |
| |   Y6,820  |  |  Y6,050   |                             |
| +-----------+  +-----------+                             |
|                                                          |
| +------------------------------------------------------+ |
| | 項目       | NARS        | MAC                       | |
| |------------+-------------+---------------------------| |
| | タイプ     | リキッド     | パウダー                  | |
| | カバー力   | ***         | *****                     | |
| | 崩れにくさ | ****        | *****                     | |
| | 仕上がり   | セミマット   | マット                    | |
| | 乾燥肌向き | [best]      | [ok]                      | |
| +------------------------------------------------------+ |
|                                                          |
| [bulb] 乾燥肌のxxさんには NARS がおすすめ                 |
|                                                          |
| [NARS を選ぶ]  [MAC を選ぶ]                               |
+----------------------------------------------------------+
```

**設計仕様**:

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | `string` | 必須 | 比較タイトル |
| `products` | `ProductSummary[]` | 必須 | 2-3 商品の配列 |
| `comparison_attributes` | `ComparisonRow[]` | 必須 | 比較項目と各商品の値 |
| `recommendation` | `string` | 任意 | AI のおすすめコメント |
| `recommended_index` | `number` | 任意 | おすすめ商品のインデックス |

```typescript
// 型定義案
interface ComparisonRow {
  attribute: string;        // "カバー力", "崩れにくさ" 等
  values: string[];         // 各商品の値
  highlight_index?: number; // 優位な商品のインデックス
}

interface ProductSummary {
  image_url?: string;
  brand: string;
  name: string;
  price?: number;
}
```

**レイアウトバリエーション**:

| 商品数 | レイアウト |
|--------|----------|
| 2 商品 | 2 カラム (50:50) |
| 3 商品 | 3 カラム (33:33:33) or 横スクロール |

### 7.5 Technique Card（新規設計）

メイクテクニックをステップバイステップで解説するカード。

```
+-- Technique Card ---------------------------------+
| [bulb] 三角ハイライトテクニック                    |
| 目の下のクマをカバーしつつ立体感UP                 |
|                                                   |
| +-----------------------------------------------+ |
| | Step 1/3                                      | |
| | +-------------------------------------------+ | |
| | |                                           | | |
| | |    [イラスト / 図解]                       | | |
| | |    (目の下に逆三角形を                     | | |
| | |     描くイメージ図)                        | | |
| | |                                           | | |
| | +-------------------------------------------+ | |
| |                                               | |
| | コンシーラーを目の下に逆三角形                 | |
| | に3点置きします                               | |
| |                                               | |
| | [key] ポイント:                               | |
| | 点と点の間隔は 5mm 程度                       | |
| +-----------------------------------------------+ |
|                                                   |
|       [*] [ ] [ ]  (ステップインジケーター)        |
|                                                   |
| [<- 前へ]              [次へ ->]                   |
+---------------------------------------------------+
```

**設計仕様**:

| プロパティ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `title` | `string` | 必須 | テクニック名 |
| `description` | `string` | 必須 | 概要説明 |
| `difficulty` | `'beginner' \| 'intermediate' \| 'advanced'` | 任意 | 難易度 |
| `time_required` | `string` | 任意 | 所要時間 (例: "2分") |
| `steps` | `TechniqueStep[]` | 必須 | ステップ配列 |

```typescript
// 型定義案
interface TechniqueStep {
  step_number: number;
  illustration_url?: string;  // ステップのイラスト/図解
  instruction: string;        // 手順テキスト
  key_point?: string;         // ポイント/コツ
  tool_required?: string;     // 必要なツール
}
```

**インタラクション**:
- スワイプ / <- -> ボタンでステップ間をナビゲート
- ステップインジケーター (dot navigation) で現在位置を表示
- 最後のステップに「完了」ボタン
- 必要に応じて動画リンクを埋め込み

### 7.6 カードのデータフロー

```
Agent Engine (Backend)
    |
    | SSE Event: { type: "product_card", data: {...} }
    | SSE Event: { type: "comparison_card", data: {...} }
    | SSE Event: { type: "technique_card", data: {...} }
    |
    v
use-chat.ts (Hook)
    |
    | setMessages(prev => prev.map(m =>
    |   m.id === assistantId
    |     ? { ...m, data: parsedData }
    |     : m
    | ))
    |
    v
chat-message.tsx (Component)
    |
    | switch (message.data.type) {
    |   case 'recipe':     -> <RecipeCardInline />
    |   case 'product':    -> <ProductCardInline />
    |   case 'comparison': -> <ComparisonCardInline />
    |   case 'technique':  -> <TechniqueCardInline />
    | }
    |
    v
[Card Component] -> Rendered in chat bubble
```

**SSE イベント型の拡張案**:

```typescript
// types/chat.ts への追加案
export type SSEEventType =
  | "text_delta"
  | "recipe_card"
  | "product_card"      // 新規
  | "comparison_card"   // 新規
  | "technique_card"    // 新規
  | "preview_image"
  | "progress"
  | "memory_updated"    // 新規 (P4)
  | "done"
  | "error";
```

### 7.7 カード共通デザインガイドライン

全てのリッチカードに適用する共通デザイン基準。

| 要素 | 仕様 | 根拠 |
|------|------|------|
| Container | `glass-card bg-white/70 rounded-[24px]` | 既存 Recipe Card 踏襲 |
| Border | `border border-white shadow-soft-float` | 統一感 |
| Max width | `max-w-[85%]` | チャットバブル内に収まる |
| Padding | `p-5` (20px) | 既存 Recipe Card 踏襲 |
| CTA height | `h-[48px]` | タップターゲット最小サイズ |
| CTA style | グラデーションボタン (`bg-gradient-to-r`) | 既存 Recipe Card 踏襲 |
| Animation | `framer-motion` entry (opacity + y) | 既存チャットバブルと統一 |
| Typography | `font-display` (見出し) + `font-body` (本文) | グローバルデザインシステム |
| Image fallback | カテゴリアイコン (SVG) | 画像未取得時の graceful degradation |

### 7.8 レスポンシブ対応

| 画面幅 | レイアウト |
|--------|----------|
| < 375px | 全カード 1 カラム。Comparison Card は縦スタック |
| 375-428px (iPhone) | 標準レイアウト。Comparison Card は 2 カラム |
| > 428px (iPad/Desktop) | 最大幅制限。Comparison Card は 3 カラム可 |

---

## 付録

### A. 調査対象バージョン

| アプリ | 調査時バージョン | プラン |
|--------|----------------|--------|
| Claude | claude.ai (Web) -- 2026年2月時点 | Pro |
| ChatGPT | chatgpt.com (Web) -- 2026年2月時点 | Plus |
| Gemini | gemini.google.com (Web) -- 2026年2月時点 | Advanced |

### B. alche:me 現行コンポーネント一覧

| ファイル | 役割 | 行数 |
|---------|------|------|
| `components/chat-message.tsx` | メッセージバブル + Markdown + Theme suggestions + Recipe card | ~245 |
| `components/chat-input.tsx` | 入力欄 + 画像添付 + 送信ボタン | ~93 |
| `components/thinking-indicator.tsx` | 思考中インジケーター | ~133 |
| `components/recipe-card-inline.tsx` | レシピリッチカード | ~105 |
| `components/quick-action-chips.tsx` | 会話開始チップ | ~41 |
| `components/chat-history-sidebar.tsx` | チャット履歴サイドバー | ~160 |
| `hooks/use-chat.ts` | チャットロジック + SSE + Firestore 永続化 | ~366 |
| `types/chat.ts` | 型定義 | ~52 |
| `app/(main)/chat/page.tsx` | チャットページ | ~133 |

### C. 改善ロードマップ (暫定)

```
Week 1:  P0 -- Stop + Retry/Regenerate
Week 2:  P1 -- Chat starters パーソナライズ
Week 3:  P2 -- Post-actions
Week 4-5: P3 -- Product Card + Comparison Card
Week 6:  P4 -- Memory visualization
Week 7:  P5 -- Conversation search + Pin
Week 8:  P3 (続き) -- Technique Card
```

### D. 参考文献

- Anthropic Claude UI: https://claude.ai
- OpenAI ChatGPT: https://chatgpt.com
- Google Gemini: https://gemini.google.com
- Nielsen Norman Group -- AI Chat UX Patterns (2025)
- Apple Human Interface Guidelines -- Conversations
- Material Design 3 -- Communication Components

---

> **次のアクション**: P0 (Stop ボタン + Retry/Regenerate) の詳細実装仕様を `docs/tasks/plans/` に作成し、実装に着手する。
