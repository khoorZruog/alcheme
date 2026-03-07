# FEAT-005A: メイクテーマ提案カードUI（Tinder風スワイプ + AI画像生成）

## Context

現在のおまかせテーマ提案は、Concierge がテキストベースで3つのテーマ（1️⃣ 2️⃣ 3️⃣）を返し、ユーザーが番号で選ぶ形式。以下の問題がある:

- **視覚的訴求力がない**: テキストだけではテーマのイメージが伝わりにくい
- **操作が面倒**: 番号を手入力する必要がある
- **保存されない**: テーマは一時的で Firestore に永続化されない
- **楽しさが不足**: Tinder や TikTok のようなインタラクティブな体験がない

**ゴール**: AI生成イメージ画像付きのスワイプカードUIでテーマを提案し、「右フリック=好き/選択」「左フリック=スキップ」で直感的に選べるようにする。選択したテーマから自動的にメイクレシピを生成する。

**制約**: 販売を見据えた本番品質。テーマは Firestore に永続化する。

**重要な設計思想 — 似合わせテクニック**: パーソナルカラーに「似合わない」色のコスメも、塗り方・重ね方・組み合わせ・ニュアンスチェンジャー（KATE カラーチューナー等）を活用することで似合わせる方法を積極的に提案する。使われていない色こそテーマに組み込み、全てのコスメの可能性を引き出す。

---

## Batch 1: Types + Agent テーマ生成

### `types/theme.ts`（新規）

```typescript
export interface ThemeSuggestion {
  id: string;
  title: string;              // "透明感ナチュラルメイク"
  description: string;        // "春の陽射しに映える..."
  style_keywords: string[];   // ["ナチュラル", "透明感", "ツヤ肌"]
  character_theme: "cute" | "cool" | "elegant";
  preview_image_url?: string; // GCS URL (画像生成後)
  status: "active" | "liked" | "skipped";
  recipe_id?: string;         // 選択後にレシピ生成→リンク
  context?: {
    weather?: string;
    occasion?: string;
    season?: string;
  };
  created_at: string;
  updated_at: string;
}
```

### `agent/alcheme/prompts/theme_generator.py`（新規）

テーマ生成用のプロンプトテンプレート。

```python
THEME_GENERATION_PROMPT = """あなたはメイクテーマの提案スペシャリストです。
ユーザーの手持ちコスメ、天気、季節、好みを考慮して、
魅力的なメイクテーマを3つ提案してください。

## ユーザー情報
{user_context}

## 出力フォーマット（JSON）
[
  {
    "title": "テーマ名（8-15文字）",
    "description": "テーマの説明（30-50文字）",
    "style_keywords": ["キーワード1", "キーワード2", "キーワード3"],
    "character_theme": "cute" | "cool" | "elegant"
  },
  ...
]

## ルール
- 3つのテーマはそれぞれ異なる character_theme を割り当てる
- ユーザーの手持ちコスメで実現可能なテーマにする
- 季節感・天気を考慮する
- **パーソナルカラーに「似合わない」色も積極的に活用する**:
  - 塗り方・重ね方を変えることで似合わせるテクニックを提案
  - 他のコスメと組み合わせて色味を調整する方法を含める
  - ニュアンスチェンジャー（例: KATE リップモンスター カラーチューナー等）の活用も提案
  - 使われていないカラーコスメこそテーマに積極的に組み込む
- 直近のレシピと重複しないバリエーションを提供
"""
```

**関数:**
- `build_theme_generation_prompt(user_context: dict) -> str` — ユーザーコンテキストをプロンプトに埋め込む
- `build_theme_image_prompt(theme: dict) -> str` — テーマからイメージ画像生成プロンプトを構築（`simulator.py` の `build_image_prompt` とは異なり、レシピステップではなくテーマの雰囲気を表現）

### `agent/alcheme/tools/theme_tools.py`（新規）

テーマ生成・保存・画像生成のツール群。

```python
async def generate_theme_suggestions(
    user_id: str,
    inventory_summary: dict | None = None,
    weather: dict | None = None,
    profile: dict | None = None,
    recent_recipes: list[str] | None = None,
) -> dict:
    """Gemini でテーマ3つを生成し、Firestore に保存して返す。"""
    # 1. build_theme_generation_prompt() でプロンプト構築
    # 2. Gemini (gemini-2.5-flash) で JSON 生成
    # 3. パース + バリデーション
    # 4. Firestore users/{userId}/theme_suggestions/{id} に保存
    # 5. 3つのテーマ情報を返す

async def generate_theme_image(
    theme_id: str,
    user_id: str,
    theme: dict,
) -> dict:
    """テーマのイメージ画像を Gemini Image Gen で生成し、GCS にアップロード。"""
    # 1. build_theme_image_prompt() でプロンプト構築
    # 2. Gemini 2.5 Flash (Image Gen) で画像生成
    # 3. GCS alcheme-previews/{user_id}/themes/{theme_id}.webp にアップロード
    # 4. Firestore theme_suggestions doc の preview_image_url を更新
    # 5. 結果を返す
```

