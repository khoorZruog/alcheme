# Plan: レシピページ統合リデザイン — テーマとレシピを recipes コレクションに統合

## Context

テーマとレシピは 1:1。すべてのレシピはテーマを持つべき。DB も UI も統合し、`users/{userId}/recipes` コレクション1つで管理する。テーマのみのエントリは `source: "theme"` として保存。レシピ一覧ページ = テーマ一覧ページとして、統一グリッドで表示・フィルタ・検索できるようにする。

**制約**: ハッカソン版デプロイ (`alcheme-web-*`) は無変更。Firestore 変更は additive のみ。ハッカソン版の recipes コレクションにテーマエントリが表示されるが、`recipe_name: theme_title` でフォールバックされエラーにならない。

---

## データモデル変更

### Recipe 型の拡張 (`types/recipe.ts`)

```ts
export interface Recipe {
  id: string;
  recipe_name: string;        // テーマのみ: theme_title をコピー

  // --- テーマフィールド (NEW) ---
  theme_title?: string;
  theme_description?: string;
  style_keywords?: string[];
  theme_status?: "active" | "liked" | "skipped";
  theme_context?: { weather?: string; occasion?: string; season?: string };

  // --- 既存レシピフィールド ---
  character_theme?: "cute" | "cool" | "elegant";  // 既存、テーマと共有
  user_request: string;        // テーマのみ: ""
  match_score?: number;
  steps: RecipeStep[];         // テーマのみ: []
  thinking_process: string[];  // テーマのみ: []
  pro_tips: string[];          // テーマのみ: []
  context?: { weather?: string; occasion?: string; note?: string };

  // --- 共有 ---
  preview_image_url?: string;  // 1つの画像
  is_favorite: boolean;
  source?: "manual" | "ai" | "theme";  // "theme" = テーマのみ
  feedback?: { user_rating: "liked" | "neutral" | "disliked"; created_at: string };
  created_at: string;
}
```

`theme_id` フィールドは不要 — テーマデータはレシピ doc に内包。

---

## グリッドカード設計

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ [画像]         │     │ [画像]         │     │ [画像]         │
│  aspect-[4/3] │     │  aspect-[4/3] │     │  aspect-[4/3] │
│               │     │               │     │  opacity-60   │
│  ✅ レシピ済み  │     │  ❤️ Liked     │     │  ⏭️ スキップ  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ レシピ名       │     │ テーマ名       │     │ テーマ名       │
│ #tag1 #tag2   │     │ #tag1 #tag2   │     │ #tag1 #tag2   │
│ match 85%     │     │               │     │               │
│ 3ステップ      │     │ [レシピを作る→] │     │ [気になる]     │
└──────────────┘     └──────────────┘     └──────────────┘
  ↑ タップ→詳細         ↑ CTA→チャット       ↑ ボタン→LIKED化
```

---

## 変更ファイル一覧

### 新規ファイル
| ファイル | 目的 |
|---------|------|
| `app/api/recipes/backfill-themes/route.ts` | 既存レシピへのテーマフィールド付与 + 既存 theme_suggestions マイグレーション |
| `__tests__/unit/components/unified-recipe-card.test.tsx` | 統合カードテスト (テーマのみ/レシピ済み/スキップの3パターン) |

### 変更ファイル (Frontend)
| ファイル | 変更内容 |
|---------|---------|
| `types/recipe.ts` | テーマフィールド追加 (`theme_title`, `style_keywords`, `theme_status`, etc.) |
| `types/theme.ts` | 非推奨化 or `Recipe` の型エイリアスに変更 |
| `app/api/recipes/route.ts` | GET: テーマフィールドも含めて返却。`?source=theme` フィルタ追加 |
| `app/api/themes/route.ts` | POST: テーマ生成は維持、GET は `GET /api/recipes?source=theme` にリダイレクト |
| `app/api/themes/[themeId]/route.ts` | PATCH: `recipes` コレクションを更新するよう変更 |
| `app/api/themes/[themeId]/image/route.ts` | POST: `recipes` コレクションの画像を更新 |
| `hooks/use-recipes.ts` | テーマステータスフィルタ + キーワードフィルタ追加 |
| `hooks/use-theme-suggestions.ts` | `Recipe[]` 型で動作するよう変更。SWR key を `/api/recipes?source=theme&status=active` に |
| `app/(main)/recipes/page.tsx` | 統合グリッドに全面リデザイン |
| `components/theme-overlay.tsx` | `Recipe` 型で動作するよう変更 |
| `components/theme-card.tsx` | `Recipe` 型の props に変更 |
| `components/theme-card-stack.tsx` | `Recipe` 型の props に変更 |
| `hooks/use-chat.ts` | `sendMessage` に `themeId` option。recipe_card 時にテーマ doc 更新 |
| `app/(main)/chat/page.tsx` | `?theme_title=` / `?theme_id=` deep link |
| `firestore.rules` | `theme_suggestions` ルールは残しつつ、recipes が主 |

### 変更ファイル (Agent)
| ファイル | 変更内容 |
|---------|---------|
| `agent/alcheme/tools/theme_tools.py` | 3箇所: `theme_suggestions` → `recipes` コレクションに変更。テーマ doc にレシピ skeleton フィールド追加 |
| `agent/server.py` | 変更なし (endpoint は既存のまま、内部実装が変わるだけ) |

---

## 実装ステップ

### Step 1: `types/recipe.ts` — テーマフィールド追加

上記のデータモデル変更を反映。すべて optional なので additive。

---

### Step 2: `types/theme.ts` — Recipe 型エイリアス化

`ThemeSuggestion` を `Recipe` のサブセット型に変更:
```ts
import type { Recipe } from "./recipe";
/** @deprecated Use Recipe type directly */
export type ThemeSuggestion = Pick<Recipe,
  "id" | "theme_title" | "theme_description" | "style_keywords" |
  "character_theme" | "preview_image_url" | "theme_status" | "theme_context" | "created_at"
