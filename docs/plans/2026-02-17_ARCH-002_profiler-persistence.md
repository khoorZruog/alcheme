# ARCH-002（短期）: Profiler結果のFirestore永続化

| | |
|---|---|
| **Date** | 2026-02-17 |
| **Status** | Completed |
| **Scope** | Profiler 分析結果の Firestore 永続化 + セッション開始時の自動読み込み |

---

## Context

Profiler Agent は Beauty Log / レシピ履歴からユーザーのメイク傾向（色・テクスチャ・ムード・マンネリ検知等）を分析するが、結果は `InMemoryMemoryService` 内にのみ存在し、Cloud Run のコンテナ再起動・スケーリングで消失する。

**目的:** 分析結果を Firestore に永続化し、セッション開始時に全エージェントが利用できるようにする。

---

## 実装内容

### Step 1: `profiler_tools.py` — 分析結果の Firestore 永続化

`analyze_preference_history()` の return 前に2つの副作用を追加:

1. **Firestore 書き込み** — `users/{userId}` ドキュメントの `preferences` フィールドに分析結果を保存（`update()` で他フィールドに影響なし）
2. **State 即時反映** — `tool_context.state["user:profiler_preferences"]` にセットし、同一セッション内の他エージェントが即座に参照可能に

両方とも fire-and-forget（失敗してもツールのレスポンスは正常に返す）。

### Step 2: `server.py` — セッション開始時の読み込み

`_build_user_state()` で、既に読み込んでいる `users/{userId}` ドキュメントから `preferences` フィールドも抽出。追加の Firestore 読み込みは不要。

### Step 3: テスト追加

`agent/tests/test_profiler_tools.py` に4テストケースを新規作成。

---

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `agent/alcheme/tools/profiler_tools.py` | return 前に永続化 + state 注入（約15行追加） |
| `agent/server.py` | `_build_user_state()` に2行追加（`preferences` 読み込み） |
| `agent/tests/test_profiler_tools.py` | **新規**: 4テストケース |

## 検証

- `pytest tests/test_profiler_tools.py` — 4テスト全パス ✅
- `vitest run` — 127テスト全パス ✅

## 影響範囲

| 変更 | リスク |
|------|--------|
| Firestore 永続化 | 極低（fire-and-forget、失敗しても既存動作に影響なし） |
| State 注入 | 低（新キー追加のみ、既存キーに影響なし） |
| `_build_user_state` | 極低（既存 Firestore 読み込みからのフィールド追加のみ） |
