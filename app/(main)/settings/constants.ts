export const GENDERS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
];

export const SKIN_TYPES = [
  "普通肌", "脂性肌", "乾燥肌", "混合肌", "敏感肌", "アトピー肌",
];

export const SKIN_TONES = [
  { value: "tone-1", color: "#FDEBD0", label: "とても色白" },
  { value: "tone-2", color: "#F5CBA7", label: "色白" },
  { value: "tone-3", color: "#E8B796", label: "標準" },
  { value: "tone-4", color: "#C68E6E", label: "やや暗め" },
  { value: "tone-5", color: "#8D5524", label: "暗め" },
];

export const PERSONAL_COLORS = [
  { value: "spring", label: "イエベ春" },
  { value: "summer", label: "ブルべ夏" },
  { value: "autumn", label: "イエベ秋" },
  { value: "winter", label: "ブルべ冬" },
  { value: "unknown", label: "その他・わからない" },
];

export const FACE_TYPES = [
  "キュート", "アクティブキュート", "フレッシュ", "クールカジュアル",
  "フェミニン", "クール", "エレガント", "ソフトエレガント", "その他・わからない",
];

export const INTEREST_TAGS = [
  "デパコス好き", "プチプラ好き", "海外コスメ好き", "中国コスメ好き",
  "韓国コスメ好き", "台湾コスメ好き", "艶が好き", "マットが好き",
  "ラメが好き", "高発色好き", "薄付き好き", "新作コスメ好き",
  "定番コスメ好き", "ドクターズコスメ好き", "ヴィーガンコスメ好き",
  "石鹸落ちコスメ好き", "スキンケアマニア", "リップマニア",
  "時短コスメ好き", "ノーファンデが好き", "ナチュラルメイクが好き", "成分マニア",
];

export const CONCERN_TAGS = [
  "シミが気になる", "くすみが気になる", "毛穴が気になる", "ニキビが気になる",
  "乾燥が気になる", "テカリが気になる", "クマが気になる",
  "しわ・たるみが気になる", "赤みが気になる", "敏感肌で悩んでいる",
];

export const MAX_TAGS = 5;

export const AGENT_THEMES = [
  { value: "bestfriend" as const, label: "親友系", desc: "気さくなトーンでアドバイス" },
  { value: "kpop" as const, label: "K-POP系", desc: "トレンド重視のスタイリスト" },
  { value: "maid" as const, label: "メイドさん", desc: "丁寧でかわいい口調" },
];

/** 旧テキスト値 → 新value形式のマイグレーションマップ */
export const SKIN_TONE_MIGRATION: Record<string, string> = {
  "色白": "tone-1",
  "標準": "tone-3",
  "やや暗め": "tone-4",
  "暗め": "tone-5",
};
