# Week 4: 統合テスト + デプロイ — Implementation Plan

**Status: COMPLETED (2026-02-14, Phase 4 UI polish 2026-02-15)**

## Context

Week 3 completed all frontend pages, mock BFF APIs, hooks, and components. ADK agents (concierge, inventory, alchemist, product_search) are confirmed working locally via `adk run`. Week 4 connects the real agents to the frontend, adds tests, and deploys to Cloud Run.

**Week 3 carryover:**
- Scan API → real agent connection (currently mock returning 3 hardcoded items)
- Chat API → real agent SSE connection (currently mock with keyword detection)
- Service Worker registration

**Quality Gates (all 9 must pass for release — test-scenarios §3):**
- QG-1: Hallucination Rate = 0% (**MOST CRITICAL**)
- QG-2: Recipe Success ≥ 95%
- QG-3: Image Recognition ≥ 80% (sample_inventory.json 画像でカテゴリ・ブランド正答率)
- QG-4: P95 Response < 15s
- QG-5: API Error Rate < 1%
- QG-6: Auth works
- QG-7: Unit tests 100%
- QG-8: PWA Lighthouse ≥ 80 (non-blocker)
- QG-9: E2E flows pass

---

## Execution Order (7 Batches)

### Batch 0: Test Infrastructure + Agent Server Foundation

**Install test frameworks:**

`package.json` — Add devDeps + fix name:
- `vitest`, `@vitejs/plugin-react`, `jsdom`, `@playwright/test`
- Fix `name` from `nextjs-firebase-ai-boilerplate` → `alcheme`
- Add scripts: `"test": "vitest run"`, `"test:e2e": "playwright test"`

`agent/pyproject.toml` — Add runtime + dev deps:
- Runtime: `fastapi`, `uvicorn[standard]`
- Dev: `httpx`, `pytest-mock`

**Create config files:**

| File | Purpose |
|------|---------|
| `vitest.config.ts` | jsdom env, `@/` alias, `__tests__/**/*.test.{ts,tsx}` |
| `playwright.config.ts` | Mobile viewport 375x812, `webServer: npm run dev`, `__tests__/e2e/` |
| `__tests__/setup.ts` | Global mocks (next/headers, firebase-admin) |
| `agent/tests/conftest.py` | Mock Firestore fixtures, mock ToolContext factory |

**Verification:** `npm install && npx vitest run --passWithNoTests` + `cd agent && pip install -e ".[dev]"`

---

### Batch 1: Agent FastAPI Server + Dockerfile

**The critical bridge between Next.js BFF and Python agents.**

**Create `agent/server.py`** — FastAPI wrapping ADK Runner:

```
POST /scan   — image → inventory_agent → structured InventoryItem[]
POST /chat   — message → concierge (SSE streaming text_delta/recipe_card/done)
GET  /health — health check
```

Key implementation:
- `Runner` + `InMemorySessionService` (sufficient for 50 users in Phase 1)
- `/scan`: Accept `{image_base64, image_mime_type, user_id}`, set `state["user_id"]` on session, send image as `Part(inline_data=Blob(...))`, parse agent output for structured items
- `/chat`: Accept `{message, user_id, session_id?, image_base64?}`, use `runner.run_async()`, stream events as SSE (`text_delta` for text chunks, `recipe_card` for JSON recipe, `done` at end)
- API key auth via `X-API-Key` header (env: `AGENT_API_KEY`)

**Create `agent/Dockerfile`:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY alcheme/ alcheme/
COPY server.py .
EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Create `agent/.dockerignore`:** `__pycache__`, `*.egg-info`, `tests/`, `.env`, `.venv`

**Verification:** `cd agent && uvicorn server:app --port 8080` + `curl localhost:8080/health`

---

### Batch 2: BFF → Real Agent Connection

**Replace mocks with real agent calls.**

**Create `lib/api/agent-client.ts`** — Reusable agent HTTP client:
```typescript
export const AGENT_URL = process.env.ADK_AGENT_URL || 'http://localhost:8080';
export const AGENT_API_KEY = process.env.AGENT_API_KEY || '';
export async function callAgent(endpoint, body) { /* fetch with timeout + API key */ }
export async function callAgentStream(endpoint, body) { /* streaming variant */ }
```

