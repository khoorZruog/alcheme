# UX-012: テーマスワイプ継続 & 複数LIKE対応

## Context

テーマオーバーレイで1つのテーマをLIKEすると即座に「selected」状態に遷移し、残りのテーマを確認できなかった。ユーザーは全てのテーマを見比べてから最終選択したい。

## 変更内容

### `components/theme-overlay.tsx`

| 変更点 | Before | After |
|--------|--------|-------|
| liked state | `likedTheme: ThemeSuggestion \| null` | `likedThemes: ThemeSuggestion[]` + `selectedTheme: ThemeSuggestion \| null` |
| handleLike | `setState("selected")` 即座遷移 | `setLikedThemes(prev => [...prev, theme])` — スワイプ継続 |
| handleComplete | `likedTheme` の有無で分岐 | `likedThemes.length > 0` で "selected" or "empty" |
| selected UI | 1テーマのみ表示 | 全LIKEテーマをリスト表示、タップで選択、確認ボタン |
| handleConfirmSelection | `likedTheme` 使用 | `selectedTheme` 使用（リストから選んだもの） |

### UX フロー

```
Before:
  swipe → LIKE → selected (1テーマだけ表示) → レシピ提案

After:
  swipe → LIKE (続行) → LIKE (続行) → SKIP → ... → 全カード完了
  → selected 画面: LIKEした全テーマをリスト表示
  → タップで選択 → 「レシピを提案してもらう」ボタン
```

### selected 画面 UI

- ヘッダー: 「N つのテーマが気に入りました！」
- サブテキスト: 「レシピを作りたいテーマを選んでください」
- リスト: サムネイル + タイトル + 説明（1行） + チェックマーク
- 確認ボタン: テーマ未選択時は disabled

## Verification

- `npx tsc --noEmit`: theme-overlay.tsx エラーなし
- `npx vitest run`: 47 files, 285 tests passed
