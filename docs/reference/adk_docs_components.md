# ADK (Agent Development Kit) Components リファレンス

> **本ドキュメントについて:** alche:me プロジェクトで使用する Google Agent Development Kit (ADK) の主要コンポーネントをまとめたリファレンスです。ADK公式ドキュメントから、各コンポーネントの概要・役割・使い方を整理しています。

---

## 目次

1. [Technical Overview（技術概要）](#1-technical-overview技術概要)
2. [Apps（ワークフロー管理）](#2-appsワークフロー管理)
3. [Context（コンテキスト）](#3-contextコンテキスト)
4. [Events（イベント）](#4-eventsイベント)
5. [Sessions & Memory（セッションとメモリ）](#5-sessions--memoryセッションとメモリ)
6. [Artifacts（アーティファクト）](#6-artifactsアーティファクト)
7. [Callbacks（コールバック）](#7-callbacksコールバック)
8. [Plugins（プラグイン）](#8-pluginsプラグイン)
9. [Grounding（グラウンディング）](#9-groundingグラウンディング)
10. [MCP（Model Context Protocol）](#10-mcpmodel-context-protocol)
11. [Bidi-Streaming / Live（双方向ストリーミング）](#11-bidi-streaming--live双方向ストリーミング)
12. [A2A Protocol（Agent-to-Agent プロトコル）](#12-a2a-protocolagent-to-agent-プロトコル)
13. [alche:me への適用メモ](#13-alcheme-への適用メモ)

---

## 1. Technical Overview（技術概要）

**対応SDK:** Python / TypeScript / Go / Java

ADK は AI エージェントの構築・管理・評価・デプロイを支援するフレームワーク。会話型・非会話型の両方のエージェントに対応し、複雑なタスクやワークフローを処理できる。

### コアプリミティブ

| プリミティブ | 説明 |
|---|---|
| **Agent** | 特定タスク用の基本作業ユニット。LLM推論を使う `LlmAgent` と、決定論的な制御を行う Workflow Agent（`SequentialAgent`, `ParallelAgent`, `LoopAgent`）がある |
| **Tool** | 外部APIとの連携、検索、コード実行など、会話を超えた能力をエージェントに付与 |
| **Callbacks** | エージェント処理の特定ポイントで実行されるカスタムコード（チェック、ログ、動作変更用） |
| **Session & State** | 単一会話のコンテキスト（Session）と、その会話中のワーキングメモリ（State）を管理 |
| **Memory** | 複数セッションにまたがるユーザー情報の記憶。短期的な Session State とは別概念 |
| **Artifact** | セッションやユーザーに紐づくファイル・バイナリデータ（画像、PDF等）の保存・読み込み・管理 |
| **Event** | セッション中に発生する通信の基本単位（ユーザーメッセージ、エージェント応答、ツール使用等） |
| **Runner** | 実行フローの管理エンジン。Event に基づくエージェント間連携とバックエンドサービスの調整を行う |
| **Planning** | 複雑な目標を小さなステップに分解して計画を立てる高度な機能（ReAct planner等） |

### 主要な機能的特徴

- **マルチエージェントシステム設計:** 複数の専門エージェントを階層的に配置し、タスク委譲やサブタスク分割が可能
- **リッチなツールエコシステム:** `FunctionTool`（カスタム関数）、`AgentTool`（エージェント間呼び出し）、組み込みコード実行、外部API連携
- **柔軟なオーケストレーション:** Workflow Agent による予測可能なパイプラインと、LLM駆動の動的ルーティングの併用
- **統合開発ツール:** CLI と Developer UI による実行・デバッグ・可視化
- **ネイティブストリーミング:** 双方向ストリーミング（テキスト・音声）のネイティブサポート
- **組み込み評価機能:** マルチターン評価データセットの作成とローカル評価の実行
- **幅広いLLMサポート:** Gemini 最適化に加え、`BaseLlm` インターフェースによる他LLMとの統合が可能

---

## 2. Apps（ワークフロー管理）

**対応SDK:** Python v1.14.0+

`App` クラスは ADK エージェントワークフロー全体のトップレベルコンテナ。ルートエージェントを起点としたエージェント群のライフサイクル、構成、状態を管理する。

### 主な役割

- **集中構成管理:** APIキーやDBクライアントなど共有リソースの一元管理
- **ライフサイクル管理:** `on_startup` / `on_shutdown` フックによる永続リソース（DB接続プール等）の管理
- **状態スコープ:** `app:*` プレフィックスによるアプリケーションレベルの状態定義
- **デプロイ単位:** バージョニング、テスト、サービング用の正式なデプロイ可能ユニット

### App で構成できる機能

- コンテキストキャッシュ
- コンテキスト圧縮
- エージェント再開（Resume）
- プラグイン

### 基本的な定義例

```python
from google.adk.agents.llm_agent import Agent
from google.adk.apps import App

root_agent = Agent(
    model='gemini-2.5-flash',
    name='greeter_agent',
    description='An agent that provides a friendly greeting.',
    instruction='Reply with Hello, World!',
)

app = App(
    name="agents",
    root_agent=root_agent,
    # plugins, context_cache_config, resumability_config なども設定可能
)
```

### Runner による実行

```python
from google.adk.runners import InMemoryRunner
from agent import app

runner = InMemoryRunner(app=app)

async def main():
    response = await runner.run_debug("Hello there!")
```

---

## 3. Context（コンテキスト）

**対応SDK:** Python v0.1.0 / TypeScript v0.2.0 / Go v0.1.0 / Java v0.1.0

エージェントとツールが操作中に利用できる情報のバンドル。最新のユーザーメッセージだけでなく、タスク遂行に必要な背景知識やリソースを提供する。

### コンテキストが必要な理由

1. **状態の維持（State）:** 会話の複数ステップ間での情報記憶（ユーザー設定、計算結果、カート内容等）
2. **データの受け渡し:** あるステップで発見・生成された情報を後続ステップで共有
3. **サービスへのアクセス:**
   - **Artifact Storage:** ファイルやデータBLOBの保存・読み込み
   - **Memory:** 過去のインタラクションや外部知識ソースからの情報検索
   - **Authentication:** ツールが外部APIに安全にアクセスするための資格情報の取得
4. **識別と追跡:** 実行中のエージェント名（`agent.name`）やリクエストサイクルの一意識別子（`invocation_id`）

### コンテキストの種類

| コンテキスト | スコープ | 主な用途 |
|---|---|---|
| **InvocationContext** | 1回のリクエスト〜レスポンスサイクル全体 | フレームワークが自動生成。開発者は直接管理しない |
| **CallbackContext** | コールバック関数内 | エージェント名、セッション状態、アーティファクト操作へのアクセス |
| **ToolContext** | ツール実行内 | 認証リクエスト、メモリ検索、アーティファクト操作 |

---

## 4. Events（イベント）

**対応SDK:** Python v0.1.0 / TypeScript v0.2.0 / Go v0.1.0 / Java v0.1.0

ADK 内の情報フローの基本単位。エージェントのインタラクションライフサイクル中に発生するすべての重要な出来事を表す。

### Event が持つ情報

- **content:** ユーザーメッセージやエージェント応答の本文（`types.Content`）
- **author:** イベントの発行者（`'user'` またはエージェント名）
- **invocation_id:** インタラクション全体の実行ID
- **id:** この特定イベントの一意ID
- **timestamp:** 作成時刻
- **actions:** 副作用と制御のための `EventActions` ペイロード
- **branch:** 階層パス（マルチエージェント時のルーティング情報）

### EventActions の役割

- **状態変更（`state_delta`）:** セッション状態の更新
- **アーティファクト変更:** ファイルの保存・削除
- **エージェント転送（`transfer_to_agent`）:** 別のエージェントへの処理委譲
- **エスカレーション:** 上位エージェントへの問題報告

### Event の種類

| 種類 | 説明 |
|---|---|
| ユーザー入力 | `author='user'` のテキスト/マルチモーダル入力 |
| エージェント応答 | エージェントからの最終テキスト応答 |
| ツール呼び出し（Function Call） | LLMがツール実行を要求 |
| ツール結果（Function Response） | ツール実行の結果 |
| 状態変更 | `actions.state_delta` によるセッション状態更新 |
| 制御信号 | エージェント転送、エスカレーション等 |

---

## 5. Sessions & Memory（セッションとメモリ）

**対応SDK:** Python / TypeScript / Go / Java

### 3つのコアコンセプト

#### Session（現在の会話スレッド）

ユーザーとエージェント間の単一の進行中インタラクションを表す。

- **識別:** `id`（セッション固有ID）、`app_name`（アプリ名）、`user_id`（ユーザーID）
- **履歴:** `events`（時系列の全インタラクション記録）
- **状態:** `state`（この会話固有の一時データ）
- **更新追跡:** `last_update_time`

```python
from google.adk.sessions import InMemorySessionService

session_service = InMemorySessionService()
session = await session_service.create_session(
    app_name="my_app",
    user_id="example_user",
    state={"initial_key": "initial_value"}
)
```

#### State（セッション内データ）

特定の Session 内に保存されるデータ。現在アクティブな会話スレッドにのみ関連する情報を管理する。

**State のプレフィックス規則:**

| プレフィックス | スコープ | 説明 |
|---|---|---|
| `app:` | アプリケーション全体 | 全セッション・全ユーザーで共有 |
| `user:` | ユーザー単位 | 同一ユーザーの全セッションで共有 |
| （なし） | セッション単位 | 現在のセッションのみ |
| `temp:` | 一時的 | 現在の呼び出し内のみ有効 |

#### Memory（クロスセッション情報）

複数の過去セッションや外部データソースにまたがる情報ストア。エージェントが即座の会話を超えた情報を検索できるナレッジベース。

### サービス実装

| サービス | インメモリ（テスト用） | 永続化（本番用） |
|---|---|---|
| **SessionService** | `InMemorySessionService` | `DatabaseSessionService`, `VertexAiSessionService` 等 |
| **MemoryService** | `InMemoryMemoryService` | `VertexAiRagMemoryService` 等 |

> **注意:** インメモリ実装はローカルテストと高速開発用。アプリ再起動でデータは消失する。

---

## 6. Artifacts（アーティファクト）

**対応SDK:** Python v0.1.0 / TypeScript v0.2.0 / Go v0.1.0 / Java v0.1.0

名前付き・バージョン管理されたバイナリデータを管理する仕組み。セッション単位またはユーザー単位で永続化できる。

### なぜ Artifacts が必要か

- **非テキストデータの処理:** 画像、音声、動画、PDF、スプレッドシート等
- **大規模データの永続化:** Session State に向かない大容量データ用
- **ユーザーファイル管理:** ファイルのアップロード・ダウンロード
- **出力の共有:** ツールやエージェントが生成したバイナリ出力の保存・再利用
- **バイナリデータのキャッシュ:** 高コスト処理結果の再生成回避

### データ表現

Artifacts は `google.genai.types.Part` オブジェクトとして表現される。

```python
import google.genai.types as types

image_artifact = types.Part(
    inline_data=types.Blob(
        mime_type="image/png",
        data=image_bytes
    )
)
```

### Artifact Service 実装

| 実装 | ストレージ | 用途 |
|---|---|---|
| `InMemoryArtifactService` | メモリ | テスト・一時保存 |
| `GcsArtifactService` | Google Cloud Storage | 本番環境・永続保存 |

### 操作メソッド

- **`save_artifact(filename, part)`** — アーティファクトの保存（同名は新バージョン作成）
- **`load_artifact(filename, version?)`** — アーティファクトの読み込み（バージョン指定可能）
- **`list_artifacts()`** — アーティファクト一覧の取得

### ネーミング規則

- `"user:"` プレフィックス: ユーザー単位（全セッションで共有）
- プレフィックスなし: セッション単位

---

## 7. Callbacks（コールバック）

**対応SDK:** Python v0.1.0 / TypeScript v0.2.0 / Go v0.1.0 / Java v0.1.0

エージェントの実行プロセスに介入するためのフック機能。コアフレームワークを変更せずに、特定のポイントで動作を観察・カスタマイズ・制御できる。

### コールバックの種類

| コールバック | タイミング | 用途 |
|---|---|---|
| **Before Agent** | エージェントがリクエスト処理を開始する直前 | 前処理、バリデーション |
| **After Agent** | エージェントが全ステップを完了し結果を返す直前 | 後処理、ログ |
| **Before Model** | LLM にリクエストを送信する直前 | プロンプト修正、キャッシュチェック |
| **After Model** | LLM からレスポンスを受信した直後 | 出力フィルタリング、検証 |
| **Before Tool** | ツール実行の直前 | 権限チェック、入力バリデーション |
| **After Tool** | ツール実行完了の直後 | 結果加工、ログ |

### 使用例

```python
from google.adk.agents import LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest
from typing import Optional

def my_before_model_logic(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    print(f"Agent: {callback_context.agent_name}")
    return None  # None を返すとモデル呼び出しが続行される

my_agent = LlmAgent(
    name="MyCallbackAgent",
    model="gemini-2.0-flash",
    instruction="Be helpful.",
    before_model_callback=my_before_model_logic
)
```

### コールバックの主な用途

- **観察・デバッグ:** 詳細ログの記録
- **カスタマイズ・制御:** データフローの変更、特定ステップのバイパス
- **ガードレール実装:** 安全ルールの適用、入出力バリデーション
- **状態管理:** セッション状態の動的更新
- **統合・拡張:** 外部API呼び出し、通知トリガー、キャッシュ機能の追加

> **ヒント:** セキュリティガードレールの実装には、Callbacks よりも Plugins の使用が推奨される。

---

## 8. Plugins（プラグイン）

**対応SDK:** Python v1.7.0+

エージェントワークフローのライフサイクルの各段階で実行されるカスタムコードモジュール。ワークフロー全体に横断的に適用される機能に使用する。

### Callbacks との違い

| 特徴 | Callbacks | Plugins |
|---|---|---|
| 適用範囲 | 単一エージェント・単一ツール | Runner 全体（グローバル） |
| 登録方法 | 各エージェントに個別設定 | Runner に一度登録 |
| 用途 | 特定タスク固有のロジック | 横断的な共通機能 |

### 典型的な用途

- **ロギング・トレーシング:** エージェント、ツール、LLM活動の詳細ログ
- **ポリシー適用:** セキュリティガードレール、権限チェック
- **モニタリング・メトリクス:** トークン使用量、実行時間、呼び出し回数の収集
- **レスポンスキャッシュ:** 重複リクエストのキャッシュ応答
- **リクエスト/レスポンス変更:** プロンプトへの動的情報追加、出力の標準化

### プリビルトプラグイン

- **Reflect and Retry Tools:** ツール失敗の追跡とインテリジェントなリトライ
- **BigQuery Analytics:** BigQuery によるエージェントログと分析
- **Context Filter:** コンテキストサイズの削減フィルタ
- **Global Instruction:** App レベルのグローバル指示
- **Save Files as Artifacts:** ユーザーメッセージ内ファイルの自動アーティファクト保存
- **Logging:** 各コールバックポイントでの情報ログ

### Plugin の定義例

```python
from google.adk.plugins.base_plugin import BasePlugin
from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest

class CountInvocationPlugin(BasePlugin):
    def __init__(self) -> None:
        super().__init__(name="count_invocation")
        self.agent_count = 0

    async def before_agent_callback(self, *, agent, callback_context):
        self.agent_count += 1
        print(f"[Plugin] Agent run count: {self.agent_count}")
```

### Plugin の登録

```python
app = App(
    name="my_app",
    root_agent=root_agent,
    plugins=[CountInvocationPlugin()]
)
```

---

## 9. Grounding（グラウンディング）

**対応SDK:** Python v0.1.0 / TypeScript v0.2.0（一部機能）

AI エージェントを外部情報ソースに接続し、より正確で最新かつ検証可能な応答を生成するためのプロセス。ハルシネーションを減らし、信頼性の高いソースに基づく回答を提供する。

### グラウンディングの種類

#### Google Search Grounding
リアルタイムのWeb情報に接続。ニュース、天気、最新の事実など、モデルの学習データのカットオフ以降に変化した可能性のある情報に有効。

#### Vertex AI Search Grounding
組織のプライベートドキュメントやエンタープライズデータに接続。独自の情報に基づく回答が必要な場合に使用。

#### Agentic RAG（検索拡張生成）
エージェントが検索方法を推論し、クエリやフィルタを動的に構築する。Vector Search 2.0、Vertex AI RAG Engine 等の検索システムと統合。

### 関連リソース

- [Deep Search Agent](https://github.com/google/adk-samples/tree/main/python/agents/deep-search) — 包括的レポート生成の研究エージェント
- [RAG Agent](https://github.com/google/adk-samples/tree/main/python/agents/RAG) — Vertex AI RAG Engine によるドキュメント Q&A
- [Vector Search 2.0 Travel Agent](https://github.com/google/adk-samples/blob/main/python/notebooks/grounding/vectorsearch2_travel_agent.ipynb) — Agentic RAG のハンズオンノートブック

---

## 10. MCP（Model Context Protocol）

**対応SDK:** Python / TypeScript / Go / Java

LLM が外部アプリケーション、データソース、ツールと通信する方法を標準化するオープンスタンダード。クライアント-サーバーアーキテクチャに従い、リソース（データ）、プロンプト（テンプレート）、ツール（実行可能関数）を定義する。

### ADK と MCP の連携

- **既存 MCP サーバーの利用:** ADK エージェントが MCP クライアントとして動作し、外部 MCP サーバーのツールを使用
- **ADK ツールの MCP 公開:** ADK ツールをラップする MCP サーバーを構築し、任意の MCP クライアントからアクセス可能にする

### FastMCP

ADK は [FastMCP](https://github.com/jlowin/fastmcp) を使用して MCP プロトコルの詳細とサーバー管理を処理。ほとんどの場合、関数にデコレータを付けるだけでツールを作成できる。

### MCP Servers for Google Cloud Genmedia

Google Cloud のジェネレーティブメディアサービス（Imagen, Veo, Chirp 3 HD, Lyria）をAIアプリケーションに統合するオープンソース MCP サーバー群。

---

## 11. Bidi-Streaming / Live（双方向ストリーミング）

**対応SDK:** Python v0.5.0+（Experimental）

[Gemini Live API](https://ai.google.dev/gemini-api/docs/live) の低遅延双方向音声・動画インタラクション機能を ADK エージェントに追加する。

### 主な機能

- **自然な音声会話:** 人間のような音声対話体験
- **割り込み対応:** ユーザーが音声コマンドでエージェントの応答を中断可能
- **マルチモーダル入力:** テキスト、音声、動画の入力処理
- **テキスト・音声出力:** テキストと音声の両方での応答

### 開発ガイドシリーズ

1. **Part 1:** Bidi-streaming の基礎、Live API、ADK アーキテクチャ、FastAPI 連携
2. **Part 2:** `LiveRequestQueue` によるメッセージ送信、テキスト/音声/動画の送信
3. **Part 3:** `run_live()` によるイベント処理、ツール自動実行、マルチエージェント
4. **Part 4:** `RunConfig`、レスポンスモダリティ、セッション管理、コンテキスト圧縮
5. **Part 5:** 音声仕様、音声文字起こし、音声活動検出、プロアクティブダイアログ

### Streaming Tools

ツールが中間結果をエージェントにストリーミングし、エージェントがリアルタイムで反応する機能。株価モニタリングやビデオストリーム監視などに活用可能。

---

## 12. A2A Protocol（Agent-to-Agent プロトコル）

**対応SDK:** Python / Go（Experimental）

異なるエージェント間でネットワーク越しに通信するための標準プロトコル [Agent2Agent (A2A)](https://a2a-protocol.org/)。

### ローカル Sub-Agent vs リモート Agent (A2A)

| 特性 | ローカル Sub-Agent | リモート Agent (A2A) |
|---|---|---|
| 実行環境 | 同一プロセス内 | 別サービスとしてネットワーク越し |
| 通信速度 | 高速（メモリ内） | ネットワークオーバーヘッドあり |
| 使い分け | 内部コード整理、高頻度処理 | 別チーム管理、異言語間連携、強い契約が必要な場合 |

### A2A を使うべきケース

- サードパーティサービスとの統合（外部の金融データプロバイダ等）
- マイクロサービスアーキテクチャ（注文処理、在庫管理、配送エージェントの連携）
- クロス言語通信（Python エージェントと Java レガシーシステムの連携）
- 厳格なAPI契約が必要なプラットフォーム

### A2A ワークフロー

1. **Exposing（公開）:** 既存の ADK エージェントを `A2AServer` として公開し、ネットワーク経由でアクセス可能にする
2. **Consuming（消費）:** `RemoteA2aAgent` を使用してリモートエージェントと通信。ネットワーク通信、認証、データフォーマットを自動処理

```python
# リモートエージェントの消費例
from google.adk.agents import RemoteA2aAgent

prime_agent = RemoteA2aAgent(
    name="prime_agent",
    description="Agent that handles checking if numbers are prime.",
    agent_card_source="http://localhost:8001"
)
```

---

## 13. alche:me への適用メモ

以下は、alche:me の16エージェント構成に対する ADK コンポーネントの適用方針メモ。

### エージェントアーキテクチャ

- **Root Agent（Concierge Bot）** を `LlmAgent` として定義し、`App` クラスでラップ
- 各フェーズのエージェントは **ローカル Sub-Agent** として実装（同一プロセス内で高速通信）
- 将来的にマイクロサービス分離が必要な場合は **A2A Protocol** で段階的に移行可能

### Session & State 活用

- **Session State:** 現在のメイクセッション（モーニングクエスト）のコンテキスト保持
- **State プレフィックス `user:`:** パーソナルカラー、肌質、好み等のユーザー永続データ
- **Memory Service:** 過去のメイク履歴（Beauty Log）からのパターン学習・検索

### Artifacts 活用

- コスメ画像の保存・バージョン管理（`InMemoryArtifactService` → 本番は `GcsArtifactService`）
- シミュレーション合成画像の保存
- レシピカードのバイナリデータ管理

### Callbacks & Plugins 活用

- **Callbacks:** Cosmetic Alchemist の錬金レシピ生成前後でのバリデーション
- **Plugins:** 全エージェント共通のログ、使用量追跡、安全性チェック

### Grounding 活用

- **Google Search Grounding:** Trend Hunter エージェントのSNSトレンド取得
- **Vertex AI Search:** コスメ成分データベース、製品情報の検索
- **Agentic RAG:** ユーザーの在庫データに基づく類似コスメ検索

### Bidi-Streaming（将来検討）

- 鏡の前での音声対話インターフェース（「鏡よ鏡、今日の私に合うメイクは？」）
- カメラ入力によるリアルタイム肌状態分析

---

## 参考リンク

- [ADK 公式ドキュメント](https://google.github.io/adk-docs/)
- [ADK GitHub リポジトリ](https://github.com/google/adk-python)
- [ADK サンプル集](https://github.com/google/adk-samples)
- [A2A Protocol 公式サイト](https://a2a-protocol.org/)
- [MCP 公式サイト](https://modelcontextprotocol.io/introduction)
- [Gemini Live API ドキュメント](https://ai.google.dev/gemini-api/docs/live)
