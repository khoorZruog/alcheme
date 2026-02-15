# Google Agent Development Kit (ADK) — Build Agents リファレンス

> **alche:me プロジェクト用 ADK ドキュメント統合版**
> ソース: ADK 公式ドキュメント（Build Agents セクション）
> 対象: Python / TypeScript SDK
> 最終更新: 2025年

---

## 目次

1. [ADK 概要](#1-adk-概要)
2. [クイックスタート](#2-クイックスタート)
3. [エージェントの種類](#3-エージェントの種類)
4. [LLM Agent 詳細](#4-llm-agent-詳細)
5. [Workflow Agents（ワークフローエージェント）](#5-workflow-agents)
6. [Custom Agents（カスタムエージェント）](#6-custom-agents)
7. [マルチエージェントシステム](#7-マルチエージェントシステム)
8. [ツール（Tools）](#8-ツール)
9. [カスタムツール](#9-カスタムツール)
10. [MCP（Model Context Protocol）連携](#10-mcp-連携)
11. [モデルと認証](#11-モデルと認証)
12. [チュートリアル：エージェントチーム構築](#12-チュートリアル)
13. [ツール・インテグレーション一覧](#13-ツールインテグレーション一覧)
14. [開発ツール連携（llms.txt）](#14-開発ツール連携)

---

## 1. ADK 概要

Agent Development Kit（ADK）は、AIエージェントを迅速に構築・管理・評価・デプロイするためのフレームワーク。

### 主な特徴

- **マルチ言語対応**: Python, TypeScript, Go, Java
- **エージェント階層構造**: 親子関係によるマルチエージェント構成
- **柔軟なツール連携**: Function Tools, MCP, Built-in Tools
- **複数モデル対応**: Gemini, Claude, OpenAI, Ollama 等
- **開発UI**: `adk web` による対話型デバッグインターフェース

### 対応 SDK

| 言語 | パッケージ | インストール |
|------|-----------|-------------|
| Python | `google-adk` | `pip install google-adk` |
| TypeScript | `@google/adk` | `npm install @google/adk` |
| Go | `google.golang.org/adk` | `go get google.golang.org/adk` |
| Java | `com.google.adk:google-adk` | Maven/Gradle |

---

## 2. クイックスタート

### Python セットアップ

```bash
# 仮想環境の作成と有効化
python -m venv .venv
source .venv/bin/activate  # macOS/Linux

# ADK インストール
pip install google-adk

# プロジェクト作成
adk create my_agent
```

#### プロジェクト構造

```
my_agent/
    agent.py      # メインエージェントコード
    .env          # API キーやプロジェクト ID
    __init__.py
```

#### 基本的な agent.py

```python
from google.adk.agents.llm_agent import Agent

# ツール定義
def get_current_time(city: str) -> dict:
    """Returns the current time in a specified city."""
    return {"status": "success", "city": city, "time": "10:30 AM"}

# エージェント定義（root_agent は必須の変数名）
root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description="Tells the current time in a specified city.",
    instruction="You are a helpful assistant. Use the 'get_current_time' tool.",
    tools=[get_current_time],
)
```

#### .env 設定

```bash
# Google AI Studio 使用時
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=YOUR_API_KEY

# Vertex AI 使用時
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=LOCATION
```

#### 実行

```bash
# CLI で実行
adk run my_agent

# Web UI で実行（開発用のみ）
adk web --port 8000
```

> ⚠️ `adk web` は開発・デバッグ専用。本番デプロイには使用しない。

### TypeScript セットアップ

```bash
mkdir my-adk-agent && cd my-adk-agent
npm init -y
npm install @google/adk
npm install -D @google/adk-devtools typescript
```

#### 基本的な agent.ts

```typescript
import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';

const getCurrentTime = new FunctionTool({
  name: 'get_current_time',
  description: 'Returns the current time in a specified city.',
  parameters: z.object({
    city: z.string().describe("City name"),
  }),
  execute: ({ city }) => {
    return { status: 'success', report: `The current time in ${city} is 10:30 AM` };
  },
});

export const rootAgent = new LlmAgent({
  name: 'hello_time_agent',
  model: 'gemini-2.5-flash',
  description: 'Tells the current time in a specified city.',
  instruction: `You are a helpful assistant. Use the 'getCurrentTime' tool.`,
  tools: [getCurrentTime],
});
```

---

## 3. エージェントの種類

ADK には3種類のエージェントがある:

| 種類 | 主な機能 | コアエンジン | 決定論性 | 用途 |
|------|---------|-------------|---------|------|
| **LLM Agent** (`LlmAgent` / `Agent`) | 推論・生成・ツール使用 | LLM | 非決定的（柔軟） | 言語タスク、動的判断 |
| **Workflow Agent** | エージェント実行フロー制御 | 定義済みロジック | 決定的（予測可能） | 構造化プロセス、オーケストレーション |
| **Custom Agent** | 独自ロジック・統合 | カスタムコード | 実装依存 | テイラーメイドの要件 |

### エージェント連携

複雑なアプリケーションでは、これらを組み合わせる:
- **LLM Agent**: 知的な言語ベースのタスク実行
- **Workflow Agent**: プロセスフロー全体の管理
- **Custom Agent**: ユニークな統合に必要な特殊機能

---

## 4. LLM Agent 詳細

`LlmAgent`（エイリアス: `Agent`）は ADK のコアコンポーネント。LLM を活用して推論・自然言語理解・意思決定・応答生成・ツール操作を行う。

### 基本パラメータ

#### アイデンティティ定義

- **`name`** (必須): 一意の文字列識別子。マルチエージェントでの参照に使用。`user` は予約語。
- **`description`** (任意、マルチエージェントでは推奨): 他エージェントがタスクをルーティングする際に使用。
- **`model`** (必須): 使用する LLM モデル（例: `"gemini-2.5-flash"`）

```python
from google.adk.agents import Agent

capital_agent = Agent(
    model="gemini-2.5-flash",
    name="capital_agent",
    description="Answers user questions about the capital city of a given country."
)
```

#### 指示（instruction）

エージェントの行動を形作る最も重要なパラメータ。

設定すべき内容:
- コアタスク / ゴール
- ペルソナ（例:「あなたは親切なアシスタントです」）
- 行動の制約
- ツールの使い方（いつ、なぜ使うか）
- 出力フォーマット

**効果的な指示のコツ:**
- 明確かつ具体的に
- Markdown で可読性を向上
- 例を含める（Few-Shot）
- ツールの使用タイミングを説明

**動的な値の挿入（State テンプレート）:**
- `{var}` — state 変数の値を挿入
- `{artifact.var}` — artifact のテキスト内容を挿入
- `{var?}` — 変数が存在しない場合はエラーを無視

```python
capital_agent = Agent(
    model="gemini-2.5-flash",
    name="capital_agent",
    instruction="""You are an agent that provides the capital city of a country.
When a user asks for the capital of a country:
1. Identify the country name from the user's query.
2. Use the `get_capital_city` tool to find the capital.
3. Respond clearly to the user, stating the capital city.
Example Query: "What's the capital of {country}?"
Example Response: "The capital of France is Paris."
""",
    tools=[get_capital_city]
)
```

### ツール（tools）

ツールは LLM 組み込み知識を超えた機能を提供する。

```python
def get_capital_city(country: str) -> str:
    """Retrieves the capital city for a given country."""
    capitals = {"france": "Paris", "japan": "Tokyo", "canada": "Ottawa"}
    return capitals.get(country.lower(), f"Sorry, I don't know the capital of {country}.")

capital_agent = Agent(
    model="gemini-2.5-flash",
    name="capital_agent",
    tools=[get_capital_city]  # 関数を直接渡す（Python は自動ラップ）
)
```

TypeScript の場合は `FunctionTool` で明示的にラップ:

```typescript
import { FunctionTool, LlmAgent } from '@google/adk';
import { z } from 'zod';

const getCapitalCityTool = new FunctionTool({
    name: 'getCapitalCity',
    description: 'Retrieves the capital city for a given country.',
    parameters: z.object({
        country: z.string().describe('The country to get capital for.'),
    }),
    execute: ({ country }) => {
        const capitals: Record<string, string> = { 'france': 'Paris', 'japan': 'Tokyo' };
        return { capitalCity: capitals[country.toLowerCase()] ?? 'Unknown' };
    },
});

const agent = new LlmAgent({
    model: 'gemini-2.5-flash',
    name: 'capitalAgent',
    tools: [getCapitalCityTool],
});
```

### 詳細設定

#### LLM 生成の調整 (`generate_content_config`)

```python
from google.genai import types

agent = Agent(
    # ... other params
    generate_content_config=types.GenerateContentConfig(
        temperature=0.2,       # より決定的な出力
        max_output_tokens=250,
    )
)
```

#### 構造化データ (`input_schema`, `output_schema`, `output_key`)

- **`input_schema`**: 入力の構造を定義（JSON スキーマ）
- **`output_schema`**: 出力の構造を定義（JSON 形式を強制）
- **`output_key`**: 最終応答をセッション state に自動保存

```python
from pydantic import BaseModel, Field

class CapitalOutput(BaseModel):
    capital: str = Field(description="The capital of the country.")

structured_agent = Agent(
    model="gemini-2.5-flash",
    name="structured_capital_agent",
    instruction='Respond ONLY with a JSON object: {"capital": "capital_name"}',
    output_schema=CapitalOutput,  # JSON 出力を強制
    output_key="found_capital"    # state['found_capital'] に保存
)
```

#### コンテキスト管理 (`include_contents`)

- `"default"`: 通常動作（会話履歴を含む）
- `"none"`: 会話履歴を無視（各呼び出しが独立）

#### プランナー

推論プロセスに「考える」ステップを導入:

```python
from google.adk.planners import BuiltInPlanner
from google.genai.types import ThinkingConfig

planner = BuiltInPlanner(
    thinking_config=ThinkingConfig(
        thinking_budget_tokens=1024
    )
)

agent = Agent(
    model="gemini-2.5-flash",
    name="planning_agent",
    planner=planner,
)
```

#### コード実行

LLM がコードを生成・実行してタスクを解決:

```python
from google.adk.code_executors import VertexAiCodeExecutor
from google.adk.agents import Agent

agent = Agent(
    model="gemini-2.5-flash",
    name="code_agent",
    instruction="Use code execution for calculations.",
    code_executor=VertexAiCodeExecutor(),
)
```

---

## 5. Workflow Agents

LLM を使わずに、定義済みパターンで他エージェントの実行フローを制御する。

### SequentialAgent（逐次実行）

サブエージェントを定義順に一つずつ実行する。

```python
from google.adk.agents import SequentialAgent, LlmAgent

code_writer = LlmAgent(name="CodeWriter", model="gemini-2.5-flash",
    instruction="Write Python code based on the spec.",
    output_key="generated_code")

code_reviewer = LlmAgent(name="CodeReviewer", model="gemini-2.5-flash",
    instruction="Review the code in {generated_code} and provide feedback.",
    output_key="review_comments")

code_refactorer = LlmAgent(name="CodeRefactorer", model="gemini-2.5-flash",
    instruction="Refactor {generated_code} based on {review_comments}.",
    output_key="final_code")

pipeline = SequentialAgent(
    name="CodePipeline",
    sub_agents=[code_writer, code_reviewer, code_refactorer]
)
```

### ParallelAgent（並列実行）

サブエージェントを同時に実行する。

```python
from google.adk.agents import ParallelAgent, LlmAgent

researcher_a = LlmAgent(name="ResearcherA", model="gemini-2.5-flash",
    instruction="Research topic A.", output_key="research_a")

researcher_b = LlmAgent(name="ResearcherB", model="gemini-2.5-flash",
    instruction="Research topic B.", output_key="research_b")

parallel_research = ParallelAgent(
    name="ParallelResearch",
    sub_agents=[researcher_a, researcher_b]
)
```

> **注意:** 各サブエージェントは独立したコンテキストで実行される。`output_key` を使って shared state 経由で結果を共有する。

### LoopAgent（ループ実行）

サブエージェントを繰り返し実行する。`escalate` アクションで終了。

```python
from google.adk.agents import LoopAgent, LlmAgent

draft_agent = LlmAgent(name="Drafter", model="gemini-2.5-flash",
    instruction="Write or revise the document. Store in {document}.",
    output_key="document")

review_agent = LlmAgent(name="Reviewer", model="gemini-2.5-flash",
    instruction="""Review {document}. If acceptable, call escalate. 
    Otherwise provide feedback in {feedback}.""",
    output_key="feedback")

improvement_loop = LoopAgent(
    name="DocImprovementLoop",
    sub_agents=[draft_agent, review_agent],
    max_iterations=5  # 安全策として最大回数を設定
)
```

---

## 6. Custom Agents

`BaseAgent` を直接拡張して独自のロジックを実装する。

### 実装方法（Python）

```python
from google.adk.agents import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event
from typing import AsyncGenerator

class MyCustomAgent(BaseAgent):
    """カスタムエージェント"""

    model_config = {"arbitrary_types_allowed": True}

    # 必須: 非同期実行ロジックを定義
    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        # カスタムロジック
        # ctx.session.state でセッション state にアクセス
        # self.sub_agents でサブエージェントにアクセス
        yield Event(...)  # イベントを生成

    # 任意: ライブ/ストリーミング用
    async def _run_live_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        async for event in self._run_async_impl(ctx):
            yield event
```

### TypeScript の場合

```typescript
import { BaseAgent, InvocationContext } from '@google/adk';
import type { Event } from '@google/adk';

class MyCustomAgent extends BaseAgent {
    async *runAsyncImpl(context: InvocationContext): AsyncGenerator<Event> {
        // カスタムロジック
        yield {
            id: 'event-1',
            invocationId: context.invocationId,
            author: this.name,
            content: { parts: [{ text: 'Custom output' }] },
            actions: createEventActions(),
            timestamp: Date.now(),
        };
    }
}
```

---

## 7. マルチエージェントシステム

### 構成プリミティブ

#### 7.1 エージェント階層（親子関係）

`sub_agents` パラメータで親子関係を定義:

```python
from google.adk.agents import LlmAgent

greeter = LlmAgent(name="Greeter", model="gemini-2.5-flash")
task_doer = LlmAgent(name="TaskExecutor", model="gemini-2.5-flash")

coordinator = LlmAgent(
    name="Coordinator",
    model="gemini-2.5-flash",
    description="I coordinate greetings and tasks.",
    sub_agents=[greeter, task_doer]
)
# greeter.parent_agent == coordinator （自動設定）
```

#### 7.2 インタラクション・通信メカニズム

| メカニズム | 説明 |
|-----------|------|
| **LLM駆動デリゲーション** | LLM が `transfer_to_agent()` を呼び `sub_agents` にタスクを委譲 |
| **AgentTool（明示的呼び出し）** | エージェントをツールとしてラップし、明示的に呼び出す |
| **Shared Session State** | `output_key` と `context.state` で state を共有 |
| **Artifacts** | バイナリデータの共有（ファイル等） |

### 一般的なマルチエージェントパターン

#### コーディネーター/ディスパッチャーパターン

中央の LLM Agent がリクエストを適切な専門エージェントにルーティング:

```python
billing_agent = LlmAgent(name="Billing", model="gemini-2.5-flash",
    description="Handles billing inquiries.")
support_agent = LlmAgent(name="Support", model="gemini-2.5-flash",
    description="Handles technical support requests.")

coordinator = LlmAgent(
    name="HelpDeskCoordinator",
    model="gemini-2.5-flash",
    instruction="Route: billing → Billing agent, technical → Support agent.",
    sub_agents=[billing_agent, support_agent]
)
```

#### シーケンシャルパイプラインパターン

`SequentialAgent` で多段処理。`output_key` → `context.state` で受け渡し:

```python
from google.adk.agents import SequentialAgent

pipeline = SequentialAgent(
    name="DataPipeline",
    sub_agents=[extractor, transformer, loader]
)
```

#### パラレル Fan-Out/Gather パターン

`ParallelAgent` で同時処理、結果を集約:

```python
from google.adk.agents import ParallelAgent, SequentialAgent

fan_out = ParallelAgent(name="FanOut", sub_agents=[agent_a, agent_b, agent_c])
gatherer = LlmAgent(name="Gatherer", instruction="Combine results from {result_a}, {result_b}, {result_c}")

full_pipeline = SequentialAgent(
    name="FanOutGather",
    sub_agents=[fan_out, gatherer]
)
```

#### 階層的タスク分解パターン

親エージェントがタスクを分解し、子エージェントに委譲:

```python
sub_task_a = LlmAgent(name="SubTaskA", description="Handles sub-task A")
sub_task_b = LlmAgent(name="SubTaskB", description="Handles sub-task B")

manager = LlmAgent(
    name="ProjectManager",
    model="gemini-2.5-flash",
    instruction="Break complex tasks into sub-tasks and delegate.",
    sub_agents=[sub_task_a, sub_task_b]
)
```

#### レビュー/批評パターン（Generator-Critic）

```python
from google.adk.agents import LoopAgent

generator = LlmAgent(name="Generator", instruction="Generate content...")
critic = LlmAgent(name="Critic", instruction="Review and approve or request revision...")

review_loop = LoopAgent(
    name="ReviewLoop",
    sub_agents=[generator, critic],
    max_iterations=3
)
```

---

## 8. ツール

### ツールの種類

| 種類 | 説明 |
|------|------|
| **Function Tools** | 開発者が作成するカスタム関数 |
| **Built-in Tools** | フレームワーク提供の組み込みツール（Google Search, Code Execution, RAG 等） |
| **MCP Tools** | Model Context Protocol 経由の外部ツール |
| **Third-Party Tools** | 外部ライブラリとの連携 |

### ツールの動作原理

1. **推論**: LLM がインストラクション・会話履歴・リクエストを分析
2. **選択**: ツール名・説明・パラメータスキーマに基づきツールを選択
3. **呼び出し**: LLM が引数を生成しツールを実行
4. **観察**: ツールの出力を受信
5. **最終化**: 出力を推論に組み込み、次のアクションを決定

---

## 9. カスタムツール

### Function Tool（Python）

Python では関数を直接ツールとして渡せる（自動ラップ）:

```python
def get_weather(city: str) -> dict:
    """Retrieves the current weather report for a specified city.

    Args:
        city (str): The name of the city.

    Returns:
        dict: status and result or error msg.
    """
    if city.lower() == "new york":
        return {"status": "success", "report": "Sunny, 25°C"}
    return {"status": "error", "error_message": f"No data for '{city}'."}

agent = Agent(
    model="gemini-2.5-flash",
    name="weather_agent",
    tools=[get_weather]
)
```

> **重要:** docstring がツールの説明として LLM に提供される。明確に記述すること。

### Function Tool（TypeScript）

```typescript
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

const getWeather = new FunctionTool({
    name: 'get_weather',
    description: 'Retrieves the current weather report for a specified city.',
    parameters: z.object({
        city: z.string().describe('The city name.'),
    }),
    execute: ({ city }) => {
        if (city.toLowerCase() === 'new york') {
            return { status: 'success', report: 'Sunny, 25°C' };
        }
        return { status: 'error', error_message: `No data for '${city}'.` };
    },
});
```

### Tool Context

高度なシナリオでは `tool_context: ToolContext` パラメータで追加情報にアクセス:

```python
from google.adk.tools import ToolContext

def update_user_preference(preference: str, value: str, tool_context: ToolContext):
    """Updates a user-specific preference."""
    user_prefs_key = "user:preferences"
    preferences = tool_context.state.get(user_prefs_key, {})
    preferences[preference] = value
    tool_context.state[user_prefs_key] = preferences
    return {"status": "success", "updated_preference": preference}
```

#### ToolContext の主要属性

| 属性 | 説明 |
|------|------|
| `state` | セッション state の読み書き |
| `actions` | ツール実行後のアクション制御 |
| `function_call_id` | ツール呼び出しの一意ID |
| `auth_response` | 認証レスポンス |

#### State プレフィックス

| プレフィックス | スコープ |
|---------------|---------|
| `app:*` | アプリ全ユーザー共有 |
| `user:*` | ユーザー固有（全セッション） |
| （なし） | 現在のセッション固有 |
| `temp:*` | 一時的（永続化されない） |

> **注意:** `tool_context` は docstring に含めない。LLM の判断に不要であり、混乱を招く。

### Agent-as-a-Tool（AgentTool）

他のエージェントをツールとして使用:

```python
from google.adk.tools.agent_tool import AgentTool

specialist = LlmAgent(name="Specialist", model="gemini-2.5-flash",
    description="Handles specialized queries")

main_agent = LlmAgent(
    name="MainAgent",
    model="gemini-2.5-flash",
    tools=[AgentTool(agent=specialist)]
)
```

### Long Running Function Tool

非同期操作やユーザー確認が必要なツール:

```python
from google.adk.tools import LongRunningFunctionTool

long_tool = LongRunningFunctionTool(func=my_async_function)
```

---

## 10. MCP 連携

### MCP（Model Context Protocol）とは

LLM と外部アプリケーション・データソース・ツールの通信を標準化するオープンスタンダード。

### ADK で MCP サーバーを使用

`McpToolset` で外部 MCP サーバーのツールを ADK エージェントに統合:

```python
from google.adk.agents import LlmAgent
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

agent = LlmAgent(
    model="gemini-2.5-flash",
    name="mcp_agent",
    instruction="Use filesystem tools to manage files.",
    tools=[
        McpToolset(
            connection_params=StdioConnectionParams(
                server_params=StdioServerParameters(
                    command="npx",
                    args=["-y", "@anthropic/mcp-filesystem", "/path/to/folder"]
                )
            )
        )
    ]
)
```

#### McpToolset の動作

1. **接続管理**: MCP サーバーへの接続を確立・管理
2. **ツール検出・変換**: MCP ツールを ADK 互換の `BaseTool` に変換
3. **エージェントへの公開**: ネイティブ ADK ツールのように公開
4. **プロキシ呼び出し**: ツール呼び出しを MCP サーバーに中継
5. **フィルタリング**: `tool_filter` で特定のツールのみ選択可能

### リモート MCP サーバー（SSE/Streamable HTTP）

```python
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

agent = LlmAgent(
    model="gemini-2.5-flash",
    name="remote_mcp_agent",
    tools=[
        McpToolset(
            connection_params=SseConnectionParams(
                url="https://your-mcp-server.com/sse"
            )
        )
    ]
)
```

### OpenAPI 連携

REST API を OpenAPI スキーマから自動的にツール化:

```python
from google.adk.tools.openapi_tool.openapi_spec_parser import OpenApiSpecParser

openapi_toolset = OpenApiSpecParser.parse("path/to/openapi.json")
agent = LlmAgent(
    model="gemini-2.5-flash",
    name="api_agent",
    tools=openapi_toolset,
)
```

---

## 11. モデルと認証

### 対応モデル

| プロバイダー | モデル例 | 設定方法 |
|-------------|---------|---------|
| **Google Gemini** | `gemini-2.5-flash`, `gemini-2.5-pro` | Google AI Studio API Key / Vertex AI |
| **Anthropic Claude** | `claude-sonnet-4-20250514` | LiteLLM 経由 / Vertex AI |
| **OpenAI** | `openai/gpt-4o` | LiteLLM 経由 |
| **Ollama** | ローカルモデル | `ollama/model-name` |
| **vLLM** | 自己ホスト | OpenAI 互換エンドポイント |

### Gemini 認証

#### Google AI Studio（API Key）

```bash
GOOGLE_GENAI_USE_VERTEXAI=FALSE
GOOGLE_API_KEY=YOUR_API_KEY
```

#### Vertex AI

```bash
GOOGLE_GENAI_USE_VERTEXAI=TRUE
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
# gcloud auth application-default login が必要
```

### LiteLLM 経由のマルチモデル対応

```bash
pip install google-adk[litellm]
```

```python
# OpenAI
agent = Agent(model="openai/gpt-4o", name="openai_agent", ...)

# Anthropic Claude
agent = Agent(model="anthropic/claude-sonnet-4-20250514", name="claude_agent", ...)

# Ollama
agent = Agent(model="ollama/llama3", name="ollama_agent", ...)
```

### Vertex AI 上の Claude

```python
from google.adk.models.anthropic_llm import Claude

LlmAgent.register_model_class(prefix="claude", model_class=Claude)

agent = Agent(
    model="claude-3-5-sonnet-v2@20241022",  # Vertex AI モデル名
    name="vertex_claude_agent",
    ...
)
```

---

## 12. チュートリアル

### エージェントチーム構築（段階的ガイド）

#### Step 1: 基本エージェント — ツール付き

```python
from google.adk.agents import Agent

def get_weather(city: str) -> dict:
    """Retrieves weather for a city."""
    ...

weather_agent = Agent(
    name="weather_agent",
    model="gemini-2.5-flash",
    instruction="Answer weather questions using the get_weather tool.",
    tools=[get_weather],
)
```

#### Step 2: セッション管理とランナー

```python
from google.adk.sessions import InMemorySessionService
from google.adk.runner import Runner

session_service = InMemorySessionService()
runner = Runner(
    agent=weather_agent,
    app_name="weather_app",
    session_service=session_service
)

# セッション作成
session = await session_service.create_session(
    app_name="weather_app",
    user_id="user123",
    session_id="session456"
)
```

#### Step 3: エージェントチーム — デリゲーション

```python
greeting_agent = Agent(
    name="greeting_agent",
    model="gemini-2.5-flash",
    description="Handles greetings and farewells.",
    instruction="Greet users warmly.",
)

farewell_agent = Agent(
    name="farewell_agent",
    model="gemini-2.5-flash",
    description="Handles farewells.",
    instruction="Say goodbye warmly.",
)

root_agent = Agent(
    name="weather_agent_v3",
    model="gemini-2.5-flash",
    instruction="""You are the main weather agent.
    Delegate greetings to greeting_agent, farewells to farewell_agent.""",
    tools=[get_weather],
    sub_agents=[greeting_agent, farewell_agent],
)
```

#### Step 4: Session State によるパーソナライズ

```python
def get_weather_stateful(city: str, tool_context: ToolContext) -> dict:
    """Gets weather and remembers the last city checked."""
    tool_context.state["last_city"] = city
    ...

agent = Agent(
    instruction="Remember user's last city: {last_city?}",
    tools=[get_weather_stateful],
)
```

#### Step 5: 安全性 — before_model_callback

```python
from google.adk.agents.callback_context import CallbackContext
from google.genai import types

def safety_check(callback_context: CallbackContext,
                  llm_request: types.GenerateContentConfig):
    """Block harmful content before it reaches the model."""
    last_message = callback_context.user_content
    if last_message and "harmful" in last_message.parts[0].text.lower():
        return types.GenerateContentResponse(
            candidates=[types.Candidate(
                content=types.Content(parts=[types.Part(text="I cannot process that.")])
            )]
        )
    return None  # None = proceed normally

agent = Agent(
    ...,
    before_model_callback=safety_check,
)
```

#### Step 6: 安全性 — before_tool_callback

```python
def validate_tool_args(callback_context: CallbackContext,
                       tool, args: dict):
    """Validate tool arguments before execution."""
    if "city" in args and not args["city"].strip():
        return {"error": "City name cannot be empty."}
    return None  # None = proceed with tool execution

agent = Agent(
    ...,
    before_tool_callback=validate_tool_args,
)
```

---

## 13. ツール・インテグレーション一覧

### Built-in Tools

| ツール | 説明 |
|--------|------|
| Google Search | ウェブ検索 |
| Code Execution | コード実行 |
| RAG (Retrieval) | ドキュメント検索 |

### サードパーティ連携

以下のような外部サービスとの連携が可能（一部）:

- **データ**: BigQuery, Firestore
- **API**: OpenAPI 仕様ベースの API
- **MCP サーバー**: ファイルシステム、Google Maps 等
- **認証**: OAuth 2.0, OpenID Connect, API Key
- **オブザーバビリティ**: Arize, AgentOps, LangSmith

### ツール認証

ADK はツールレベルの認証フローをサポート:

```python
from google.adk.auth import AuthConfig, AuthCredential, AuthCredentialTypes, OAuth2Auth

auth_config = AuthConfig(
    auth_scheme=OAuth2Auth(
        authorization_url="https://accounts.google.com/o/oauth2/auth",
        token_url="https://oauth2.googleapis.com/token",
    ),
    raw_auth_credential=AuthCredential(
        auth_type=AuthCredentialTypes.OAUTH2,
        oauth2=OAuth2Credential(
            client_id="YOUR_CLIENT_ID",
            client_secret="YOUR_CLIENT_SECRET",
        )
    )
)
```

---

## 14. 開発ツール連携

### llms.txt

ADK は `llms.txt` ファイルを提供し、AI コーディングアシスタントが ADK ドキュメントを参照可能:

- **URL**: `https://google.github.io/adk-docs/llms.txt`
- **Full版**: `https://google.github.io/adk-docs/llms-full.txt`

### 各ツールの設定

#### Claude Code

```bash
claude mcp add adk-docs --transport stdio -- uvx --from mcpdoc mcpdoc \
  --urls AgentDevelopmentKit:https://google.github.io/adk-docs/llms.txt \
  --transport stdio
```

#### Cursor / Antigravity

MCP サーバー設定に追加:

```json
{
  "mcpServers": {
    "adk-docs-mcp": {
      "command": "uvx",
      "args": [
        "--from", "mcpdoc", "mcpdoc",
        "--urls", "AgentDevelopmentKit:https://google.github.io/adk-docs/llms.txt",
        "--transport", "stdio"
      ]
    }
  }
}
```

#### Gemini CLI

```bash
gemini extensions install https://github.com/derailed-dash/adk-docs-ext
```

---

## 付録: alche:me プロジェクトへの適用ノート

### 16エージェント構成への ADK マッピング

alche:me の RPG パーティ制16エージェントは、以下の ADK パターンで実装可能:

| alche:me Phase | 推奨 ADK パターン |
|----------------|------------------|
| Phase 1: 資産化（Inventory/Freshness/Portfolio） | **ParallelAgent** で並列分析 |
| Phase 2: 調合（Alchemist/Dupe/Stylist） | **Coordinator パターン** — Concierge が適切なエージェントにルーティング |
| Phase 3: 状況理解（Trend/TPO/Scout） | **ParallelAgent** で並列情報収集 |
| Phase 4: 体験出力（Concierge/Simulator/Memory） | **SequentialAgent** — 提案→シミュレーション→記録 |
| Phase 5: 学習（Profiler/PlusOne/Rescue/ROI） | **Custom Agent** — 独自の分析ロジック |

### 推奨アーキテクチャ

```
root_agent (Concierge Bot / ナビゲーター)
├── inventory_pipeline (SequentialAgent)
│   ├── inventory_manager (LlmAgent + 画像認識ツール)
│   ├── freshness_guardian (LlmAgent + 期限管理ツール)
│   └── portfolio_analyst (LlmAgent + 分析ツール)
├── alchemy_coordinator (LlmAgent - Coordinator パターン)
│   ├── cosmetic_alchemist (LlmAgent)
│   ├── dupe_stylist (LlmAgent)
│   └── stylist_agent (LlmAgent)
├── context_gatherer (ParallelAgent)
│   ├── trend_hunter (LlmAgent + Web検索ツール)
│   ├── tpo_tactician (LlmAgent + 天気/カレンダーAPI)
│   └── product_scout (LlmAgent + EC検索ツール)
├── experience_pipeline (SequentialAgent)
│   ├── simulator (LlmAgent + 画像生成ツール)
│   └── memory_keeper (LlmAgent + DB書き込みツール)
└── learning_agents (ParallelAgent)
    ├── profiler (Custom Agent)
    ├── plus_one_advisor (LlmAgent)
    ├── rescue_matcher (LlmAgent)
    └── roi_visualizer (LlmAgent)
```

---

> **参考リンク**
> - ADK 公式ドキュメント: https://google.github.io/adk-docs/
> - ADK GitHub: https://github.com/google/adk-python
> - ADK サンプル: https://github.com/google/adk-samples
> - llms.txt: https://google.github.io/adk-docs/llms.txt
