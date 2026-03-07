# alche:me — Phase 0 完了報告 & Phase 1 開発ガイド

> **本ドキュメントの目的:** Zennハッカソンで構築したPhase 0プロトタイプの全貌を記録し、Claude CodeによるPhase 1開発をスムーズに開始するためのコンテキストを提供する。

---

## 1. Phase 0 サマリー

| 項目 | 内容 |
|------|------|
| **イベント** | Zenn主催 第4回 Agentic AI Hackathon with Google Cloud |
| **開発期間** | 約6-10時間（ミニハッカソン） |
| **旧プロダクト名** | Cosme Mixologist |
| **新プロダクト名** | alche:me（アルケミー） |
| **目的** | 「画像入力→代用レシピJSON出力」のコアエンジンが動作することを証明（"魔法"の証明） |
| **実装範囲** | Agent 02（Inventory Manager）+ Agent 04（Cosmetic Alchemist）のみ |
| **UI** | Streamlit（app.py） |
| **AI基盤** | Google ADK + Gemini 2.5 Flash |
| **結果** | コアロジックの動作を確認。在庫登録・レシピ生成・保存機能が稼働。 |

---

## 2. プロトタイプのファイル構成

```
cosme_mixologist/
├── agent.py             # Google ADK エージェント定義（Root + Inventory + Alchemist）
├── prompts.py           # 3つのエージェント用システムプロンプト
├── tools.py             # 在庫CRUD・検索・フィルタリング等のツール関数群
├── app.py               # Streamlit UI（1,472行。チャット/在庫管理/レシピ表示/保存）
├── requirements.txt     # 依存関係（google-adk, google-generativeai, streamlit, Pillow, python-dotenv）
├── sample_inventory.json  # サンプル在庫データ（15アイテム）
├── user_inventory.json    # ユーザー在庫データ（16アイテム、サンプル+追加分）
├── user_profile.json      # ユーザープロフィール（Eri, 27歳, 混合肌, イエベ春）
├── saved_recipes.json     # 保存済みレシピ（4件のサンプル出力）
└── README.md              # セットアップ・使い方ガイド
```

---

## 3. 実装済みコンポーネントの詳細

### 3.1 エージェント構成（agent.py）

Phase 0では3つのADKエージェントを定義:

```
root_agent (cosme_mixologist) — Gemini 2.5 Flash
├── inventory_agent — コスメ画像解析・在庫登録
└── alchemist_agent — メイクレシピ生成
```

**Root Agent（オーケストレーター）の役割:**
- ユーザー入力の意図判定（画像アップロード / メイクリクエスト / 在庫確認）
- 適切なサブエージェントへのルーティング
- コミュニケーションスタイル: 美容部員のような温かみ

**Inventory Agent（在庫判定官）の役割:**
- 画像内のコスメアイテムを検出
- ブランド・製品名・色・質感を識別
- 残量を目視推定
- JSON形式で構造化データ出力

**Alchemist Agent（調合師）の役割:**
- 手持ち在庫のみでメイクレシピを生成（Hallucination厳禁ルール）
- 代用テクニック（Substitution）の提案
- 重ね技（Layering）の提案
- 思考プロセスの言語化

### 3.2 ツール関数群（tools.py）

以下の関数が実装済み:

| 関数名 | 機能 | Phase 1での扱い |
|--------|------|----------------|
| `generate_item_id()` | UUID生成 | 流用可能 |
| `load_inventory(file_path)` | JSONからインベントリ読込 | Firestore移行で置換 |
| `save_inventory(inventory, file_path)` | JSONへインベントリ保存 | Firestore移行で置換 |
| `add_items_to_inventory(new, existing)` | アイテム追加 | ロジック流用可能 |
| `get_inventory_summary(inventory)` | カテゴリ別集計 | 流用可能 |
| `search_inventory(inventory, query)` | キーワード検索 | 流用可能 |
| `filter_inventory_by_category(inventory, cat)` | カテゴリフィルタ | 流用可能 |
| `validate_recipe_items(steps, inventory)` | レシピのアイテムID検証 | 流用可能 |
| `format_inventory_for_prompt(inventory)` | プロンプト用テキスト整形 | 流用可能 |
| `encode_image_to_base64(image_path)` | 画像Base64化 | 流用可能 |

### 3.3 プロンプト定義（prompts.py）

3つのシステムプロンプトが定義済み:

- **INVENTORY_SYSTEM_PROMPT**: 画像解析の出力ルール、カテゴリ分類（Lip/Cheek/Eye/Base/Other）、質感分類（matte/glossy/shimmer/cream/powder/liquid）
- **ALCHEMIST_SYSTEM_PROMPT**: 在庫縛りルール、代用テクニック例、重ね技テクニック例、JSON出力形式
- **ROOT_AGENT_PROMPT**: ルーティングロジック、コミュニケーションスタイル

