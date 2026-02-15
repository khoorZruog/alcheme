# Week 3: フロントエンド画面実装 — Implementation Plan

**Status: COMPLETED** (2026-02-14)

## Context
Week 2 completed all agent coordination + shared UI components. Week 3 builds every user-facing screen, BFF API routes, custom hooks, and PWA manifest so the app is usable on mobile.

## Execution Order (8 Batches)

---

### Batch 0: Prerequisites — shadcn/ui + PWA
**Install missing shadcn/ui wrappers:**
```
textarea, dialog, sheet, tabs, progress, skeleton, toast,
toggle-group, dropdown-menu, scroll-area, separator, avatar, drawer
```

**PWA:**
- Create `public/manifest.json` (name: "alche:me", start_url: "/chat", theme: #C9A96E)
- Create `public/icons/` with placeholder 192x192 and 512x512 PNGs

---

### Batch 1: Types + Hooks + API Client

**Modify existing types:**
- `types/inventory.ts` — add `rarity?: "SSR"|"SR"|"R"|"N"`
- `types/recipe.ts` — add optional `feedback` field
- `types/chat.ts` — add `isStreaming`, SSE event types

**Create:**
- `types/user.ts` — UserProfile interface (extends AlchemeUserProfile)
- `lib/api/fetcher.ts` — SWR fetcher helper

**Create 4 hooks:**
- `hooks/use-inventory.ts` — SWR + `/api/inventory`, category filter, client-side search
- `hooks/use-chat.ts` — local messages state + SSE streaming via ReadableStream
- `hooks/use-recipes.ts` — SWR + `/api/recipes`
- `hooks/use-recipe.ts` — SWR + `/api/recipes/{id}`, includes `submitFeedback()`

---

### Batch 2: BFF API Routes (6 new + 1 fix)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/inventory/scan` | POST | **Fix**: Replace `AgentClient` with mock (will connect to ADK Agent Engine in Week 4) |
| `/api/inventory/confirm` | POST | Batch-write confirmed scan items to Firestore |
| `/api/chat` | POST | SSE streaming (mock responses for Phase 1, keyword-driven recipe cards) |
| `/api/recipes` | GET | List user recipes from Firestore |
| `/api/recipes/[recipeId]` | GET | Single recipe detail |
| `/api/recipes/[recipeId]/feedback` | POST | Save rating (liked/neutral/disliked) |
| `/api/users/me` | GET/PATCH | Read/update user profile |

All routes follow existing pattern: `getAuthUserId()` → `adminDb` → `NextResponse.json()`.

**Note:** Scan API は Design Doc §2 の BFF パターンに従い、最終的には ADK Agent Engine/Cloud Run 経由で Inventory Agent を呼び出す構成。Week 3 ではモック実装とし、Week 4 で Agent Engine に接続する。

---

### Batch 3: Custom Components (11 new)

**Chat:** `chat-message.tsx`, `chat-input.tsx`, `quick-action-chips.tsx`
**Scan:** `scan-camera.tsx`, `appraisal-card.tsx`, `appraisal-effect.tsx`
**Recipe:** `recipe-card-inline.tsx`, `recipe-step-card.tsx`, `recipe-feedback.tsx`
**Shared:** `item-edit-sheet.tsx`, `cosme-card-mini.tsx`

---

### Batch 4: Landing + Onboarding

**Modify `app/page.tsx`** — Replace boilerplate with alche:me landing (gold logo, tagline, Google/Email login buttons)

**Create `app/(auth)/onboarding/page.tsx`** — 3-step wizard:
1. Name input
2. Beauty profile (skinType, skinTone, personalColor — all skippable)
3. First scan prompt (→ /scan or skip to /chat)

**Modify `middleware.ts`** — Add `/onboarding` to auth routes

---

### Batch 5: Inventory + Scan Pages (4 pages)

| Page | File | Key Components |
|------|------|----------------|
| 在庫一覧 | `app/(main)/inventory/page.tsx` | CategoryFilter, CosmeCard grid, search Dialog, EmptyState |
| アイテム詳細 | `app/(main)/inventory/[itemId]/page.tsx` | PageHeader, StatBarGroup, RarityBadge, ItemEditSheet |
| スキャン | `app/(main)/scan/page.tsx` | ScanCamera, "鑑定スタート" button |
| 鑑定確認 | `app/(main)/scan/confirm/page.tsx` | AppraisalEffect → AppraisalCard list → confirm register |

Scan result passed via `sessionStorage` between scan → confirm pages.

---

### Batch 6: Chat + Recipe Pages (3 pages)

| Page | File | Key Components |
|------|------|----------------|
| チャット | `app/(main)/chat/page.tsx` | ChatMessage, ChatInput, QuickActionChips, ScrollArea |
| レシピ一覧 | `app/(main)/recipes/page.tsx` | Recipe summary cards, EmptyState |
| レシピ詳細 | `app/(main)/recipes/[recipeId]/page.tsx` | RecipeStepCard, RecipeFeedback, collapsible thinking |

---

### Batch 7: Settings Page

**Create `app/(main)/settings/page.tsx`** — Sections: basic info, beauty profile, preferences, agent theme (3-card toggle), SNS links, privacy, data stats, logout.

---

### Batch 8: Integration + Polish

- **Modify `app/(main)/layout.tsx`** — Conditional BottomNav hiding (hide on scan/detail pages) + onboarding redirect check
- **Modify `app/layout.tsx`** — Add `<Toaster />` for toast notifications

---

## Key Architecture Decisions

1. **Chat SSE**: Use `fetch` + `ReadableStream` reader (not EventSource) — POST needs body
2. **Scan result passing**: `sessionStorage` between /scan → /scan/confirm
3. **BottomNav hiding**: Pathname-based conditional in main layout (not route group restructure)
4. **Onboarding guard**: Check `profile?.onboardingCompleted` in main layout, redirect to /onboarding if false (no Firestore in middleware)
5. **Mock chat**: SSE returns mock streaming responses; keyword detection triggers recipe cards. Swap to real Agent Engine in Week 4
6. **Scan API**: Week 3 はモック実装。Design Doc §2 BFF パターンに従い、Week 4 で ADK Agent Engine 経由に接続

## File Count
- **~36 new files** (pages, components, hooks, API routes, PWA)
- **~13 shadcn/ui components** (auto-generated)
- **~9 modified files** (types, layout, middleware, landing page, scan route)

## Verification
- `npx tsc --noEmit` after each batch to catch type errors
- Manual browser test of each screen after batch completion
- Verify middleware redirects (unauthenticated → /login, authenticated → /chat)
- Test SSE chat streaming in browser DevTools Network tab