**Modify `app/api/inventory/scan/route.ts`:**
- Remove `generateMockScanResult()` and all mock data
- Call `callAgent('/scan', { image_base64, image_mime_type, user_id })`
- Parse response, map to `InventoryItem[]`, apply `calculateRarity()` as fallback
- 90s timeout (image analysis via Gemini Vision requires longer processing), 503 on agent unavailable

**Modify `app/api/chat/route.ts`:**
- Remove `getMockResponse()` and `MOCK_RECIPE`
- Call `callAgentStream('/chat', { message, user_id, session_id: userId, ... })`
- Proxy SSE stream from agent → client (forward each event)
- Error recovery: if agent stream fails, send error event

**Add to `.env.local`:**
```
ADK_AGENT_URL=http://localhost:8080
AGENT_API_KEY=dev-secret-key
```

**Verification:** Start agent (`uvicorn server:app --port 8080`) + Next.js (`npm run dev`), test scan with real image, test chat with real messages. `npx tsc --noEmit`.

---

### Batch 3: Python Unit Tests + Hallucination Detection

**Priority: QG-1 (Hallucination = 0%) + QG-7 (Unit tests 100%)**

| Test File | Scenarios | Coverage |
|-----------|-----------|----------|
| `agent/tests/test_inventory_tools.py` | UT-P01~P10: generate_item_id, get_inventory, search, filter, add, validate_recipe_items | All inventory_tools.py functions |
| `agent/tests/test_recipe_tools.py` | UT-P11~P14: save_recipe, get_recent_recipes | All recipe_tools.py functions |
| `agent/tests/test_schemas.py` | UT-P15~P18: Pydantic model validation (valid/invalid data) | inventory.py + recipe.py schemas |
| `agent/tests/test_rakuten_api.py` | UT-P21~P23: success/empty/timeout/missing env | rakuten_api.py |
| `agent/tests/test_hallucination.py` | **AGT-09: CRITICAL** — Run alchemist with test inventory, assert ALL item_ids in recipe exist in inventory | QG-1 |
| `agent/tests/test_server.py` | /health, /scan, /chat SSE format, missing API key → 401 | server.py |

**`test_hallucination.py` key implementation:**
```python
def assert_no_hallucination(recipe_output, inventory_ids: set[str]):
    for step in recipe_output["steps"]:
        assert step["item_id"] in inventory_ids, f"HALLUCINATION: {step['item_id']}"

# Test with real Gemini API against sample_inventory.json (15 items)
# Multiple scenarios: office makeup, Korean style, insufficient inventory
```

**Verification:** `cd agent && pytest tests/ -v --tb=short`

---

### Batch 4: TypeScript Unit Tests + E2E Tests

**QG-7 (TS side) + QG-9 (E2E flows)**

**Unit tests (`__tests__/unit/`):**

| Test File | Scenarios |
|-----------|-----------|
| `types.test.ts` | UT-F01~F03: Type compile checks |
| `components/cosme-card.test.tsx` | UT-F09~F10: Render with props, rarity badge |
| `components/rarity-badge.test.tsx` | UT-F11: All 4 variants |
| `components/stat-bar.test.tsx` | UT-F12: Width calculation |
| `components/recipe-feedback.test.tsx` | UT-F13: 3 buttons + callback |
| `components/category-filter.test.tsx` | UT-F15: Tab click callback |
| `hooks/use-inventory.test.ts` | UT-F18~F19: SWR fetch + filter |
| `hooks/use-chat.test.ts` | UT-F20~F21: SSE stream parsing |

**E2E tests (`__tests__/e2e/`):**

| Test File | Scenario | QG |
|-----------|----------|-----|
| `auth.spec.ts` | E2E-01: Login/signup/logout | QG-6 |
| `scan-register.spec.ts` | E2E-02: Upload → appraisal → register | QG-9 |
| `recipe-generation.spec.ts` | E2E-03: Chat → SSE stream → recipe card + hallucination check | QG-1, QG-9 |
| `inventory.spec.ts` | E2E-04: Category filter, card → detail | QG-9 |
| `recipe-detail.spec.ts` | E2E-05: Recipe detail + feedback | QG-9 |

