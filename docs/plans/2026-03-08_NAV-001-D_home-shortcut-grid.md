# Phase D: ホーム画面 — LIPS風アイコングリッド + フィード統合

## Context

NAV-001 でボトムナビの「ホーム」タブが `/feed` に紐付いた。現状のフィードページはタイムライン表示のみで、LIPS のようなアイコンショートカットグリッドがない。Phase D では、ホーム画面のファーストビューにアイコングリッドを追加し、主要機能への導線を強化する。

**ゴール**:
- ホーム画面にLIPS風の横スクロール・アイコングリッドを追加
- タイトルを「フィード」→「ホーム」に変更
- タブ名「みんな」→「おすすめ」に変更（プラットフォーム感UP）

---

## 変更ファイル一覧

| ファイル | 種別 |
|---------|------|
| `components/home-shortcut-grid.tsx` | **新規** |
| `app/(main)/feed/page.tsx` | 変更 |
| `__tests__/unit/components/home-shortcut-grid.test.tsx` | **新規** |

---

## 1. 新規: `components/home-shortcut-grid.tsx`

LIPS風の横スクロール・アイコンショートカット。6つの主要機能へのワンタップ導線。

**ショートカット一覧（6個）:**

| アイコン | ラベル | 遷移先 | グラデーション |
|---------|--------|--------|--------------|
| Sparkles | AI診断 | /chat | neon-accent → magic-pink |
| Crown | ランキング | /add/community | alchemy-gold → alchemy-gold-light |
| BookOpen | レシピ | /recipes | magic-purple → neon-accent |
| Camera | スキャン | /scan | magic-pink → neon-accent |
| CalendarHeart | メイク日記 | /beauty-log | neon-accent → magic-purple |
| LayoutGrid | My Cosme | /inventory | alchemy-gold-light → magic-pink |

**デザイン仕様:**
- 横スクロール: `flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3`
- 各アイテム: `shrink-0 flex flex-col items-center gap-1.5 w-[60px]`
- アイコン円: `w-12 h-12 rounded-full` + グラデーション背景 + 白アイコン
- ラベル: `text-[10px] font-medium text-text-muted`
- ホバー: `btn-squishy` アニメーション

```typescript
"use client";

import Link from "next/link";
import {
  Sparkles, Crown, BookOpen, Camera, CalendarHeart, LayoutGrid,
} from "lucide-react";

const SHORTCUTS = [
  {
    icon: Sparkles,
    label: "AI診断",
    href: "/chat",
    gradient: "from-neon-accent to-magic-pink",
  },
  {
    icon: Crown,
    label: "ランキング",
    href: "/add/community",
    gradient: "from-alchemy-gold to-alchemy-gold-light",
  },
  {
    icon: BookOpen,
    label: "レシピ",
    href: "/recipes",
    gradient: "from-magic-purple to-neon-accent",
  },
  {
    icon: Camera,
    label: "スキャン",
    href: "/scan",
    gradient: "from-magic-pink to-neon-accent",
  },
  {
    icon: CalendarHeart,
    label: "メイク日記",
    href: "/beauty-log",
    gradient: "from-neon-accent to-magic-purple",
  },
  {
    icon: LayoutGrid,
    label: "My Cosme",
    href: "/inventory",
    gradient: "from-alchemy-gold-light to-magic-pink",
  },
] as const;

export function HomeShortcutGrid() {
  return (
    <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3">
      {SHORTCUTS.map(({ icon: Icon, label, href, gradient }) => (
        <Link
          key={href}
          href={href}
          className="shrink-0 flex flex-col items-center gap-1.5 w-[60px] btn-squishy"
        >
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}
          >
            <Icon size={20} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-[10px] font-medium text-text-muted text-center leading-tight">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}
```

---

## 2. 変更: `app/(main)/feed/page.tsx`

### 2a. ヘッダータイトル変更（L98）

```diff
- <MainTabHeader title="フィード" />
+ <MainTabHeader title="ホーム" subtitle="HOME" />
```

### 2b. アイコングリッド挿入（L98-99の間）

```diff
  <MainTabHeader title="ホーム" subtitle="HOME" />
+
+ <HomeShortcutGrid />

  {/* Tab bar */}
```

import追加:
```diff
+ import { HomeShortcutGrid } from "@/components/home-shortcut-grid";
```

### 2c. タブ名変更（L110）

```diff
- みんな
+ おすすめ
```

---

## 3. 新規: `__tests__/unit/components/home-shortcut-grid.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeShortcutGrid } from "@/components/home-shortcut-grid";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("HomeShortcutGrid", () => {
  it("renders 6 shortcut links", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
  });

  it("includes AI診断 link to /chat", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/chat");
  });

  it("includes ランキング link to /add/community", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/add/community");
  });

  it("renders all shortcut labels", () => {
    render(<HomeShortcutGrid />);
    expect(screen.getByText("AI診断")).toBeDefined();
    expect(screen.getByText("ランキング")).toBeDefined();
    expect(screen.getByText("レシピ")).toBeDefined();
    expect(screen.getByText("スキャン")).toBeDefined();
    expect(screen.getByText("メイク日記")).toBeDefined();
    expect(screen.getByText("My Cosme")).toBeDefined();
  });
});
```

---

## 検証

1. `npx vitest run` — 全テストパス（新規テスト含む）
2. `npx tsc --noEmit` — 型エラーなし
3. 手動テスト:
   - ホーム画面: 6つのアイコンが横スクロールで表示
   - 各アイコンタップ → 正しいページに遷移
   - グラデーション色が正しく適用
   - タイトル「ホーム」/ subtitle「HOME」表示
   - タブ名「おすすめ」に変更
   - 横スクロール時にスクロールバー非表示