### 3.4 UI（app.py）

Streamlitで以下のページを実装（約1,472行）:

| ページ | 機能 |
|--------|------|
| **Chat** | メインのチャットUI。テキスト入力でレシピリクエスト |
| **Inventory** | 在庫一覧表示（カテゴリフィルタ・検索・ソート対応） |
| **Item Detail** | アイテム詳細表示・編集・削除 |
| **Add Item** | 手動でのアイテム追加フォーム |
| **Confirm** | AI画像認識結果の確認・修正画面 |
| **Saved Recipes** | 保存済みレシピの閲覧・削除 |
| **Help** | 使い方ガイド |

**UI特徴:**
- グラデーションヘッダー（ピンク→パープル）
- カード型の在庫表示
- ADKセッション管理によるマルチターン会話
- レシピ保存機能（JSON永続化）
- Gemini 2.5 Flash Imageによるメイクイメージ画像生成（オプション）

### 3.5 データスキーマ

**インベントリアイテム（Phase 0版）:**
```json
{
  "id": "item_001",
  "category": "Lip",
  "brand": "KATE",
  "product_name": "リップモンスター",
  "color_description": "マットレッド（深みのある赤）",
  "texture": "matte",
  "estimated_remaining": "80%"
}
```

**レシピカード（Phase 0版）:**
```json
{
  "recipe_name": "韓国風・純欲メイク",
  "message": "買わなくてOKです！手持ちアイテムで再現できます✨",
  "thinking_process": ["思考1", "思考2", "思考3"],
  "steps": [
    {
      "step": 1,
      "area": "ベース",
      "item_id": "item_010",
      "item_name": "PAUL & JOE モイスチュアライジングプライマー",
      "instruction": "下地を顔全体に薄く伸ばす"
    }
  ],
  "pro_tips": ["プロのテクニック"],
  "substitution_notes": ["代用テクニックの説明"],
  "saved_at": "2026-01-25 13:10",
  "id": "recipe_7dc4f55a"
}
```

**ユーザープロフィール（Phase 0版）:**
```json
{
  "name": "Eri",
  "age": "27歳",
  "skin_type": "混合肌",
  "personal_color": "イエベ春",
  "styles": [],
  "notes": ""
}
```

### 3.6 サンプルデータの内訳

**サンプル在庫（15+1アイテム）:**
- Lip（2）: KATE リップモンスター, rom&nd ジューシーラスティングティント
- Cheek（3）: CANMAKE グロウフルールチークス, CEZANNE ナチュラルチークN, CEZANNE パールグロウハイライト
- Eye（6）: EXCEL スキニーリッチシャドウ, MAJOLICA MAJORCA シャドーカスタマイズ, CANMAKE パーフェクトスタイリストアイズ, DEJAVU ラスティンファインE, HEROINE MAKE ロング&カールマスカラ, B IDOL THE EYE PALETTE
- Base（3）: PAUL & JOE プライマー, MAYBELLINE フィットミー, CEZANNE UVシルクカバーパウダー
- Other（1）: KOSE メイクキープミスト

**保存済みレシピ（4件）:**
1. 雪解け血色メイク（冬の透明感と儚さ）
2. 上品な輝きをまとう冬の透明感メイク
3. きゅるるん♡アイドルドールメイク
4. 煌めきを閉じ込めて☆星屑グリッターメイク

---

## 4. Phase 0 で確認できたこと

### 4.1 成功した点
- Gemini 2.5 Flashによるコスメ画像認識は実用レベル
- ADKのマルチエージェント構成（Root + Sub-agent）が正常動作
- 代用テクニック・重ね技の提案品質が高い（メイク理論として破綻しない）
- 思考プロセスの可視化がデモ映えする
- JSONベースのデータフローが安定

### 4.2 Phase 0 の制約・課題
- **永続化なし:** データはローカルJSONファイルのみ（Firestore未使用）
- **認証なし:** ユーザー認証機能なし
- **画像認識精度:** ブランド名が不明な場合の補完機能がない（Product Search Agent未実装）
- **UIの制約:** Streamlitはプロトタイプ用。モバイル対応・UX品質に限界
- **ゲーミフィケーション未実装:** カード化・鑑定演出・レア度付与等はなし
- **文字化け:** agent.pyとtools.pyの日本語コメントが一部文字化け（UTF-8エンコーディング問題）

---

## 5. Phase 1 MVP スコープ（PRD v2より）

### 5.1 Phase 1 概要

