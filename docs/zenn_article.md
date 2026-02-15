# **はじめに：コスメティック・パラドックス**

「コスメはたくさん持っているのに、毎朝のメイクが決まらない」

「SNSで見た可愛いメイクを真似したいけど、同じアイテムを持っていない」

私はこの現象を **「コスメティック・パラドックス（Cosmetic Paradox）」** と名付けました。資産としての化粧品在庫は豊富にあるのに、日々の活用率が低く、選択肢の多さが逆に「意思決定疲れ」と「死蔵在庫への罪悪感」を引き起こしている状態です。

今回開発した **「alche:me（アルケミー）」** は、そんな「眠ったままのコスメ（Dead Stock）」から無限の可能性を調合する、あなた専属の自律型AIエージェントチームです。

## **alche:meがもたらす変化**

| 項目 | 導入前（マンネリ） | 導入後（alche:me利用） |
| :---- | :---- | :---- |
| **朝の選択** | 5分迷って「無難」を選ぶ | **1分**でAI提案から選ぶ自信と余裕 |
| **眠ったコスメ** | 罪悪感の象徴 | **「新しい顔」の素材**というワクワク感 |
| **購買行動** | 似た色を重複買い | 在庫との相性分析で**戦略的買い足し** |
| **メイクの記録** | 「今日何塗ったっけ？」 | **Beauty Log**で日々の実績を蓄積 |
| **ユーザー心理** | 「買わなきゃ変われない」 | 「持っているもので、もっと輝ける」 |

---

# **1\. プロジェクト概要**

## **ターゲットユーザーと課題 (The Pain)**

20-40代の働く女性。「コスメ迷子」に陥り、新作や限定品を買っては使いこなせず、ドレッサーの奥で化粧品を劣化させてしまっています。

## **ソリューション：Agentic AIによる解決 (The Solution)**

alche:meは、単なる在庫管理アプリではありません。Google Cloudの **Agent Development Kit (ADK)** で構築された **10人の専門AIエージェント** が自律的に協調し、目標（なりたい顔）に向けて自ら計画・実行・修正を行う **フルスタックPWAアプリケーション** です。

* **資産化:** スマホで撮るだけで、AIがアイテムを鑑定・登録。楽天APIで商品情報を自動補完。
* **調合 (Alchemy):** 「手持ち在庫だけ」で、憧れのルックを再現する組み合わせ（レシピ）を生成。ハルシネーション率0%。
* **可視化:** **Gemini 2.5 Flash (Image Generation)** が「そのメイクをした時の仕上がりイメージ」をAIキャラクターで生成。直感的に選べます。
* **記録:** Beauty Logで日々のメイクを記録。好みの傾向分析やマンネリ検知にも活用。
* **共有:** SNS機能でレシピを公開。フォロー・いいね・コメントで美容コミュニティを形成。
* **循環:** 購入検討品の在庫相性チェック。重複リスクとギャップ分析で賢い買い物をサポート。

### **実装規模**

| 項目 | 数値 |
| :---- | :---- |
| AIエージェント | 10体（Concierge + 8専門エージェント + Simulator） |
| APIエンドポイント | 25+ |
| 自動テスト | 160+（Python 100 + Frontend 61 + E2E 5） |
| UIコンポーネント | 30+ |
| フロントエンド画面 | 15ページ（6タブ + 設定5サブページ + 認証系） |

### **💡 「買わない」のその先へ**

alche:meのゴールは節約ではありません。手持ちコスメで美しくなれる体験を通じて「美への欲求」に火をつけ、結果として **「本当に必要なものの賢い消費」** へと導くプラットフォームです。

---

# **2\. デモ動画**

百聞は一見にしかず。実際に alche:me が動作し、エージェントたちが思考・連携する様子をご覧ください。