**Firestore パス:** `users/{userId}/theme_suggestions/{themeId}`

**再利用する既存コード:**
- [simulator_tools.py](agent/alcheme/tools/simulator_tools.py) — GCS アップロードパターン、Gemini Image Gen 呼び出しパターン
- [simulator.py](agent/alcheme/prompts/simulator.py) — `CHARACTER_THEMES` 定義
- [context_tools.py](agent/alcheme/tools/context_tools.py) — `get_today_context()` のコンテキスト取得パターン
- [inventory_tools.py](agent/alcheme/tools/inventory_tools.py) — `get_inventory_summary()` / `_get_enriched_items()`

### `agent/server.py`（修正）

2つの新エンドポイントを追加:

```python
class SuggestThemesRequest(BaseModel):
    user_id: str

class GenerateThemeImageRequest(BaseModel):
    theme_id: str
    user_id: str

class UpdateThemeStatusRequest(BaseModel):
    theme_id: str
    user_id: str
    status: str  # "liked" | "skipped"
    recipe_id: str | None = None

# POST /suggest-themes
# → generate_theme_suggestions() を呼び出し
# → ユーザーコンテキストは _build_user_state() + get_today_context() 相当を内部で構築
# → 3つのテーマを JSON で返す（SSE 不要、3-5秒で完了）

# POST /generate-theme-image
# → generate_theme_image() を呼び出し
# → 画像 URL を JSON で返す（10-15秒）

# PATCH /theme-status
# → Firestore の theme_suggestions doc の status を更新
# → recipe_id がある場合はリンクも保存
```

---

## Batch 2: Next.js API Routes + Hooks

### `app/api/themes/route.ts`（新規）

```typescript
// POST: テーマ提案を生成
// → callAgent('/suggest-themes', { user_id }) → 3つのテーマを返す
```

### `app/api/themes/[themeId]/image/route.ts`（新規）

```typescript
// POST: テーマ画像を生成
// → callAgent('/generate-theme-image', { theme_id, user_id })
// → { image_url } を返す
```

### `app/api/themes/[themeId]/route.ts`（新規）

```typescript
// PATCH: テーマステータス更新（liked/skipped）
// → callAgent('/theme-status', { theme_id, user_id, status, recipe_id? })
```

### `hooks/use-theme-suggestions.ts`（新規）

```typescript
export function useThemeSuggestions(): {
  themes: ThemeSuggestion[];
  isGenerating: boolean;
  generateThemes: () => Promise<void>;
  generateImage: (themeId: string) => Promise<string | null>;
  updateStatus: (themeId: string, status: "liked" | "skipped", recipeId?: string) => Promise<void>;
}
```

- `generateThemes()` → `POST /api/themes` → テーマ3つ取得 → state 保存
- テーマ取得後、3つの `generateImage()` を並列実行 → 各テーマの `preview_image_url` を順次更新
- `updateStatus()` → `PATCH /api/themes/[themeId]` → Firestore 更新

---

## Batch 3: スワイプカード UI

### `components/theme-card.tsx`（新規）

個別テーマカードコンポーネント。

- **レイアウト**: ほぼ画面幅のカード（`h-[60vh]` 程度）
- **構成**: 上部にイメージ画像（画像なし時はグラデーション背景 + ローディングスピナー）、下部にタイトル + 説明 + キーワードタグ
- **character_theme 別のグラデーション**:
  - cute: `from-pink-100 to-rose-50`
  - cool: `from-slate-100 to-blue-50`
  - elegant: `from-amber-50 to-yellow-50`

```typescript
interface ThemeCardProps {
  theme: ThemeSuggestion;
  isImageLoading: boolean;
}
```

### `components/theme-card-stack.tsx`（新規）

Framer Motion `drag` を使ったスワイプカードスタック。

```typescript
interface ThemeCardStackProps {
  themes: ThemeSuggestion[];
  loadingImages: Set<string>;  // 画像ロード中の theme ID
  onLike: (theme: ThemeSuggestion) => void;
  onSkip: (theme: ThemeSuggestion) => void;
  onComplete: () => void;  // 全カード処理完了
}
```

**Framer Motion 実装:**
```typescript
// カードスタック（最前面のカードのみ drag 可能）
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) onLike(theme);     // 右 → 好き
    if (info.offset.x < -100) onSkip(theme);     // 左 → スキップ
  }}
  animate={{ rotate: dragX * 0.05, x: dragX }}
>
  <ThemeCard ... />
  {/* スワイプ方向のフィードバック */}
  <LikeOverlay opacity={...} />  // ♥ LIKE
  <SkipOverlay opacity={...} />  // ✕ SKIP
</motion.div>
```

**スタック表示**: 3枚のカードを重ねて表示。1枚目は通常サイズ、2枚目は少し縮小 + 後ろにずれる、3枚目はさらに縮小。

**ボタン操作**: ドラッグ以外にも、下部に「✕ Skip」「♥ Like」ボタンを配置（タップ操作対応）。

### `components/theme-overlay.tsx`（新規）