| 項目 | 内容 |
|------|------|
| **期間** | Month 2-3 |
| **ゴール** | クローズドβ 50人 |
| **エージェント** | Inventory Manager + Product Search + Alchemist + Concierge |
| **フロントエンド** | Next.js 16 Webアプリ |
| **認証** | Firebase Auth |
| **ゲーミフィケーション** | カード化・鑑定演出（基本的なもの） |

### 5.2 Phase 1 で追加すべき機能

| 機能 | 説明 | Phase 0の状態 |
|------|------|--------------|
| **Firebase Auth** | Email/Password + Google OAuth | 未実装 |
| **Firestore永続化** | ユーザー在庫・レシピ・プロフィールのDB化 | ローカルJSON |
| **Cloud Storage** | コスメ画像の保存 | 未実装 |
| **Product Search Agent** | Google検索でブランド・商品名を補完 | 未実装 |
| **Concierge Bot** | 自然言語での対話窓口（Root Agentの発展形） | 基本的なルーティングのみ |
| **ゲーミフィケーション（基本）** | カード化、鑑定演出、レア度付与 | 未実装 |
| **Next.js フロントエンド** | モバイル対応、カードUI | Streamlit |
| **Cloud Run デプロイ** | Dockerデプロイ | ローカル実行のみ |

### 5.3 Phase 1 週次ロードマップ

| 週 | ゴール | タスク |
|----|--------|--------|
| **Week 1** | Pythonスクリプトで「画像→代用レシピJSON」 | GCP + ADK環境構築、コスメ画像ベクトル化、Agent 04プロンプト改善 |
| **Week 2** | ADKでエージェント協調動作 | root_agent + サブエージェント再定義、Custom Tools実装、State Management |
| **Week 3** | スマホで触れるWebアプリ | UI/UXデザイン（カードUI）、Next.js→FastAPI接続、Imagen 3統合 |
| **Week 4** ✅ | 統合テスト + デプロイ | E2Eテスト、Hallucination検知、Docker + Cloud Run デプロイ、β テスト準備 |

### 5.4 拡張データスキーマ（Phase 1版）

Phase 0のスキーマに以下フィールドを追加する:

**インベントリアイテム（Phase 1版）:**
```json
{
  "id": "item_001",
  "category": "Lip",
  "brand": "KATE",
  "product_name": "リップモンスター",
  "color_code": "03",
  "color_name": "陽炎",
  "color_description": "深みのあるローズレッド",
  "texture": "matte",
  "estimated_remaining": "80%",
  "open_date": "2025-01-01",
  "confidence": "high",
  "source": "画像認識 + @cosme検索",
  "vector": {
    "hue": 0.95,
    "saturation": 0.8,
    "value": 0.4,
    "texture_score": 0.9
  },
  "stats": {
    "attack": "A",
    "defense": "B",
    "durability": "S",
    "stealth": "C"
  }
}
```

追加フィールド: `color_code`, `color_name`, `open_date`, `confidence`, `source`, `vector`（HSV + 質感スコア）, `stats`（RPG属性）

---

## 6. Phase 1 開発時の技術的注意事項

### 6.1 ADK関連
- `google_search` ツールは単独でAgentに割り当てる必要あり（他ツールと併用不可の制約）。Product Search Agentは独立サブエージェントとして設計すること。
- ADK公式ドキュメントへのMCPアクセスを設定推奨:
  ```bash
  claude mcp add adk-docs --transport stdio -- uvx --from mcpdoc mcpdoc \
    --urls AgentDevelopmentKit:https://google.github.io/adk-docs/llms.txt \
    --transport stdio
  ```

### 6.2 16エージェント構成へのADKマッピング
Phase 1ではフル16エージェントは不要だが、アーキテクチャ設計時に拡張性を意識:

| alche:me Phase | 推奨ADKパターン |
|----------------|----------------|
| Phase 1: 資産化（Inventory/Freshness/Portfolio） | `ParallelAgent` で並列分析 |
| Phase 2: 調合（Alchemist/Dupe/Stylist） | Coordinatorパターン |
| Phase 3: 状況理解（Trend/TPO/Scout） | `ParallelAgent` で並列情報収集 |
| Phase 4: 体験出力（Concierge/Simulator/Memory） | `SequentialAgent` |
| Phase 5: 学習（Profiler/PlusOne/Rescue/ROI） | Custom Agent |

### 6.3 プロンプト品質
Phase 0のプロンプトは動作確認済みだが、以下の改善を推奨:
- Alchemistプロンプトに「match_score（再現度%）」の出力を追加
- 環境コンテキスト（天気・TPO）への対応パターンを拡充
- ゲーミフィケーション要素（鑑定演出、レア度判定）をInventoryプロンプトに追加