> & { title: string; description: string; status: string };
```

既存コンポーネントの段階的移行を容易にするため、当面は互換型を維持。

---

### Step 3: `agent/alcheme/tools/theme_tools.py` — recipes コレクションに統合

**3箇所の変更:**

**a) `generate_theme_suggestions()` (L195, L219)**
```python
# Before:
themes_ref = db.collection("users").document(user_id).collection("theme_suggestions")
# After:
themes_ref = db.collection("users").document(user_id).collection("recipes")
```

テーマ doc に Recipe skeleton フィールドを追加:
```python
theme_doc = {
    # テーマフィールド
    "theme_title": str(raw.get("title", f"テーマ {i + 1}")),
    "theme_description": str(raw.get("description", "")),
    "style_keywords": raw.get("style_keywords", []),
    "character_theme": char_theme,
    "theme_status": "active",
    "theme_context": {"season": user_context.get("season", "")},
    # レシピ skeleton (テーマのみ)
    "recipe_name": str(raw.get("title", f"テーマ {i + 1}")),
    "user_request": "",
    "steps": [],
    "thinking_process": [],
    "pro_tips": [],
    "is_favorite": False,
    "source": "theme",
    "created_at": now_iso,
    "updated_at": now_iso,
}
```

返り値は既存互換を維持 (`title`, `description`, `status` フィールドも含める)。

**b) `generate_theme_image()` (L294-296)**
```python
# Before:
.collection("theme_suggestions").document(theme_id).update(...)
# After:
.collection("recipes").document(theme_id).update(...)
```

**c) `update_theme_status()` (L336-338)**
```python
# Before:
.collection("theme_suggestions").document(theme_id).update(update_data)
# After:
.collection("recipes").document(theme_id).update(update_data)
```

`update_data` のキーも変更: `"status"` → `"theme_status"`

---

### Step 4: API ルート変更

**a) `app/api/recipes/route.ts` GET — テーマフィールドも含めて返却**

既存の `...data` スプレッドで自動的にテーマフィールドが含まれる。追加:
- `?source=theme` パラメータでテーマのみエントリをフィルタ

**b) `app/api/themes/route.ts` POST — 維持、GET は不要に**

POST はそのまま (agent 経由でテーマ生成)。GET は `GET /api/recipes?source=theme` で代替。

**c) `app/api/themes/[themeId]/route.ts` PATCH — recipes コレクション更新**

`callAgent("/theme-status", ...)` はそのまま。agent 側が recipes コレクションを更新。

**d) `app/api/themes/[themeId]/image/route.ts` POST — recipes コレクション更新**

`callAgent("/generate-theme-image", ...)` はそのまま。agent 側が recipes コレクションを更新。

---

### Step 5: `app/api/recipes/backfill-themes/route.ts` — マイグレーション

`POST /api/recipes/backfill-themes`:

1. **既存 theme_suggestions → recipes にマイグレーション**:
   - `theme_suggestions` から全テーマを読み取り
   - 各テーマに recipe skeleton を付与して `recipes` に保存 (同じ ID)
   - `recipe_id` が設定されているテーマは、対象レシピ doc にテーマフィールドをマージ

2. **テーマフィールドなし recipes にテーマ付与**:
   - `source !== "theme"` かつ `theme_title` がない recipe を取得
   - `theme_title` ← `recipe_name`, `theme_description` ← `user_request`
   - `style_keywords` ← `context.occasion`, `character_theme` から抽出
   - `theme_status` ← `"liked"`, `source` は既存値維持

戻り値: `{ migrated_themes: number, backfilled_recipes: number }`

---

### Step 6: `hooks/use-theme-suggestions.ts` — Recipe 型対応

`ThemeSuggestion` → `Recipe` 型に変更。内部の API 呼び出しはそのまま (テーマ API routes は recipes を操作する)。

`generateThemes` が返すデータは agent から来るので、フロント側では `id`, `theme_title`, `preview_image_url`, `theme_status` 等のフィールドにアクセス。

ThemeOverlay, ThemeCard, ThemeCardStack も `Recipe` 型に変更 (or 互換 alias 経由)。

---

### Step 7: `hooks/use-recipes.ts` — フィルタ拡張

既存フィルタに追加:
```ts
themeStatusFilter: "all" | "liked" | "skipped" | "with_recipe"
```

`with_recipe` = `source !== "theme"` (レシピデータが存在)
`liked` = `theme_status === "liked"` かつ `source === "theme"`
`skipped` = `theme_status === "skipped"`

テーマキーワード検索: `searchQuery` に `style_keywords` も含めてマッチ。

---

### Step 8: `app/(main)/recipes/page.tsx` — 統合グリッド

**データソース**: `useRecipes` のみ (テーマも recipes に含まれるため)

**フィルタ chips 追加**:
```
[お気に入り] [再現度80%+] [❤️ Liked] [⏭️ スキップ] [レシピ済み]
```

**統一カード** (ページ内コンポーネント):

`source === "theme"` + `theme_status === "liked"`:
- 画像: `preview_image_url`、タイトル: `theme_title`、タグ pills、"レシピを作る→" CTA
- CTA → `router.push('/chat?theme_title=...&theme_id=...')`

`source === "theme"` + `theme_status === "skipped"`:
- 画像 (opacity-60)、タイトル: `theme_title`、"気になる" ボタン → PATCH で `theme_status: "liked"`

`source !== "theme"` (レシピ済み):
- 既存の RecipeSummaryCard + テーマタグ pills 追加

**既存機能完全維持**: グリッド/リスト切替、一括選択、検索、フィルタシート、Hero CTA

---

### Step 9: `hooks/use-chat.ts` — theme→recipe リンク

`sendMessage` 引数に `themeId?: string` 追加。
SSE handler の `recipe_card` 受信時 (L274):

テーマ doc (= recipes doc) を recipe データで更新:
```ts
if (themeId && finalData?.id) {
  // テーマ doc に recipe データをマージ
  fetch(`/api/recipes/${themeId}/merge-recipe`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipe_id: finalData.id,
      source: 'ai',
      theme_status: 'liked',
    }),
  }).catch(console.error);
}
```

※ recipe が新しい doc ID で保存される場合は、テーマ doc をレシピデータで上書きするか、テーマ doc を recipe doc にマージする API が必要。**代替案**: agent の `save_recipe` ツールが テーマ doc ID を引き継いで同じ doc に保存する形にすれば、追加 API 不要。これは agent の save_recipe に `theme_id` パラメータを追加する変更。

→ **シンプルな方法**: 既存テーマ doc を recipe データで上書き。`theme_title` 等のテーマフィールドは保持しつつ、`recipe_name`, `steps`, `match_score` 等を追加、`source` を `"ai"` に変更。PATCH /api/themes/{themeId} を拡張して recipe データのマージに対応。

---

### Step 10: `app/(main)/chat/page.tsx` — deep link

`?theme_title=` / `?theme_id=` で `sendMessage` に themeId を渡す。

---

### Step 11: `firestore.rules`

`theme_suggestions` ルールは残す (マイグレーション中の読み取り用)。`recipes` は既にルールあり。

---

### Step 12: テスト + 検証

- `__tests__/unit/components/unified-recipe-card.test.tsx`
- 既存テスト全パス: `npx vitest run` + `npx tsc --noEmit`
- `cd agent && python -m pytest tests/ -v`
- 手動:
  - バックフィル実行 → 既存レシピ/テーマが統合
  - `/recipes` → 統合グリッド (テーマのみ + レシピ済み + スキップ)
  - テーマスワイプ → LIKE → レシピ作成 → 同一 doc 更新
  - フィルタ/ソート/検索 すべて動作

---

## 実装バッチ順序

```
Batch A (型 + Agent):    Step 1 → 2 → 3
Batch B (API + 移行):    Step 4 → 5
Batch C (hooks):         Step 6 → 7
Batch D (UI):            Step 8
Batch E (リンク配線):    Step 9 → 10
Batch F (仕上げ):        Step 11 → 12
```

---

## 将来タスク (今回スコープ外)

- チャットから直接レシピ作成時にも自動テーマ生成 (agent `save_recipe` tool 変更)
- テーマキーワードの AI リッチ化 (バックフィルテーマは基本的なキーワードのみ)
- `theme_suggestions` コレクションの完全廃止 (マイグレーション完了後)