テーマカード生成中 → カードスタック → 完了 を管理するオーバーレイ。

```typescript
interface ThemeOverlayProps {
  open: boolean;
  onClose: () => void;
  onThemeSelected: (theme: ThemeSuggestion) => void;
}
```

**状態遷移:**
1. `generating` — テーマ生成中（ローディングアニメーション）
2. `swiping` — カードスタック表示（スワイプ操作可能）
3. `selected` — テーマ選択完了 → レシピ生成開始のアニメーション
4. `empty` — 全てスキップ → 「もう一度提案」ボタン

### `app/(main)/chat/page.tsx`（修正）

- `themeOverlayOpen` state 追加
- `useThemeSuggestions()` フック接続
- `handleThemeSelected` ハンドラ: テーマ選択 → ステータス更新 → チャットメッセージ送信（`「{theme.title}」のメイクを提案して`）→ Concierge → Alchemist でレシピ生成

### `components/quick-action-chips.tsx`（修正）

既存チップに「メイクテーマ提案」を追加。ただし、このチップはチャットメッセージを送信するのではなく、テーマオーバーレイを直接開く。

```typescript
// CHIPS 配列に追加
{ text: "メイクテーマ提案", emoji: "🎨", action: "theme" }
```

`onSelect` の signature を拡張: `onSelect(text: string, action?: string)` → `action === "theme"` の場合はオーバーレイを開く。

---

## Batch 4: テスト

### `__tests__/unit/components/theme-card-stack.test.tsx`（新規）

- カードがレンダリングされること
- Like ボタンクリックで `onLike` が呼ばれること
- Skip ボタンクリックで `onSkip` が呼ばれること
- 全カード処理後に `onComplete` が呼ばれること
- 画像ロード中にスピナーが表示されること

### `__tests__/unit/hooks/use-theme-suggestions.test.ts`（新規）

- `generateThemes` が API を呼びテーマを返すこと
- `updateStatus` が PATCH API を呼ぶこと

### `agent/tests/test_theme_tools.py`（新規）

- `build_theme_generation_prompt` が正しいプロンプトを構築すること
- `build_theme_image_prompt` がテーマ別に異なるプロンプトを返すこと

---

## 変更ファイル一覧

### 新規 (11)

| ファイル | 説明 |
|---------|------|
| `types/theme.ts` | ThemeSuggestion 型定義 |
| `agent/alcheme/prompts/theme_generator.py` | テーマ生成プロンプト + テーマ画像プロンプト |
| `agent/alcheme/tools/theme_tools.py` | テーマ生成 + テーマ画像生成 + Firestore 永続化 |
| `app/api/themes/route.ts` | POST: テーマ提案生成 |
| `app/api/themes/[themeId]/image/route.ts` | POST: テーマ画像生成 |
| `app/api/themes/[themeId]/route.ts` | PATCH: テーマステータス更新 |
| `hooks/use-theme-suggestions.ts` | テーマ提案フック |
| `components/theme-card.tsx` | 個別テーマカード |
| `components/theme-card-stack.tsx` | Framer Motion スワイプカードスタック |
| `components/theme-overlay.tsx` | テーマ生成〜選択 全体オーバーレイ |
| テスト 3 ファイル | 上記参照 |

### 既存修正 (3)

| ファイル | 変更内容 |
|---------|---------|
| `agent/server.py` | 3 エンドポイント追加（suggest-themes / generate-theme-image / theme-status） |
| `app/(main)/chat/page.tsx` | テーマオーバーレイ統合 |
| `components/quick-action-chips.tsx` | 「メイクテーマ提案」チップ追加 + action パラメータ拡張 |

---

## UX フロー

```
ユーザー: 「メイクテーマ提案」チップ タップ
  ↓
ThemeOverlay 表示（ローディング）
  ↓
POST /api/themes → agent /suggest-themes
  ↓ (3-5秒)
3つのテーマ (テキスト) → ThemeCardStack 表示
  ↓ (並列)
POST /api/themes/{id}/image × 3 (10-15秒、並列)
  → 画像が完成した順にカードに表示
  ↓
ユーザー: 右スワイプ (Like)
  ↓
PATCH /api/themes/{id} → status: "liked"
  ↓
チャットに「{theme.title}のメイクを提案して」送信
  ↓
Concierge → Alchemist → レシピ生成（既存フロー）
```

---

## 検証手順

1. `npx tsc --noEmit` — 型エラーなし
2. `npx vitest run` — 全テストパス
3. `cd agent && python -m pytest tests/ -v` — Python テストパス
4. 手動検証:
   - 「メイクテーマ提案」チップタップ → オーバーレイ表示
   - ローディング後にカード3枚が積み重なって表示
   - 画像が順次ロードされること
   - 右スワイプ → Like アニメーション → 次のカード
   - 左スワイプ → Skip アニメーション → 次のカード
   - Like したテーマでチャットメッセージが自動送信
   - Alchemist が選択テーマに沿ったレシピを生成
   - 全スキップ → 「もう一度提案」ボタン表示
   - ボタンでの Like/Skip 操作も動作すること