### 6.4 ブランディング変更
- プロダクト名は `Cosme Mixologist` → `alche:me` に変更済み
- コード内の参照名（`cosme_mixologist`, `APP_NAME`等）をリネーム
- コンセプトメッセージも「買わなくてOK！」→「1つ足せば、3つ蘇る」等に更新

### 6.5 本番技術スタック
```
Frontend:  Next.js 16 (React 19) + TypeScript + Tailwind CSS + shadcn/ui
Backend:   Cloud Run (Python / FastAPI)
AI/Agent:  Google ADK + Gemini 2.5 Flash/Pro
Database:  Cloud Firestore
Storage:   Cloud Storage（画像保存）
Auth:      Firebase Auth
Search:    Vertex AI Vector Search（将来：Dupe判定・類似コスメ検索）
```

---

## 7. Phase 0 コードの再利用マップ

| ファイル | 再利用度 | Phase 1での扱い |
|---------|---------|----------------|
| `tools.py` | ★★★★ | ツール関数のロジックは大部分流用可能。I/O層のみFirestore対応に差し替え |
| `prompts.py` | ★★★★ | システムプロンプトは品質確認済み。拡張して使用 |
| `agent.py` | ★★★☆ | ADKエージェント定義の構造は参考になる。Product Search Agent追加・リネーム必要 |
| `app.py` | ★☆☆☆ | Streamlit → Next.jsに完全移行。UIロジック・フローは参考になるが直接流用は不可 |
| `sample_inventory.json` | ★★★★★ | テスト・開発用サンプルデータとしてそのまま使用可能 |
| `user_profile.json` | ★★★☆ | スキーマは参考になるがFirestoreドキュメントに移行 |
| `saved_recipes.json` | ★★★★ | レシピのJSON構造はそのまま使用可能。出力品質の参考にもなる |

---

## 8. alche:me フルビジョン（Phase 1以降の参考）

Phase 1は以下のフルビジョンの一部を実装する。全体像を理解した上で、拡張しやすい設計を心がけること。

### ゲーミフィケーション戦略（段階的導入）
- **Phase 1:** カード化・鑑定演出（「レアアイテム発見！」）、インベントリ・レベル
- **Phase 2:** モーニング・クエスト、ヒットパン・ゲージ（Project Pan）、環境デバフ
- **Phase 3:** デッキ機能（カプセル・デッキ）、レシピ・カード交換

### RPG属性システム
- 質感 (Texture): マット（防御力/耐久性）vs ツヤ（魅力/瞬発力）
- 発色 (Pigment): ナチュラル（ステルス）vs ボールド（攻撃力）
- 色温度 (Temp): ウォーム（イエベ補正）vs クール（ブルベ補正）

### Beauty Log（学習するメイクカレンダー）
- AI提案 vs 実績の差分記録
- パターン学習（「Eriさんは雨の日に暖色を選びがち」）
- マンネリ検知・成功体験リバイバル

---

## 9. 重要ドキュメント一覧

| ドキュメント | 内容 | 参照タイミング |
|-------------|------|---------------|
| `alcheme_PRD_v4.md` | フルビジョンPRD（要件・スコープ・ロードマップ） | 要件確認時 |
| `adk_docs_build-agents.md` | ADKエージェント構築ガイド | エージェント実装時 |
| `adk_docs_components.md` | ADKコンポーネントリファレンス | Session/State/Artifact等の設計時 |
| `adk_docs_run-agents.md` | ADK実行ガイド | デプロイ・テスト時 |
| `COSME_MIXOLOGIST_HANDOFF.md` | ハッカソン引継ぎドキュメント | アーキテクチャ概要確認時 |
| `sample_inventory.json` | サンプル在庫データ | テスト・開発時 |

---

## 10. Phase 1 開発 開始チェックリスト

```
✅ 本ドキュメントを読了
✅ alcheme_PRD_v4.md の Section 5（要件）と Section 9.2（Phase 1ロードマップ）を確認
✅ Phase 0 のコード群（agent.py, tools.py, prompts.py）を確認
✅ ADKドキュメント（adk_docs_build-agents.md, adk_docs_components.md）を確認
✅ GCP プロジェクトのセットアップ
✅ Firebase Auth の設定
✅ Cloud Firestore のコレクション設計
✅ Next.js プロジェクトの初期化
□ ADK MCP サーバーの設定（Claude Code用）— 未使用（Claude Code直接利用）
```

---

*Phase 0 Complete. Phase 1 開発中 — Week 3/4 完了。*
*Last Updated: 2026-02-13*
*Author: Eri Kaneko (Product Owner)*
