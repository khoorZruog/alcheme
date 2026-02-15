// alche:me — Social / SNS type definitions (Batch 6)

/** Social post (published recipe in feed) */
export interface SocialPost {
  id: string;
  user_id: string;
  author_display_name: string;
  author_photo_url: string | null;
  recipe_id: string;
  recipe_name: string;
  preview_image_url?: string;
  /** Full recipe steps for detail view */
  steps?: import("@/types/recipe").RecipeStep[];
  /** Short text summaries for card view (first 3 steps) */
  steps_summary: string[];
  character_theme?: "cute" | "cool" | "elegant";
  visibility: "public" | "private";
  tags: string[];
  like_count: number;
  comment_count: number;
  /** Computed per-viewer — true if the current user has liked this post */
  is_liked?: boolean;
  created_at: string;
  updated_at: string;
}

/** Comment or quick reaction on a post */
export interface SocialComment {
  id: string;
  user_id: string;
  author_display_name: string;
  author_photo_url?: string;
  text: string;
  type: "comment" | "reaction";
  reaction_key?: ReactionKey;
  created_at: string;
}

/** Public user info for follow lists / author cards */
export interface FollowInfo {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  is_following?: boolean;
}

/** Aggregated social stats for a user */
export interface UserSocialStats {
  post_count: number;
  follower_count: number;
  following_count: number;
  total_likes_received: number;
}

/** Best cosme item for public display */
export interface BestCosmeItem {
  id: string;
  product_name: string;
  brand: string;
  image_url?: string;
}

/** Public user profile shown on social pages */
export interface PublicUserProfile {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  personal_color: string | null;
  skin_type: string | null;
  interests: string[];
  stats: UserSocialStats;
  is_following: boolean;
  gender: string | null;
  age_range: string | null;
  skin_tone: string | null;
  face_type: string | null;
  concerns: string[];
  social_links?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  best_cosme?: BestCosmeItem[];
}

/** Quick reaction stamp definitions */
export const REACTION_STAMPS = [
  { key: "suteki" as const, label: "素敵！", emoji: "✨" },
  { key: "manetai" as const, label: "真似したい！", emoji: "💄" },
  { key: "sanko" as const, label: "参考になりました", emoji: "📝" },
] as const;

export type ReactionKey = (typeof REACTION_STAMPS)[number]["key"];
