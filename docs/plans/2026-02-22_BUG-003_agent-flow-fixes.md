# BUG-003 エージェントフロー修正（天気メイク自動チェーン + 地域保存 + Profilerバグ）

> 実装日: 2026-02-22 | ステータス: ✅ 完了

## Context

Quick Action Chips からの3つのエージェントフローに問題があった:

1. **「眠ってるコスメ活用」→ エラー**: `profiler_tools.py` が `createdAt`（camelCase）でクエリしていたが、Firestore の recipes ドキュメントは `created_at`（snake_case）を使用。Firestore インデックス不整合でエラー。
2. **「今日の天気に合うメイク」→ 地域を毎回質問**: TPO Tactician のプロンプトが「天気情報が取得できない場合はユーザーに手動で天気を聞く」と指示。ユーザーの地域情報が保存されていなかった。
3. **天気メイク → テキスト戦略のみ、レシピカードなし**: TPO Tactician は「方針」のみ出力する設計。Concierge が自動で Alchemist にチェーンしていなかった。

## 実装サマリ

### Fix 1: profiler_tools.py createdAt → created_at

- `profiler_tools.py:123` の `.order_by("createdAt", ...)` → `.order_by("created_at", ...)` に修正

### Fix 2: Concierge プロンプト — TPO → Alchemist 自動チェーン

- `concierge.py` の TPO ルーティングセクションを更新
- 「tpo_tactician_agent → alchemist_agent（自動チェーン）」セクションを追加
- 自動チェーン手順: TPO方針取得 → ユーザー確認なし → Alchemist にレシピ生成委譲
- 天気のみの質問（レシピ不要）は別セクションで対応

### Fix 3: TPO Tactician プロンプト更新

- 「天気情報が取得できない場合は、ユーザーに手動で天気を聞く」→ 削除
- `get_weather` の location 引数は空文字で呼び出し、保存済み地域を自動使用
- 天気取得不可時は東京の一般的な気候を前提に方針作成
- Concierge が自動チェーンするため、レシピ確認不要の旨を明記

### Fix 4: 地域情報の Firestore 保存 + 設定画面 + Session State ロード

**データフロー**: 設定画面 → `/api/users/me` PATCH → Firestore `users/{userId}.location` → `_build_user_state()` → `user:location` session state → `get_weather` ツール

- `types/user.ts`: `UserProfile` に `location: string | null` 追加
- `app/(main)/settings/constants.ts`: `LOCATIONS` 定数追加（11都市: 東京、大阪、名古屋、福岡、札幌、横浜、神戸、京都、仙台、広島、那覇）
- `app/(main)/settings/use-settings-form.ts`: `SettingsFormState` に `location` 追加、INITIAL・load・save に反映
- `app/(main)/settings/_components/basic-info-section.tsx`: 地域選択UI（チップ形式）追加
- `app/(main)/settings/page.tsx`: 基本情報サマリに地域表示追加
- `agent/server.py`: `_build_user_state()` で `profile["location"]` → `state["user:location"]` をロード

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `agent/alcheme/tools/profiler_tools.py` | `createdAt` → `created_at` 修正 |
| `agent/alcheme/prompts/concierge.py` | TPO→Alchemist 自動チェーン + 天気のみ質問セクション |
| `agent/alcheme/prompts/tpo_tactician.py` | 保存済み地域使用 + レシピ確認不要 |
| `agent/server.py` | `_build_user_state()` に location ロード追加 |
| `types/user.ts` | `location` フィールド追加 |
| `app/(main)/settings/constants.ts` | `LOCATIONS` 定数追加 |
| `app/(main)/settings/use-settings-form.ts` | `location` フォーム対応 |
| `app/(main)/settings/_components/basic-info-section.tsx` | 地域選択UI |
| `app/(main)/settings/page.tsx` | サマリ表示に地域追加 |

## 検証結果

- `npx tsc --noEmit`: OK（pre-existing test type errors のみ）
- `npx vitest run`: 285 tests passed (47 files)
- `python -m pytest tests/ -v`: 134 passed (7 pre-existing failures)
