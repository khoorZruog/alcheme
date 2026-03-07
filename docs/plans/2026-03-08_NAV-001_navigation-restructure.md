# NAV-001: ナビゲーション再構築 — ツール→プラットフォーム転換

## Context

alche:me の現在のナビゲーションは「自分:外向き = 4:1」のツール構造。LIPS 2026実機分析・Agentic Commerce 調査の結果、プラットフォームとして成長するには外向き導線の強化が必要と判明。サイドメニューにはボトムナビとの重複が4項目あり、整理も急務。

**設計哲学**: 「自分を知って、みんなに広げて、賢く買う」

**ゴール**:
- ボトムナビ: 自分4:外向き1 → 外向き3:コア1:自分1
- サイドメニュー: 8項目(重複4) → 6項目(重複0)
- ＋ボタン: ボトムナビ中央 → FAB(右下フローティング)
- Next Cosme タブ: redirect → 実ページ化（Agentic Commerce への伏線を内包しつつ、売りつけ感ゼロ）

---

## 変更ファイル一覧

| ファイル | 種別 | Phase |
|---------|------|-------|
| `components/side-menu.tsx` | 変更 | A |
| `components/fab-button.tsx` | **新規** | C |
| `app/(main)/layout.tsx` | 変更 | C |
| `components/bottom-nav.tsx` | 変更 | B |
| `app/(main)/suggestions/page.tsx` | 変更 | B |
| `app/(main)/add/community/page.tsx` | 変更 | B |
| `__tests__/unit/components/bottom-nav.test.tsx` | 変更 | B |
| `__tests__/unit/components/fab-button.test.tsx` | **新規** | B |

---

## Phase A: サイドメニュー整理（小）

### `components/side-menu.tsx`

**Before:**
```
MAIN_MENU: AI美容部員(/chat), My Cosme(/inventory), レシピ(/recipes), メイク日記(/beauty-log)
SUB_MENU: マイページ(/mypage), みんなのコスメ(/add/community), レシピ一覧(/recipes), 設定(/settings)
→ 8項目、うち3がボトムナビ重複、1が内部重複
```

**After:**
```
MENU_ITEMS: My Cosme(/inventory), レシピ(/recipes), メイク日記(/beauty-log), カレンダー(/beauty-log?view=calendar)
SUB_ITEMS: 設定(/settings)
+ ログアウト（既存のまま）
→ 6項目、重複0
```

**変更内容:**
1. imports: `Sparkles`, `Users`, `User` 削除 → `Calendar` 追加
2. `MAIN_MENU` + `SUB_MENU` → `MENU_ITEMS` + `SUB_ITEMS` に統合
3. `isActive` にクエリパラメータ対応追加（カレンダー用）
4. JSX: 2セクション → `MENU_ITEMS` + divider + `SUB_ITEMS` に

```typescript
import {
  LayoutGrid, BookOpen, CalendarHeart, Calendar,
  Settings, LogOut,
} from "lucide-react";

const MENU_ITEMS = [
  { icon: LayoutGrid, label: "My Cosme", href: "/inventory" },
  { icon: BookOpen, label: "レシピ", href: "/recipes" },
  { icon: CalendarHeart, label: "メイク日記", href: "/beauty-log" },
  { icon: Calendar, label: "カレンダー", href: "/beauty-log?view=calendar" },
] as const;

const SUB_ITEMS = [
  { icon: Settings, label: "設定", href: "/settings" },
] as const;
```

---

## Phase C: FAB 実装（小）

### 新規: `components/fab-button.tsx`

QuickActionSheet のトリガーをボトムナビから分離し、右下フローティングボタンとして独立。

```typescript
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuickActionSheet } from "@/components/quick-action-sheet";

export function FabButton() {
  const [open, setOpen] = useState(false);

  const handleTap = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleTap}
        className="fixed bottom-24 right-6 z-50 flex items-center justify-center
          w-[52px] h-[52px] rounded-full
          bg-gradient-to-tr from-neon-accent/90 to-magic-pink/90
          text-white shadow-lg shadow-neon-glow
          btn-squishy transition-all active:scale-95
          after:absolute after:inset-0 after:rounded-full
          after:bg-gradient-to-b after:from-white/25 after:to-transparent
          after:pointer-events-none"
        aria-label="クイックアクション"
      >
        <Plus size={26} strokeWidth={2.5} className="relative z-10" />
      </button>
      <QuickActionSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
```

**デザイン:**
- 52×52px (旧44pxより大きく、独立FABとして視認性UP)
- 同一グラデーション + neon-glow shadow
- `bottom-24 right-6` = ボトムナビ(bottom-6 + h~56px)の上に十分なクリアランス
- after疑似要素でシャイン効果

### `app/(main)/layout.tsx`

```diff
+ import { FabButton } from '@/components/fab-button';

  {!hideNav && <BottomNav />}
+ {!hideNav && <FabButton />}
```

`hideNav` を共有し、詳細ページ(`/scan/confirm`, `/inventory/`, `/profile/`)ではFABも非表示。

---

## Phase B: ボトムナビ再構築（中）

### `components/bottom-nav.tsx`

**Before (5タブ + ＋ボタン):**
```
chat | inventory | ＋ | feed | mypage
```

