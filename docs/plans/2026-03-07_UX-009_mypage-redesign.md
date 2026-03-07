# UX-009: マイページ全体リデザイン + ナビゲーション修正

## Context

手動テストで以下の問題が発覚:
1. サイドメニューの「メイク日記」と「カレンダー」が同じ画面に見える（カレンダーは日記ページ内のトグルで既に実装済み）
2. メイク日記・設定ページの戻るボタンが常に `/mypage` に遷移し、実際の直前ページに戻れない
3. マイページのレイアウトが冗長（BeautyLogPreview が独立セクション、CategoryBadges がタブ外に配置）

**競合リサーチ結果**: LIPS・@cosme・Instagram・Day One・Apple Journalを調査。共通パターン:
- カレンダーは日記の中のビューとして統合（Day One/Apple Journal方式）
- マイページはコンパクトなプロフィール + コンテンツタブが主役（Instagram方式）
- タブ内にコンテキスト依存のサブコンテンツを配置

---

## 変更ファイル一覧

| ファイル | 種別 | 変更内容 |
|---------|------|---------|
| `components/side-menu.tsx` | 変更 | 「カレンダー」エントリ削除 |
| `app/(main)/beauty-log/page.tsx` | 変更 | `backHref="/mypage"` 削除 |
| `app/(main)/settings/page.tsx` | 変更 | `backHref="/mypage"` 削除 |
| `app/(main)/mypage/page.tsx` | 変更 | レイアウト再構成 |
| `__tests__/unit/components/side-menu.test.tsx` | 新規 | サイドメニュー3項目テスト |

---

## 1. サイドメニュー: 「カレンダー」削除

**ファイル**: `components/side-menu.tsx`

カレンダーは `beauty-log` ページ内のヘッダートグル（タイムライン/カレンダー切替）で既に実装済み。サイドメニューに別エントリは不要。

```diff
 const MENU_ITEMS = [
   { icon: LayoutGrid, label: "My Cosme", href: "/inventory" },
   { icon: BookOpen, label: "レシピ", href: "/recipes" },
   { icon: CalendarHeart, label: "メイク日記", href: "/beauty-log" },
-  { icon: Calendar, label: "カレンダー", href: "/beauty-log?view=calendar" },
 ] as const;
```

- `Calendar` を import から削除

---

## 2. 戻るボタン: `backHref` 削除

`PageHeader` の fallback ロジック: `onBack` > `backHref` > `router.back()`。`backHref` を削除すれば自動的に `router.back()` にフォールバック。

### 2a. `app/(main)/beauty-log/page.tsx` (L198)

```diff
- <PageHeader title="メイク日記" backHref="/mypage" rightElement={...} />
+ <PageHeader title="メイク日記" rightElement={...} />
```

### 2b. `app/(main)/settings/page.tsx` (L53)

```diff
- <PageHeader title="設定" backHref="/mypage" />
+ <PageHeader title="設定" />
```

---

## 3. マイページ レイアウト再構成

**ファイル**: `app/(main)/mypage/page.tsx`

### 現状のレイアウト (10セクション)
```
MainTabHeader
ProfileHero
ProfileTags
ProfileBio
ProfileActions          ← 順序変更
ProfileSocialLinks      ← 順序変更
BestCosmeSection
BeautyLogPreview        ← 独立セクション → タブ内へ移動
ProfileContentTabs
ProfileCategoryBadges   ← タブ外 → posts タブ内へ移動
ProfileContentGrid
```

### 新レイアウト (7セクション)
```
MainTabHeader
ProfileHero
ProfileTags
ProfileBio
  → ProfileSocialLinks  ← Bio直後に移動（自然な流れ）
  → ProfileActions       ← SocialLinks後に移動
BestCosmeSection
ProfileContentTabs (sticky)  ← スティッキー化
  ├─ posts:      CategoryBadges + ContentGrid
  ├─ recipes:    ContentGrid
  └─ beautyLogs: BeautyLogPreview + ContentGrid
```

### 主な変更点

**A. セクション順序変更**: Bio → SocialLinks → Actions（自然な情報の流れ）

```diff
  <ProfileBio bio={bio} />
- <ProfileActions isOwnProfile completionRate={completionRate} />
  <ProfileSocialLinks socialLinks={socialLinks} />
+ <ProfileActions isOwnProfile completionRate={completionRate} />
```

**B. BeautyLogPreview を独立セクションから削除**（タブ内へ移動）

```diff
  <BestCosmeSection items={bestCosme} onEdit={() => setBestCosmeOpen(true)} />
- <BeautyLogPreview />
  <ProfileContentTabs ... />
```

**C. ProfileContentTabs をスティッキー化**

```diff
- <ProfileContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
+ <div className="sticky top-14 z-40 bg-alcheme-cream/90 backdrop-blur-sm">
+   <ProfileContentTabs activeTab={activeTab} onTabChange={setActiveTab} />
+ </div>
```

**D. タブ条件付きコンテンツ表示** (`currentGrid` 変数を廃止)

```diff
- <ProfileCategoryBadges categories={categories} />
- <ProfileContentGrid items={currentGrid} emptyMessage={emptyMessages[activeTab]} />
+ {activeTab === "posts" && (
+   <>
+     <ProfileCategoryBadges categories={categories} />
+     <ProfileContentGrid items={postsGrid} emptyMessage={emptyMessages.posts} />
+   </>
+ )}
+ {activeTab === "recipes" && (
+   <ProfileContentGrid items={recipesGrid} emptyMessage={emptyMessages.recipes} />
+ )}
+ {activeTab === "beautyLogs" && (
+   <>
+     <BeautyLogPreview />
+     <ProfileContentGrid items={beautyLogsGrid} emptyMessage={emptyMessages.beautyLogs} />
+   </>
+ )}
```

- `currentGrid` 変数削除
- `BeautyLogPreview` の SWR fetch は beautyLogs タブ選択時のみ発火（パフォーマンス向上）

---

## 4. テスト

### 新規: `__tests__/unit/components/side-menu.test.tsx`

```typescript
describe("SideMenu", () => {
  it("renders 3 main menu items (no Calendar)", () => {
    // verify MENU_ITEMS has exactly 3 entries
    // verify "カレンダー" is NOT in rendered output
    // verify "メイク日記" IS in rendered output
  });
});
```

---

## 検証

1. `npx vitest run` — 全テストパス
2. `npx tsc --noEmit` — 型エラーなし
3. 手動テスト:
   - サイドメニュー: 3項目（My Cosme, レシピ, メイク日記）のみ表示
   - メイク日記ページ: 戻るボタン → 直前のページに戻る
   - 設定ページ: 戻るボタン → 直前のページに戻る
   - マイページ posts タブ: CategoryBadges + Grid 表示
   - マイページ recipes タブ: Grid のみ表示
   - マイページ beautyLogs タブ: BeautyLogPreview + Grid 表示
   - ContentTabs: スクロール時にスティッキー固定
   - プロフィール順序: Bio → SocialLinks → Actions