**Security tests (`__tests__/security/`):**

| Test File | Scenario | Coverage |
|-----------|----------|----------|
| `access-control.test.ts` | SEC-01: 未認証リクエスト → 401 (全APIルート) | Auth guard |
| `cross-user.test.ts` | SEC-02: 他ユーザー在庫へのアクセス不可 (Firestore rules) | Data isolation |

**Verification:** `npx vitest run` + `npx playwright test`

---

### Batch 5: Service Worker + Docker Builds

**Service Worker (`public/sw.js`):**
- Cache-first for static assets, network-first for `/api/` routes
- `CACHE_NAME = 'alcheme-v1'`

**`lib/register-sw.ts`** — Registration helper (production only)

**Modify `app/layout.tsx`** — Add SW registration component

**Docker builds:**

**Modify `Dockerfile` (frontend):**
- Add `ARG` for `NEXT_PUBLIC_FIREBASE_*` build-time env vars

**Modify `cloudbuild.yaml`** — Full rewrite:
- Build frontend image → `asia-northeast1-docker.pkg.dev/$PROJECT_ID/alcheme/web:$SHORT_SHA`
- Build agent image → `asia-northeast1-docker.pkg.dev/$PROJECT_ID/alcheme/agent:$SHORT_SHA`
- Deploy agent to Cloud Run (`alcheme-agent`, port 8080, `--no-allow-unauthenticated`, 1Gi memory)
- Deploy frontend to Cloud Run (`alcheme-web`, port 3000, `--allow-unauthenticated`, `ADK_AGENT_URL` set to agent URL)
- Region: `asia-northeast1`

**Create `.dockerignore`:** `node_modules`, `.next`, `.git`, `agent/`, `__tests__/`, `docs/`

**Verification:** `docker build -t alcheme-web .` + `docker build -t alcheme-agent ./agent`

---

### Batch 6: Cloud Run Deploy + QG Verification + Docs Update