**After (5タブ、全てLink):**
```
ホーム(/feed) | 発見(/add/community) | AI美容部員(/chat) | Next Cosme(/suggestions) | マイページ(/mypage)
```

**完全書き換え:**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Sparkles, ShoppingBag, User } from "lucide-react";

const tabs = [
  { id: "home",     label: "ホーム",     icon: Home,        href: "/feed" },
  { id: "discover", label: "発見",       icon: Search,      href: "/add/community" },
  { id: "chat",     label: "AI美容部員", icon: Sparkles,    href: "/chat", isCenter: true },
  { id: "shop",     label: "Next Cosme", icon: ShoppingBag, href: "/suggestions" },
  { id: "mypage",   label: "マイページ", icon: User,        href: "/mypage" },
] as const;
```

**センタータブ（AI美容部員）デザイン:**
- Active: `bg-gradient-to-tr from-neon-accent to-magic-pink text-white shadow-lg shadow-neon-glow` — グラデーション背景 + 白アイコン + グロー
- Inactive: `bg-neon-accent/10 text-neon-accent` — 薄紫背景でセンターを常時差別化
- サイズ: `w-[48px] h-[48px]` (通常タブ40pxより大きい)
- アイコンのみ（ラベル非表示 — Sparklesアイコンだけで十分認識可能）

**通常タブデザイン（既存を維持）:**
- Active: `bg-white shadow-md text-neon-accent` + dot indicator
- Inactive: `text-text-muted hover:text-text-ink`
- サイズ: `w-10 h-10`

**削除するもの:**
- `useState` import（quickActionOpen不要）
- `QuickActionSheet` import
- `Plus` icon import
- `handlePlusTap` 関数
- ＋ボタンの条件分岐レンダリング

### `app/(main)/suggestions/page.tsx` — redirect → 実ページ

**Before:** `router.replace("/inventory?tab=want")` のリダイレクトのみ

**After:** `MainTabHeader` + `InventoryWantView` を使った実ページ

```typescript
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MainTabHeader } from "@/components/main-tab-header";
import { InventoryWantView } from "@/app/(main)/inventory/_components/inventory-want-view";

export default function SuggestionsPage() {
  return (
    <div>
      <MainTabHeader
        title="Next Cosme"
        subtitle="SHOP"
        rightElement={
          <Link
            href="/suggestions/add"
            className="w-9 h-9 rounded-full bg-neon-accent/10 text-neon-accent
              flex items-center justify-center btn-squishy
              hover:bg-neon-accent/20 transition-colors"
          >
            <Plus size={16} />
          </Link>
        }
      />
      <InventoryWantView />
    </div>
  );
}
```

**利点:**
- `InventoryWantView` はプロップ不要（自身でhookからデータ取得）
- `MainTabHeader` で ProfileAvatar（ハンバーガー）表示 → メインタブとして統一感
- `/suggestions/add` の `backHref="/suggestions"` がリダイレクトせず正常動作するようになる

### `app/(main)/add/community/page.tsx` — ヘッダー変更

**Before:**
```tsx
<PageHeader title="みんなのコスメ" backHref="/inventory" />
```

**After:**
```tsx
<MainTabHeader title="発見" subtitle="DISCOVER" />
```

- `PageHeader` → `MainTabHeader` に変更
- 戻るボタン → ProfileAvatar（ハンバーガー）に
- メインタブとしての一貫した外観

**import変更:**
```diff
- import { PageHeader } from "@/components/page-header";
+ import { MainTabHeader } from "@/components/main-tab-header";
```

### テスト更新

**`__tests__/unit/components/bottom-nav.test.tsx`:**
- QuickActionSheet モック削除
- `/inventory` タブのテスト → `/add/community`, `/suggestions` に変更
- ＋ボタンテスト → 「＋ボタンなし」の確認テストに
- `/feed`, `/chat`, `/mypage` テストは維持

**新規 `__tests__/unit/components/fab-button.test.tsx`:**
- QuickActionSheet モック
- aria-label "クイックアクション" の存在確認

---

## 実装順序

1. **Phase A**: `side-menu.tsx` 編集（5分）
2. **Phase C**: `fab-button.tsx` 新規作成 + `layout.tsx` 編集（5分）
3. **Phase B-1**: `bottom-nav.tsx` 書き換え（10分）
4. **Phase B-2**: `suggestions/page.tsx` 実ページ化（5分）
5. **Phase B-3**: `add/community/page.tsx` ヘッダー変更（2分）
6. **Phase B-4**: テスト更新（5分）
7. **検証**: `npx vitest run` + `npx tsc --noEmit`
8. **docs 更新**: plan保存 + README + backlog

---

## 検証

1. `npx vitest run` — 全テストパス
2. `npx tsc --noEmit` — 型エラーなし
3. 手動テスト:
   - ボトムナビ5タブ: 各タップ → 正しいページ遷移
   - センタータブ: active時グラデーション、inactive時薄紫背景
   - FAB: タップ → QuickActionSheet展開 → 5アクション全て動作
   - サイドメニュー: 4+1項目、ボトムナビとの重複ゼロ
   - カレンダー: メニュー内リンク → beauty-log カレンダービュー
   - `/suggestions`: want list表示、+ボタン → add画面 → 戻る正常
   - `/add/community`: MainTabHeader表示、ハンバーガー動作
   - 詳細ページ(`/scan/confirm`等): ナビ+FAB非表示確認
