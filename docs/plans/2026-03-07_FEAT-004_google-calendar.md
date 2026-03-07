# FEAT-004: Google Calendar API 連携 — 実装計画

## Context

alche:me の TPO Tactician agent は天気・予定・在庫を組み合わせてメイク戦略を提案するが、
予定データは現在プレースホルダー（`user:today_schedule` state を手動設定するのみ）。
Google Calendar API と連携し、ユーザーの実際の予定を取得してTPO提案精度を向上させる。
カレンダー未連携ユーザー向けの手動入力UIも併設する。

## Scope

- Google Calendar OAuth 2.0（読み取り専用）+ カレンダー選択UI
- 手動スケジュール入力（Calendar未連携ユーザー向け）
- Agent 側の `get_today_schedule()` を実データ対応に改修
- 設定画面にカレンダー連携セクション追加

---

## Batch 1: 型定義 + スキーマ拡張（2 files）

### 新規
- `types/calendar.ts` — `CalendarIntegration`, `GoogleCalendarEntry`, `CalendarEvent`, `TodayEventsResponse`

### 変更
- `types/user.ts` — `UserProfile` に `calendarIntegration?: CalendarIntegration` + `manualSchedule?: string | null` 追加

---

## Batch 2: OAuth フロー — BFF API Routes（4 new, 2 modified）

### 新規
- `lib/api/google-calendar.ts` — OAuth ヘルパー関数群
  - `generateAuthUrl(state)` / `exchangeCodeForTokens(code)` / `refreshAccessToken(refreshToken)` / `revokeToken(token)` / `fetchCalendarList(accessToken)` / `fetchTodayEvents(accessToken, calendarIds)`
  - 外部依存なし（raw `fetch` で Google OAuth/Calendar API を直接呼ぶ）
- `app/api/auth/google-calendar/route.ts` (GET) — 認証URL生成 + CSRF state cookie
- `app/api/auth/google-calendar/callback/route.ts` (GET) — code↔token 交換 → Firestore 保存 → リダイレクト
- `app/api/auth/google-calendar/disconnect/route.ts` (DELETE) — トークン失効 + Firestore クリア

### 変更
- `.env.example` — `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_REDIRECT_URI` 追加
- `cloudbuild.yaml` — Cloud Run env vars に Calendar 用追加

### 設計詳細

**OAuth フロー**:
1. Settings UI → `GET /api/auth/google-calendar` → 認証URL + `calendar_oauth_state` cookie(httpOnly, 10分TTL)
2. Google 認証 → `GET /api/auth/google-calendar/callback?code=xxx&state=yyy`
3. CSRF検証 → code→token交換 → Firestore `users/{uid}.calendarIntegration` に保存
4. カレンダーリスト取得 → primary をデフォルト選択 → `/settings/edit/calendar?connected=true` にリダイレクト

**Scopes**: `calendar.readonly` + `calendar.events.readonly`（読み取り専用）
**Token**: `access_type=offline` + `prompt=consent` で refresh_token 取得

---

## Batch 3: カレンダー管理 API（3 new）

### 新規
- `app/api/calendar/list/route.ts` (GET) — ユーザーのカレンダー一覧取得（Google API）
- `app/api/calendar/select/route.ts` (PATCH) — 選択カレンダーID保存
- `app/api/calendar/events/route.ts` (GET) — 今日のイベントプレビュー（Google Calendar or 手動）

**Token refresh**: API呼び出し前に `tokenExpiry` をチェック → 期限5分以内なら `refreshAccessToken()` → Firestore更新

---

## Batch 4: 設定UI（3 new, 3 modified）

### 新規
- `app/(main)/settings/edit/calendar/page.tsx` — カレンダー編集ページ
  - Google Calendar 連携/解除ボタン
  - カレンダー選択チェックボックス（色付き）
  - 今日のイベントプレビュー
  - 手動スケジュール入力（textarea）
- `app/(main)/settings/_components/calendar-section.tsx` — カレンダーセクション（連携状態表示 + 手動入力）
- `hooks/use-calendar.ts` — SWR hook（接続状態、カレンダーリスト、イベントプレビュー）

### 変更
- `app/(main)/settings/page.tsx` — SNSリンクの後に ProfileRow 追加（CalendarDays icon, "カレンダー連携"）
- `app/(main)/settings/use-settings-form.ts` — `manualSchedule` をフォームステートに追加 + handleSave に含める
- `app/(main)/settings/constants.ts` — カレンダー関連定数（必要に応じて）

### UI パターン（既存踏襲）
```
PageHeader("カレンダー連携", backHref="/settings")
├── Google Calendar 連携セクション
│   ├── 未連携: 「Google カレンダーを連携する」ボタン
│   └── 連携中: ステータス + 「連携を解除」ボタン
├── カレンダー選択（連携時のみ表示）
│   └── Checkbox list（カレンダー名 + 色ドット）
├── 今日の予定プレビュー（連携時のみ表示）
│   └── CalendarEvent カード一覧
├── Separator
├── 手動スケジュール入力（常時表示）
│   ├── Label: "予定を手動入力"
│   ├── Hint: "Google カレンダー未連携の場合、ここに今日の予定を入力できます"
│   └── Textarea（例: 「午後3時から会議、夜はディナー」）
└── 保存ボタン（手動スケジュール用）
```

---

## Batch 5: Agent 連携 — Python Backend（3 modified）

