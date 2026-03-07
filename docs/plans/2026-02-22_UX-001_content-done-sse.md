# UX-001: レシピ・プレビュー画像の同時生成

## Context

レシピ生成時、テキスト＋レシピカードが全て出力された後、プレビュー画像の生成（Gemini 2.5 Flash Image → GCS アップロード、10-15秒）を`await`で待っている。この間 SSE ストリームは開いたままで、フロントエンドの `isLoading: true` / `is_streaming: true` が続くためチャット入力がブロックされる。

**問題**: テキストとレシピカードは全て揃っているのに、プレビュー画像生成のためにさらに10-15秒間 UI がロック状態になる。

**解決策**: テキスト＋レシピカード出力完了時に `content_done` SSE イベントを発行。フロントエンドはこのイベントで `isLoading: false` に切り替え、ユーザーの入力をアンロックする。SSE ストリームは開いたまま `preview_image` イベントを待ち、到着したら非同期で画像を表示する。

---

## 修正ファイル

| # | ファイル | 変更内容 |
|---|---------|---------|
| 1 | `types/chat.ts` | `SSEEventType` に `"content_done"` 追加 |
| 2 | `agent/server.py` | 主パス・リトライパスで `content_done` イベント発行 |
| 3 | `hooks/use-chat.ts` | `content_done` ハンドリング + ストリーム継続ロジック |

---

## 実装手順

### Step 1: `types/chat.ts` — SSEEventType 拡張

`SSEEventType` union に `"content_done"` を追加（L77-86）:

```typescript
export type SSEEventType =
  | "text_delta"
  | "recipe_card"
  | "preview_image"
  | "product_card"
  | "technique_card"
  | "progress"
  | "content_done"   // ← 追加
  | "done"
  | "error"
  | "agent_used";
```

### Step 2: `agent/server.py` — content_done イベント発行

**主パス** (`event_generator` 内、L786付近):

現状の流れ:
```
agent stream → text_delta/recipe_card → await generate_preview_image → done
```

変更後の流れ:
```
agent stream → text_delta/recipe_card → content_done → await generate_preview_image → done
```

具体的な変更:

1. `recipe_card` yield の後、`generate_preview_image` の前に `content_done` イベントを yield:
```python
# After recipe_card emission, before preview image generation
content_done_data = encoder({"type": "content_done", "data": ""}, ensure_ascii=False)
yield f"data: {content_done_data}\n\n"
```

2. レシピが無い場合も `content_done` を発行（テキストのみの応答でもUIアンロックが必要）:
   - `for block in json_blocks` ループの後、`if saved_recipe_id and recipe_steps` の前に配置
   - `content_done_sent` フラグで重複発行を防止

3. **リトライパス**（L874-916）にも同様の `content_done` 発行を追加

4. **エラーパス**（例外発生時、retry しない場合）: error イベントの後に `content_done` を発行する必要はない（`done` がすぐ来るため）

### Step 3: `hooks/use-chat.ts` — content_done ハンドリング

`processLine` 関数内（L248-327）に `content_done` ハンドラを追加:

```typescript
} else if (event.type === "content_done") {
  // Content is fully delivered — unlock UI immediately
  // SSE stream stays open for preview_image
  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId ? { ...m, is_streaming: false } : m
    )
  );
  setIsLoading(false);
  setThinkingStatus(null);
}
```

**重要ポイント**: `finally` ブロック（L370-397）は変更不要。`content_done` 到着後にストリームが終了すると `finally` が走り、`setIsLoading(false)` が再度呼ばれるが、既に `false` なので問題ない。`is_streaming` も既に `false` なので二重設定は無害。

**`preview_image` ハンドラ**（L277-286）: 変更不要。`content_done` 後にストリームが継続し、`preview_image` イベントが到着したら既存のハンドラがメッセージを更新する。`isLoading: false` 状態でも `reader.read()` ループは引き続き動作する。

**Abort 安全策**: `sendMessage` の冒頭で前回のストリームが残っている場合に abort する:

```typescript
// sendMessage 冒頭
if (abortRef.current) {
  abortRef.current.abort();
  abortRef.current = null;
}
```

これにより、`content_done` でUIアンロック後にユーザーが新しいメッセージを送った場合、前のストリーム（まだ preview_image を待っている可能性）が適切にクリーンアップされる。

---

## タイムライン図

```
現状:
User sends ──→ [text_delta...] [recipe_card] [progress: プレビュー生成中] ──10-15s──→ [preview_image] [done]
                                                                          ^                              ^
                                                              UI locked ──────────────────────────────── UI unlocked

変更後:
User sends ──→ [text_delta...] [recipe_card] [content_done] [progress: プレビュー生成中] ──10-15s──→ [preview_image] [done]
                                              ^              ^                                       ^
                                              UI unlocked    ← user can type new message →           image appears silently
```

---

## エッジケース

| ケース | 動作 |
|-------|------|
| レシピなし（テキストのみ応答） | `content_done` → `done`（即座に連続発行） |
| プレビュー生成タイムアウト | `content_done` 後にタイムアウト → `done`（UI は既にアンロック済み） |
| プレビュー生成失敗 | `content_done` 後に例外 → `done`（UI は既にアンロック済み） |
| ユーザーが `content_done` 後に新メッセージ送信 | 前のストリームを abort → 新ストリーム開始（プレビュー画像は失われる） |
| エラー → リトライ | リトライパスでも `content_done` 発行 |
| Agent deadline 超過 | `break` でループ終了 → `content_done` → `done` |

---

## Verification

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. `cd agent && python -m pytest tests/ -v` — Python テストパス
4. 手動確認:
   - レシピ生成時、テキスト＋カードが表示された直後に入力欄がアクティブになる
   - プレビュー画像はその後10-15秒後に非同期で表示される
   - テキストのみの応答でも正常に動作する
   - `content_done` 後に新メッセージを送信しても問題なし
