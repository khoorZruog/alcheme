// alche:me — User Profile Type Definitions

import type { CalendarIntegration } from "./calendar";

/** ユーザープロフィール — Firestore: users/{userId} */
export interface UserProfile {
  displayName: string | null;
  photoURL: string | null;
  bio: string | null;
  gender: string | null;
  birthDate: string | null;
  personalColor: string | null;
  skinType: string | null;
  skinTone: string | null;
  /** 髪型 — AI メイク画像に反映 */
  hairType: string | null;
  /** 髪色 — AI メイク画像に反映 */
  hairColor: string | null;
  bodyType: string | null;
  faceType: string | null;
  /** 天気ベースのメイク提案に使用する居住地域 */
  location: string | null;
  occupation: string | null;
  interests: string[];
  concerns: string[];
  favoriteBrands: string[];
  agentTheme: "maid" | "kpop" | "bestfriend";
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
    /** @deprecated use twitter instead */
    x?: string;
  };
  profileVisibility?: {
    gender?: boolean;
    ageRange?: boolean;
    skinType?: boolean;
    skinTone?: boolean;
    personalColor?: boolean;
    interests?: boolean;
  };
  /** ベストコスメ — インベントリアイテムIDの配列 (max 10) */
  bestCosme?: string[];
  /** Google Calendar 連携情報 */
  calendarIntegration?: CalendarIntegration;
  /** 手動入力の今日の予定（Calendar未連携ユーザー向け） */
  manualSchedule?: string | null;
  onboardingCompleted: boolean;
  created_at?: string;
  updated_at?: string;
}

/** プロフィール更新用 */
export type UserProfileUpdate = Partial<UserProfile>;