### 変更
- `agent/alcheme/tools/calendar_tools.py` — 実装を大幅改修
  - 戦略1: Google Calendar API から直接フェッチ（Firestore からトークン読み取り）
  - 戦略2: manual_schedule フォールバック
  - 戦略3: 予定なし（現行動作を維持）
  - `google-auth` の `Credentials` でトークン自動リフレッシュ
  - リフレッシュ後の新トークンを Firestore に書き戻し
- `agent/server.py` — `_build_user_state()` に追加:
  - `user:calendar_connected` (bool) — カレンダー連携済みか
  - `user:manual_schedule` (str) — 手動入力のスケジュール
- `agent/pyproject.toml` — 依存追加: `google-api-python-client`

### calendar_tools.py 設計
```python
def get_today_schedule(tool_context: ToolContext) -> dict:
    user_id = tool_context.state.get("user:id")

    # 1. Google Calendar（連携済みの場合）
    if tool_context.state.get("user:calendar_connected"):
        doc = _get_firestore().collection("users").document(user_id).get()
        cal = doc.to_dict().get("calendarIntegration", {})
        if cal.get("connected") and cal.get("accessToken"):
            events = _fetch_google_calendar_events(
                cal["accessToken"], cal["refreshToken"], cal["selectedCalendars"]
            )
            return {"status": "success", "events": _enrich(events), "source": "google_calendar"}

    # 2. 手動スケジュール
    manual = tool_context.state.get("user:manual_schedule")
    if manual:
        return {"status": "success", "events": _parse_manual(manual), "source": "manual"}

    # 3. 予定なし
    return {"status": "success", "events": [], "note": "予定は登録されていません..."}
```

---

## Batch 6: テスト（5 new）

### Frontend (Vitest)
- `__tests__/unit/hooks/use-calendar.test.ts`
- `__tests__/unit/components/calendar-section.test.tsx`
- `__tests__/unit/lib/google-calendar.test.ts`

### Agent (pytest)
- `agent/tests/test_calendar_tools.py` — Google Calendar/手動/なし の3パターン
- `agent/tests/test_calendar_refresh.py` — トークンリフレッシュ + Firestore 書き戻し

---

## Batch 7: ドキュメント（3 new, 2 modified）

### 新規
- `docs/guides/google-calendar-setup.md` — GCP Console セットアップ手順
- `docs/guides/manual_e2e_calendar.md` — E2E テストシナリオ
- `docs/plans/2026-03-07_FEAT-004_google-calendar.md` — この計画書の保存版

### 変更
- `docs/plans/backlog_and_remaining_tasks.md` — FEAT-004 を ✅ RESOLVED に更新
- `docs/README.md` — ドキュメントマップ更新

---

## ファイル数サマリ

| Batch | 内容 | New | Modified | Total |
|-------|------|-----|----------|-------|
| 1 | 型定義 | 1 | 1 | 2 |
| 2 | OAuth フロー | 4 | 2 | 6 |
| 3 | Calendar API | 3 | 0 | 3 |
| 4 | 設定 UI | 3 | 3 | 6 |
| 5 | Agent 連携 | 0 | 3 | 3 |
| 6 | テスト | 5 | 0 | 5 |
| 7 | ドキュメント | 3 | 2 | 5 |
| **合計** | | **19** | **11** | **30** |

---

## 依存関係

```
Batch 1 (型)
  ├→ Batch 2 (OAuth) ──┐
  └→ Batch 3 (API) ────┤
                        ├→ Batch 4 (UI)
                        └→ Batch 5 (Agent)
                              └→ Batch 6 (テスト)
                                    └→ Batch 7 (ドキュメント)
```

Batch 2/3 は並行可能。Batch 4 は 2+3 完了後。Batch 5 は Batch 1 完了後着手可能。

---

## セキュリティ

- **Scopes 最小化**: `calendar.readonly` + `calendar.events.readonly`（読み取りのみ）
- **CSRF 防御**: OAuth state パラメータを httpOnly cookie で検証（10分TTL）
- **Token 保存**: Firestore `users/{uid}` に保存。Firestore rules で `request.auth.uid == userId` ガード済み
- **データ最小化**: イベントのタイトル・時刻・場所のみ取得（説明・参加者は不使用）
- **失効**: Disconnect で Google revoke endpoint 呼び出し + Firestore クリア
- **npm 依存なし**: OAuth は raw `fetch` で実装（`googleapis` パッケージ不要）

---

## 環境変数

### Next.js (.env.local)
```
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar/callback
```

### Agent (agent/.env)
```
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
```

---

## GCP 手動セットアップ（実装前に必要）

1. **Google Calendar API 有効化**: GCP Console > APIs & Services > Library > "Google Calendar API" > Enable
2. **OAuth 同意画面**: External, App name "alche:me", Scopes: `calendar.readonly` + `calendar.events.readonly`
3. **OAuth 2.0 クライアントID**: Web application, Redirect URI: `http://localhost:3000/api/auth/google-calendar/callback`（+ 本番URL）
4. **テストユーザー追加**: OAuth 同意画面 > Test users にGoogleアカウント追加

---

## 検証方法

1. **型チェック**: `npx tsc --noEmit`
2. **Frontend テスト**: `npx vitest run`
3. **Agent テスト**: `cd agent && python -m pytest tests/ -v`
4. **E2E 手動テスト**: `docs/guides/manual_e2e_calendar.md` のシナリオ実行
   - Google Calendar 連携/解除
   - カレンダー選択
   - イベントプレビュー
   - 手動スケジュール入力
   - TPO Tactician でカレンダーデータが使用されることの確認
