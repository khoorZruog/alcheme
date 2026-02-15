export interface BeautyLogEntry {
  id: string; // Firestore doc ID (= date string "2026-02-15")
  date: string; // "2026-02-15"
  recipe_id?: string; // Recipe used (if any)
  recipe_name?: string; // Denormalized for display
  used_items: string[]; // Inventory item IDs actually used
  modifications: string[]; // Free-text changes from recipe
  self_rating?: 1 | 2 | 3 | 4 | 5; // Satisfaction score
  mood?: string; // 気分 (e.g., "元気", "落ち着き")
  occasion?: string; // TPO (e.g., "仕事", "デート")
  weather?: string; // 天気
  user_note?: string; // Free-text memo
  auto_tags: string[]; // Future: AI-detected tags
  selfie_url?: string; // Future: selfie image
  created_at: string;
  updated_at: string;
}
