// alche:me — Calendar Integration Type Definitions

/** Google Calendar 連携状態 — Firestore: users/{userId}.calendarIntegration */
export interface CalendarIntegration {
  connected: boolean;
  accessToken: string;
  refreshToken: string;
  /** ISO 8601 — アクセストークンの有効期限 */
  tokenExpiry: string;
  /** 取得対象のカレンダーID一覧 */
  selectedCalendars: string[];
  /** ISO 8601 — 連携日時 */
  connectedAt: string;
  /** ISO 8601 — 最終同期日時 */
  lastSyncAt: string | null;
}

/** Google Calendar のカレンダーエントリ */
export interface GoogleCalendarEntry {
  id: string;
  /** カレンダー名 */
  summary: string;
  /** カレンダーの背景色 (hex) */
  backgroundColor: string;
  /** プライマリカレンダーか */
  primary: boolean;
  accessRole: string;
}

/** カレンダーイベント */
export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO 8601 or "allDay" */
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
}

/** 今日のイベントレスポンス */
export interface TodayEventsResponse {
  events: CalendarEvent[];
  source: "google_calendar" | "manual" | "none";
  calendarConnected: boolean;
}
