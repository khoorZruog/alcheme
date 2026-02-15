// alche:me — User Profile Type Definitions

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
  hairType: string | null;
  bodyType: string | null;
  faceType: string | null;
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
  onboardingCompleted: boolean;
  created_at?: string;
  updated_at?: string;
}

/** プロフィール更新用 */
export type UserProfileUpdate = Partial<UserProfile>;