**GCP Setup (scripted):**
```bash
gcloud artifacts repositories create alcheme --repository-format=docker --location=asia-northeast1
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

**Create `scripts/deploy.sh`:**
1. Build + push images to Artifact Registry
2. Deploy `alcheme-agent` to Cloud Run (8080, 1Gi, max 3 instances)
3. Deploy `alcheme-web` to Cloud Run (3000, 512Mi, max 5 instances, `ADK_AGENT_URL` → agent URL)

**Quality Gate verification (全9ゲート):**
| Gate | Method |
|------|--------|
| QG-1 | `pytest tests/test_hallucination.py` — all pass |
| QG-2 | AGT-06~10 pass rate ≥ 95% |
| QG-3 | sample_inventory 画像でカテゴリ・ブランド正答率 ≥ 80% |
| QG-4 | Manual: scan < 5s, chat < 15s |
| QG-5 | API テスト error rate < 1% |
| QG-6 | E2E-01 auth test passes |
| QG-7 | `vitest run` + `pytest tests/` — 100% pass |
| QG-8 | Lighthouse PWA score ≥ 80 (non-blocker) |
| QG-9 | `playwright test` — all E2E pass |

**β テスター準備:**
- Cloud Run デフォルト URL（*.run.app）で Phase 1 運用（カスタムドメインは Phase 2）
- Create `docs/beta-guide.md` — アクセスURL、テストアカウント作成手順、Phase 1 制限事項、フィードバック方法

**Update docs:**
- `docs/CLAUDE_CODE_INSTRUCTIONS_v1_3.md` — Mark Week 4 tasks `[x]`
- `docs/alcheme_PRD_v4.md` — Phase 1 status → `✅ 完了`
- Create `docs/plans/week4_implementation_plan.md`

---

## Key Architecture Decisions

1. **Agent deployment: Cloud Run** (not Agent Engine) — simpler for Phase 1 MVP, full API control. Agent Engine migration in Phase 2.
2. **Agent server: Custom FastAPI** wrapping ADK `Runner` + `InMemorySessionService` — direct control over endpoints and SSE format
3. **BFF ↔ Agent auth: API key** (`X-API-Key` header) — simple for Phase 1. Upgrade to IAM tokens in Phase 2.
4. **Testing: Vitest + Playwright + pytest** — lightweight, good Next.js/Python support
5. **Session management: InMemorySessionService** — sufficient for 50 users. Upgrade to Firestore-backed in Phase 2.
6. **Critical path:** Batch 0 → 1 → 2 → 3 → 5 → 6 (Batches 3/4 can run in parallel with 1/2)

## File Count
- **~30 new files** (agent server, tests, configs, SW, deploy scripts)
- **~8 modified files** (scan route, chat route, package.json, Dockerfile, cloudbuild, layout, pyproject.toml, docs)

## Verification
- `npx tsc --noEmit` after each batch
- `pytest tests/ -v` after Python changes
- `npx vitest run` after TS test changes
- `npx playwright test` for E2E
- Manual browser test: scan with real image, chat with real messages
- `curl` deployed Cloud Run health endpoints

---

## Phase 3–4: UI Polish (2026-02-15)

Phase 3 と Phase 4 で以下の UI 改善を実施:

### Phase 3 (完了)
| # | 変更 | ファイル |
|---|------|---------|
| 1 | スキャンAPIタイムアウト 30s → 90s | `lib/api/agent-client.ts` |
| 2 | ピルボタン選択色 `bg-neon-accent` → `bg-text-ink` | `basic-info-section.tsx`, `beauty-profile-section.tsx` |
| 3 | 誕生日テキスト入力 → `<input type="date">` | `basic-info-section.tsx` |
| 4 | 設定ページ階層化（LIPS風リスト + 編集サブページ） | `settings/page.tsx` + 5 edit pages |
| 5 | 公開プロフィールページ新設 | `settings/profile/page.tsx` |

### Phase 4 (完了)
| # | 変更 | ファイル |
|---|------|---------|
| 1 | **Tailwind v4 カラーシステム修正** — `@theme` に全カスタムカラー登録（根本原因: `tailwind.config.js` が無視されていた） | `app/globals.css` |
| 2 | プライバシーセクション削除 | `settings/page.tsx` |
| 3 | プロフィール完了度バッジ（`calcCompletionRate` 11項目） | `settings/utils.ts`, `settings/page.tsx` |
| 4 | プロフィール画像アップロード（Firebase Storage, 256px JPEG 0.85） | `_components/avatar-upload.tsx` |
| 5 | `photoURL` フィールド追加 | `types/user.ts`, `use-settings-form.ts` |
| 6 | 公開プロフィールLIPS風行レイアウト | `settings/profile/page.tsx` |

### Phase 5: スキャン機能強化 (2026-02-15)

| # | 変更 | ファイル |
|---|------|---------|
| 1 | **カテゴリ/テクスチャ日本語化** — 英語5種→日本語5グループ + Appendix D 31アイテム種別 | `types/inventory.ts`, `lib/cosme-constants.ts` (新規), `agent/alcheme/constants.py` (新規), `agent/alcheme/schemas/inventory.py` |
| 2 | **PAO自動紐づけ** — item_type から使用期限(月数)を自動設定 | `lib/cosme-constants.ts`, `app/api/inventory/confirm/route.ts`, `app/api/inventory/route.ts` |
| 3 | **エージェントプロンプト改善** — 画像分析優先順序、テキスト読取最優先、「不明」削減 | `agent/alcheme/prompts/inventory.py`, `agent/alcheme/prompts/product_search.py` |
| 4 | **マルチ画像スキャン** — 最大4枚の画像から総合分析（正面/背面/側面/開封状態） | `components/scan-camera.tsx`, `app/(main)/scan/page.tsx`, `agent/server.py`, `app/api/inventory/scan/route.ts` |
| 5 | **鑑定結果キャンセル/スキップ** — 登録キャンセルボタン + 個別アイテム除外 | `app/(main)/scan/confirm/page.tsx` |
| 6 | **編集シート強化** — カテゴリ→item_type連動Select、テクスチャ日本語、PAO表示 | `components/item-edit-sheet.tsx` |
| 7 | **カテゴリフィルタ日本語化** | `components/category-filter.tsx`, `hooks/use-inventory.ts` |
| 8 | **後方互換** — 既存Firestoreデータの英語値→日本語ランタイム変換 | `app/api/inventory/route.ts` |
| 9 | **アイテム詳細PAO表示** — 種別・使用期限目安を情報グリッドに追加 | `app/(main)/inventory/[itemId]/page.tsx` |

### Phase 6: 楽天API商品検証 + 候補選択UI (2026-02-15)

| # | 変更 | ファイル |
|---|------|---------|
| 0 | **422バグ修正** — ScanRequest `list[dict]` → `list[dict[str, Any]]` + バリデーションエラーログ | `agent/server.py` |
| 1 | **楽天APIツール強化** — genreId修正(555086), formatVersion:2, 色情報抽出, `search_rakuten_for_candidates()` 追加 | `agent/alcheme/tools/rakuten_api.py` |
| 2 | **サーバー側楽天フォールバック** — エージェントが楽天未呼出時の自動検索・候補付与・単一候補自動適用 | `agent/server.py` |
| 3 | **型定義拡張** — `RakutenCandidate` 型, `price/product_url/rakuten_image_url/candidates` フィールド | `types/inventory.ts` |
| 4 | **BFF候補パススルー** — scan route で楽天データをフロントへ通過, source を「画像認識 + 楽天API」に | `app/api/inventory/scan/route.ts` |
| 5 | **Firestore保存時候補除去** — candidates 配列をDB保存前に削除 | `app/api/inventory/confirm/route.ts` |
| 6 | **候補選択UIコンポーネント** — 横スクロールカード、画像・価格・レビュー・色番表示、「該当なし」ボタン | `components/product-candidates.tsx` (新規) |
| 7 | **鑑定確認ページ統合** — 候補選択→アイテムデータ更新→自動確認、「該当なし」→手動編集、楽天クレジット | `app/(main)/scan/confirm/page.tsx` |
| 8 | **鑑定カード強化** — 楽天画像サムネイル, 価格表示, 色番号表示 | `components/appraisal-card.tsx` |
| 9 | **エージェントプロンプト** — 楽天API必須使用指示, 出力JSONに price/candidates 追加 | `agent/alcheme/prompts/inventory.py` |
| 10 | **アイテム詳細ページ** — 価格表示, color_code/name, 「楽天で見る」リンク, rakuten_image_url フォールバック | `app/(main)/inventory/[itemId]/page.tsx` |
| 11 | **在庫カード** — rakutenImageUrl/price props追加, 楽天画像フォールバック, 価格表示 | `components/cosme-card.tsx`, `app/(main)/inventory/page.tsx` |

### Phase 7: Phase 1 完成 (2026-02-15)

| # | 変更 | ファイル |
|---|------|---------|
| 1 | **リアルタイム進捗表示** — ADKイベントからツール/エージェント進捗を抽出しSSE `progress` イベントとして配信 | `agent/server.py`, `types/chat.ts`, `hooks/use-chat.ts`, `components/thinking-indicator.tsx`, `app/(main)/chat/page.tsx` |
| 2 | **おまかせテーマ提案** — 曖昧リクエスト時に3テーマ候補を提案してから調合に進む | `agent/alcheme/prompts/concierge.py` |
| 3 | **get_today_context ツール** — 日付/季節/曜日/未使用アイテム/最近のレシピをコンテキストとして提供 | `agent/alcheme/tools/context_tools.py` (新規), `agent/alcheme/agents/concierge.py` |
| 4 | **BottomNav レシピタブ** — 5番目のタブ追加でレシピ一覧へのナビゲーションを確保 | `components/bottom-nav.tsx` |
| 5 | **ADK Session State プロフィール注入** — Firestoreからユーザーのパーソナルカラー/肌質/名前/美容目標を取得しセッション状態に注入 | `agent/server.py` |
| 6 | **買い足し提案の楽天リンク** — Alchemistが在庫不足時に楽天検索URL付きの「プラスワン・マジック」提案 | `agent/alcheme/prompts/alchemist.py` |
| 7 | **レシピ保存フロー修正** — フィールド名正規化 (title→recipe_name, createdAt→created_at)、APIで両形式対応、レシピIDのSSEイベント注入 | `agent/alcheme/tools/recipe_tools.py`, `app/api/recipes/route.ts`, `app/api/recipes/[recipeId]/route.ts`, `agent/server.py` |

### 検証結果
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 42/42 tests pass