@[youtube](https://www.google.com/search?q=%E3%81%93%E3%81%93%E3%81%ABYouTube%E5%8B%95%E7%94%BBID%E3%82%92%E5%85%A5%E3%82%8C%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84)

---

# **3\. システムアーキテクチャと「制御フロー」**

alche:meは、フロントエンドに **Next.js 16 (Cloud Run)**、バックエンドの頭脳部分に **Python ADK + FastAPI (Cloud Run)** を採用したBFF (Backend for Frontend) 構成です。

ここでは、システム全体の「インフラ構成」と、その内部で動くエージェントたちの「指揮命令系統」を分けて解説します。

## **3-1. インフラストラクチャ全体像 (Infrastructure View)**

ユーザーのリクエストはBFFを経由してセキュアにAgent Serverへ渡され、Firestoreと連携します。

![図1: Google Cloudを活用したBFFアーキテクチャ](https://storage.googleapis.com/zenn-user-upload/69cb34a33870-20260215.png)

- **Frontend**: Next.js 16 (React 19) 製のPWA。Cloud Run上で動作。Service Workerによるオフラインキャッシュ対応。
- **BFF**: Next.js API Routesが認証（Firebase Auth Token検証）を行い、Agent Serverへのゲートウェイとして機能。SSEストリーミングをプロキシ。
- **Agent Server**: **FastAPI + Google ADK** をCloud Runにデプロイ。ADKの `Runner` クラスがエージェントの実行・イベントストリーミング・ツール呼び出しを管理。
- **永続化**: `DatabaseSessionService`（SQLAlchemy）でセッション永続化。`InMemoryMemoryService`でクロスセッション記憶。
- **データ**: Cloud Firestore（ユーザー・在庫・レシピ・Beauty Log・SNS）+ Cloud Storage（プレビュー画像）。

## **3-2. エージェント・オーケストレーション (Agentic View)**

次に、このシステムの核心である「AIエージェントの自律動作」の可視化です。
**Root Agent (Concierge)** が指揮官となり、ユーザーの意図を判定して8人の専門エージェントに動的にルーティングする **「指揮命令系統（Control Flow）」** を構築しました。

![図2: Conciergeを頂点とした自律的な指揮命令系統](https://storage.googleapis.com/zenn-user-upload/7ba635aed0da-20260215.png)

### **エージェント一覧（10体）**

```
Concierge (Root Agent / gemini-2.5-flash)
├── Inventory Manager     — コスメ画像認識・在庫管理
├── Product Search        — Google検索 + 楽天APIで商品補完
├── Cosmetic Alchemist    — 手持ち在庫のみでレシピ生成
├── Memory Keeper         — Beauty Log の記録・取得
├── Trend Hunter          — SNS/美容メディアのトレンド分析
├── TPO Tactician         — 天気・予定ベースのメイク提案
├── Profiler              — 嗜好傾向分析・マンネリ検知
├── Makeup Instructor     — 代用テクニック・手順指導
└── Simulator (stub)      — プレビュー画像生成（サーバーサイド後処理）
```

- **意図判定**: Conciergeがシステムプロンプトに定義された9つのルーティングルールでユーザーの意図を分類
- **おまかせテーマ提案**: 「今日のメイクは？」のような曖昧なリクエストには、Conciergeが手持ち在庫を確認して3つのテーマ案を提示。選択後にAlchemistへ委譲
- **ショッピング相談**: 購入検討品の相性チェックはConciergeが直接ツールを使って分析

## **開発プロセスの革新：Claude Codeの活用**

本プロジェクトの開発において、Phase 1のMVP構築からPhase 2/3の10バッチ実装まで、**Claude Code (Opus 4.6)** をフル活用しました。

AIによるコーディング支援を受けることで、人間はボイラープレートの作成から解放され、**エージェントのプロンプト設計やプロダクトの思想（Philosophy）の注入** に全リソースを集中させることができました。これはまさに、人間とAIが協調する次世代の開発体験でした。

---

# **4\. Deep Dive：Agenticな実装の裏側**

単なるAPIラッパーではなく、**「自律的に考え、判断し、修正するエージェント」** を実装しました。その技術的なハイライトを紹介します。

## **① 自律ルーティング：Conciergeのインテント判定**

Conciergeは単なるプロキシではなく、**ユーザーの曖昧な意図を解釈し、最適なエージェントを選択する自律的なルーター**です。

例えば「今日のメイクを提案して」という曖昧なリクエストを受けた場合、即座にAlchemistに委譲せず、まず在庫を確認して3つのテーマ案を提示します:

```
今日のあなたにぴったりなメイクを考えてみました！
どのテーマが気になりますか？✨

1️⃣ **ナチュラル透明感メイク** — 素肌感を活かした軽やかな仕上がり
   眠っていたベージュ系シャドウを活用！

2️⃣ **大人キレイめメイク** — オフィスでも映えるきちんと感
   最近使っていないマットリップの出番です

3️⃣ **韓国アイドル風グロウメイク** — ツヤ肌とキラキラアイが主役
   グリッターシャドウとハイライトの組み合わせで
```

このとき、`get_inventory_summary` と `get_today_context` ツールで **在庫の偏り・季節・30日以上使っていないアイテム** を事前に取得し、提案に反映しています。

### **\[Case: 雨の日のデートメイク\]**

天気やTPOに言及するリクエストは `tpo_tactician_agent` に委譲されます:

* **TPO Tactician**: OpenWeatherMap APIで天気を取得 → 「湿度80%の雨。ウォータープルーフ推奨、マット仕上げで崩れ防止」
* **Concierge**: TPOの分析結果をコンテキストとして `alchemist_agent` にレシピ作成を指示

複数エージェントの知見を **Conciergeが統合** することで、単純な検索では不可能な「文脈のすり合わせ」を実現しています。

## **② Hallucination完全防止：在庫制約エンジン**

「手持ちの在庫にないアイテムをレシピに含めてしまう」—— これはメイクレシピ生成AIにとって致命的な問題です。alche:meではこの **ハルシネーションを0%** に抑えています。

### **3層の防止メカニズム**

**Layer 1: プロンプト制約**
Alchemistのシステムプロンプトに「在庫に存在するアイテムのみ使用可能」を厳格に定義。

**Layer 2: validate_recipe_items ツール**
レシピ生成後、Alchemistが自ら呼び出すバリデーションツール:

```python
def validate_recipe_items(item_ids_json: str, tool_context: ToolContext) -> dict:
    """レシピ内の全アイテムIDがFirestoreの在庫に存在するかを検証"""
    user_id = _resolve_user_id(tool_context)
    item_ids = json.loads(item_ids_json)
    ref = _inventory_ref(user_id)
    missing = []
    for item_id in item_ids:
        doc = ref.document(item_id).get()
        if not doc.exists:
            missing.append(item_id)
    return {
        "status": "success",
        "all_valid": len(missing) == 0,
        "missing_items": missing,
    }
```

**Layer 3: テストによる品質ゲート**
`test_hallucination.py` で在庫外アイテムの混入を自動検証。CI/CDパイプラインで毎回実行し、**Hallucination Rate = 0% を品質ゲート（QG-1）** として設定しています。

## **③ SSEストリーミング：リアルタイム思考可視化**

エージェントの思考過程をユーザーにリアルタイムで見せることで、45-60秒の待ち時間を「ワクワクする体験」に変えました。

### **5種のSSEイベント**

```
POST /api/chat → BFF (Next.js) → POST /chat (FastAPI) → ADK Runner
                                                            ↓
                                              SSEイベントストリーム
                                              ├── progress:       「メイクレシピを作成中...」
                                              ├── text_delta:     テキスト逐次配信
                                              ├── recipe_card:    レシピJSON
                                              ├── preview_image:  プレビュー画像URL
                                              └── done:           完了シグナル
```

### **ツール/エージェント進捗メッセージ**

ADKのイベントからツール呼び出しやエージェント転送を検出し、日本語の進捗メッセージに変換しています:

```python
_TOOL_PROGRESS_MAP = {
    "get_inventory_summary": "手持ちコスメを確認中...",
    "validate_recipe_items": "レシピのアイテムを検証中...",
    "save_recipe":           "メイクレシピを保存中...",
    "get_weather":           "天気情報を取得中...",
    "analyze_preference_history": "好みの傾向を分析中...",
    # ... 18ツール分
}
_AGENT_PROGRESS_MAP = {
    "alchemist_agent":     "メイクレシピを作成中...",
    "trend_hunter_agent":  "トレンドを分析中...",
    "profiler_agent":      "好み傾向を分析中...",
    # ... 8エージェント分
}
```

フロントエンド（React）では、`EventSource` でSSEを受信し、`text_delta` イベントでテキストを逐次レンダリング。`recipe_card` イベントではインタラクティブなレシピカードを動的に表示します。

## **④ Memory & Session：自己修復する対話基盤**

長時間の会話でもエージェントが正しく動作し続ける仕組みを実装しました。

### **永続セッション**

ADKの `DatabaseSessionService`（SQLAlchemy + aiosqlite）で会話履歴をDB永続化。サーバー再起動後も会話が途切れません。

```python
session_service = DatabaseSessionService(db_url="sqlite+aiosqlite:///sessions.db")
memory_service = InMemoryMemoryService()
runner = Runner(
    agent=root_agent,
    app_name="alcheme",
    session_service=session_service,
    memory_service=memory_service,
)
```

### **セッションオーバーフロー自動回復**

セッションが20イベントを超えると、ADKの `InMemoryMemoryService` で重要な記憶（ユーザーの好み・過去のレシピ傾向）を自動抽出。その後セッションをリセットし、新しいセッションで記憶を活用します。

トークン制限エラーが発生した場合も同様に自動リセット＆リトライ。ユーザーに意識させることなく、対話を継続します。

---

# **5\. 実装の全体像：6つの体験タブ**

alche:meのフロントエンドはモバイルファーストのPWAとして設計されています。グラスモーフィズムのボトムナビゲーションに6つのタブを配置し、それぞれ独立した機能を提供します。

| タブ | アイコン | 機能概要 |
| :---- | :---- | :---- |
| **Concierge** | ✨ | AIチャット。SSEストリーミング対話、レシピカード表示、プレビュー画像生成 |
| **Feed** | 📰 | SNSフィード。レシピ公開・フォロー・いいね・コメント。無限スクロール |
| **Scan** | 📷 | コスメスキャン。マルチ画像(最大4枚)対応、鑑定演出、楽天API候補表示 |
| **Vanity** | 📦 | 在庫一覧。カテゴリフィルタ・検索。アイテム詳細にスペック・残量・PAO表示 |
| **Recipe** | 📖 | レシピ一覧。AI生成レシピの管理、公開/非公開切り替え、ワンタップ評価 |
| **Log** | 📅 | Beauty Log。カレンダービューで日々のメイク記録。気分・天気・評価 |

### **プレビュー画像生成 (Simulator)**

レシピ生成後、サーバーサイドで **Gemini 2.5 Flash (Image Generation)** のネイティブ画像生成機能を使い、AIキャラクターにメイクを施したプレビュー画像を自動生成。非同期処理し、`preview_image` SSEイベントで配信します。ユーザーの顔写真は一切使用せず、プライバシーを保護しています。

### **SNS機能**

Cookpad/WEARに着想を得た、レシピ共有型のSNS機能を実装:
- **カーソルベースページネーション**: Firestore `startAfter` による無限スクロール
- **フォロー/いいね**: Firestoreトランザクションでカウンター整合性を保証
- **コメント + クイックリアクション**: 「素敵！」「真似したい！」「参考になる！」の3種
- **ユーザープロフィール**: フォロワー数・投稿数・公開プロフィール

---

# **6\. テストと品質保証**

## **テストピラミッド**

| 層 | ツール | テスト数 | 対象 |
| :---- | :---- | :---- | :---- |
| **Python Unit** | pytest | 100+ | ツール関数、プロンプト品質、スキーマ検証 |
| **Frontend** | Vitest | 61+ | API Route、コンポーネント、Hook、セキュリティ |
| **E2E** | Playwright | 5 | 認証→スキャン→レシピ生成→在庫→詳細 |

## **CI/CDパイプライン**

GitHub Actionsで2つのジョブを並列実行:

```yaml
jobs:
  frontend:   # TypeScript型チェック + Vitest
  agent:      # Python pytest（100+テスト）
```

## **品質ゲート**

| ゲート | 基準 | 現状 |
| :---- | :---- | :---- |
| **QG-1: Hallucination Rate** | 0%（在庫外アイテム混入なし） | ✅ 0% |
| **QG-7: Unit Tests** | 全テスト通過 | ✅ 160+ pass |
| **QG-9: E2E** | 主要フロー通過 | ✅ 5 specs pass |

---

# **7\. 今後の展望**

alche:meは、テクノロジーで「持っているもの」の価値を再定義する試みです。現在10体のエージェントで動作していますが、さらなる拡張を計画しています。

### **Batch 9: Phase 3 エージェント追加 → 14体**

| エージェント | 役割 |
| :---- | :---- |
| **Content Curator** | 手持ちアイテムを使うYouTube動画・レシピの逆引き |
| **Health Monitor** | Google Fit / Apple HealthKit 連携で体調ベースの提案 |
| **Event Strategist** | カレンダーイベントから逆算する美容ToDoリスト |
| **Product Scout** | 楽天/Amazon リアルタイム在庫検索 |

### **Batch 10: B2B基盤 + コミュニティ拡張**

* **BigQueryデータ分析基盤**: 「どのコスメが何と組み合わせて使われているか」のB2Bインサイト
* **レシピツリー可視化**: オリジナル → アレンジの連鎖を可視化
* **つくれぽ（アレンジ投稿）**: 他ユーザーのレシピを自分の在庫でアレンジ
* **タグコミュニティ**: #イエベ春 #プチプラ のタグベースコミュニティ

### **技術的な進化**

* **VertexAI RAG Memory**: InMemoryMemoryService → 永続RAGベース記憶への移行
* **BigQuery ML K-means**: Profilerの嗜好クラスタリング強化
* **Google Calendar API統合**: TPO Tacticianの予定取得を自動化

---

# **さいごに**

プロトタイプから始まったalche:meは、10体のAIエージェント、25以上のAPIエンドポイント、160以上の自動テスト、6つの体験タブを持つフルスタックPWAアプリケーションへと成長しました。

GeminiとADKの組み合わせが、従来の「チャットボット」を超えた **「自律的に考え、連携し、学習するパートナー」** を作り出せることを確信しています。

「持っているもので、もっと輝ける」—— この体験を、一人でも多くの「コスメ迷子」に届けたいと思います。

ここまで記事を読んでいただき、ありがとうございました！
