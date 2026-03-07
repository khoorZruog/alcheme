# FEAT-002(残存): SNS 導線改善

| | |
|---|---|
| **Date** | 2026-02-21 |
| **Status** | Completed |
| **Related** | FEAT-002, Phase 2.5A navigation restructure |

## Context

フィード・フォロー機能は API + Hook + UI が全て実装済みだが、フィードがサイドメニューからしかアクセスできず発見性が極めて低い。業界標準（TikTok/Instagram/LIPS）ではフィードはボトムナビの最重要タブに配置されている。

## アプローチ

Recipe タブを Feed タブに置換。理由:
- ソーシャル投稿 = 公開されたレシピ（`POST /api/social/posts` はレシピから投稿を作成）
- レシピ作成は QuickActionSheet の「レシピ作成」から引き続きアクセス可能
- レシピ一覧はサイドメニュー + Feed 内の「レシピ」タブで引き続きアクセス可能

```
変更前: AI美容部員 | My Cosme | [+] | Recipe  | マイページ
変更後: AI美容部員 | My Cosme | [+] | フィード | マイページ
```

## 実装バッチ

### Batch 1: ボトムナビ + サイドメニュー再構成
- `components/bottom-nav.tsx` — Recipe → Feed タブ（Newspaper アイコン）
- `components/side-menu.tsx` — フィード → レシピ一覧リンク
- `app/(main)/feed/page.tsx` — PageHeader → MainTabHeader

### Batch 2: Feed ページに「レシピ」タブ追加
- `app/(main)/feed/page.tsx` — 3タブ（みんな/フォロー中/レシピ）+ 条件付き SWR + レシピグリッド

### Batch 3: フォロー/フォロワーリスト
- `app/api/social/users/[userId]/followers/route.ts` — GET: フォロワー一覧 API
- `app/api/social/users/[userId]/following/route.ts` — GET: フォロー中一覧 API
- `hooks/use-follow-list.ts` — SWR フック
- `components/follow-user-card.tsx` — ユーザーカード（フォロー操作付き）
- `app/(main)/social/[userId]/followers/page.tsx` — フォロワーリストページ
- `app/(main)/social/[userId]/following/page.tsx` — フォロー中リストページ
- `components/profile/profile-hero.tsx` — フォロー数/フォロワー数をタップ可能リンクに
- `app/(main)/mypage/page.tsx` — userId prop 追加
- `app/(main)/profile/[userId]/page.tsx` — userId prop 追加

### Batch 4: フィード上のフォロー操作 + バグ修正
- `app/api/social/posts/route.ts` — `user_filter` クエリパラメータ対応追加（バグ修正）
- `components/feed-post-card.tsx` — `isFollowing?`, `onFollow?`, `isOwnPost?` props + フォローミニボタン
- `app/(main)/feed/page.tsx` — フォロー状態管理 + handleFollow コールバック

### Batch 5: テスト + ドキュメント
- `__tests__/unit/components/bottom-nav.test.tsx` — フィードタブ表示確認（6テスト）
- `__tests__/unit/components/profile-hero.test.tsx` — タップ可能スタッツ確認（8テスト）
- `__tests__/unit/hooks/use-follow-list.test.ts` — フォローリストフック（5テスト）
- `__tests__/unit/components/feed-post-card.test.tsx` — フォローボタンテスト4件追加（計14テスト）

## 変更ファイル一覧

### 新規ファイル (10)
| ファイル | 説明 |
|---------|------|
| `app/api/social/users/[userId]/followers/route.ts` | フォロワー一覧 API |
| `app/api/social/users/[userId]/following/route.ts` | フォロー中一覧 API |
| `app/(main)/social/[userId]/followers/page.tsx` | フォロワーリストページ |
| `app/(main)/social/[userId]/following/page.tsx` | フォロー中リストページ |
| `hooks/use-follow-list.ts` | フォローリストフック |
| `components/follow-user-card.tsx` | ユーザーカード（フォロー操作付き） |
| `__tests__/unit/components/bottom-nav.test.tsx` | ボトムナビテスト |
| `__tests__/unit/components/profile-hero.test.tsx` | プロフィールヒーローテスト |
| `__tests__/unit/hooks/use-follow-list.test.ts` | フォローリストフックテスト |
| `docs/plans/2026-02-21_FEAT-002_sns-navigation.md` | 本計画書 |

### 既存修正ファイル (8)
| ファイル | 変更内容 |
|---------|---------|
| `components/bottom-nav.tsx` | Recipe → フィード タブ |
| `components/side-menu.tsx` | フィード → レシピ一覧 リンク |
| `app/(main)/feed/page.tsx` | MainTabHeader + レシピタブ + フォロー操作 |
| `components/profile/profile-hero.tsx` | タップ可能スタッツ（userId prop） |
| `app/(main)/mypage/page.tsx` | userId prop 追加 |
| `app/(main)/profile/[userId]/page.tsx` | userId prop 追加 |
| `components/feed-post-card.tsx` | フォローボタン追加 |
| `app/api/social/posts/route.ts` | user_filter バグ修正 |

## 検証

- `npx tsc --noEmit` — 型エラーなし（pre-existing テストファイルエラー2件のみ）
- `npx vitest run` — 38ファイル、223テスト全パス
