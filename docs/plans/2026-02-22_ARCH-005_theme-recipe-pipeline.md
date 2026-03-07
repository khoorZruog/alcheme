# ARCH-005 テーマ×レシピ統合パイプライン完成

> 実装日: 2026-02-22 | ステータス: ✅ 完了

## Context

ARCH-004 でデータモデルとUIを統合したが、3つのギャップが残っていた:

1. **UI不一致**: チャットで「テーマを提案して」→ テキスト番号リスト。ThemeOverlay → Tinder風スワイプ。
2. **プレビュー画像未生成**: テーマ→レシピ作成フローで `preview_image` が生成されないケースがある。
3. **テーマフィールド未付与**: `save_recipe` が `theme_title`, `style_keywords` 等を付与しない。

## 実装サマリ

### Batch 1: チャット内テーマ提案UI統一

- `isThemeSuggestionRequest()` でテーマ提案リクエストを検出 → ThemeOverlayを開く
- `handleSend` ラッパーで `ChatInput.onSend` をインターセプト
- 「おまかせ提案」チップに `action: "theme"` を追加

### Batch 2: プレビュー画像生成の堅牢化

- unwrapped recipe フォーマット検出 (`steps` + `recipe_name` at top level → auto-wrap)
- 診断ログ追加 (JSON未検出時/steps未抽出時)

### Batch 3: テーマフィールド自動付与 + doc統合

- `save_recipe` と `_fallback_save_recipe` で `theme`/`occasion` → `theme_title`/`style_keywords` 自動マッピング
- `theme_id` を `chat/page.tsx` → `use-chat.ts` → `/api/chat` → `server.py` で全チェーン受け渡し
- `server.py` で recipe doc を theme doc にマージ（重複 doc 削除）

### Batch 4: テーマキーワードリッチ化

- `backfill-themes/route.ts` の Phase 2 でキーワード抽出強化
  - `recipe_name` から形容詞マッチング
  - alchemist の `theme` フィールドからトークン分割

### Batch 5: theme_suggestions コレクション廃止

- `backfill-themes/route.ts` の Phase 1 (theme_suggestions 読み取り) を削除
- `generate_theme_suggestions()` は既に recipes コレクションに直接書き込み済み

## 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `app/(main)/chat/page.tsx` | `isThemeSuggestionRequest` + `handleSend` + `themeId` 受け渡し |
| `components/quick-action-chips.tsx` | 「おまかせ提案」に `action: "theme"` |
| `agent/server.py` | unwrapped recipe fallback + 診断ログ + `ChatRequest.theme_id` + doc マージ + fallback テーマ付与 |
| `agent/alcheme/tools/recipe_tools.py` | テーマフィールド自動付与 |
| `hooks/use-chat.ts` | `sendMessage` に `themeId` パラメータ |
| `app/api/chat/route.ts` | `theme_id` 転送 |
| `app/api/recipes/backfill-themes/route.ts` | Phase 1 削除 + キーワード抽出強化 |
| `__tests__/unit/components/quick-action-chips.test.tsx` | テスト修正 |

## 検証結果

- `npx tsc --noEmit`: OK (pre-existing test type errors only)
- `npx vitest run`: 285 tests passed (47 files)
- `python -m pytest tests/ -v`: 134 passed (7 pre-existing failures)
