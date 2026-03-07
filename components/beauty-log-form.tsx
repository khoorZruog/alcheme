"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Sparkles, Camera, X, Loader2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useRecipes } from "@/hooks/use-recipes";
import { RecipePickerSheet } from "@/components/recipe-picker-sheet";
import type { BeautyLogEntry } from "@/types/beauty-log";

const MOODS = [
  { label: "元気", emoji: "😊" },
  { label: "落ち着き", emoji: "😌" },
  { label: "ウキウキ", emoji: "🥰" },
  { label: "疲れ", emoji: "😤" },
];

const OCCASIONS = ["仕事", "デート", "休日", "イベント", "その他"];

const WEATHERS = [
  { label: "晴れ", emoji: "☀️" },
  { label: "曇り", emoji: "☁️" },
  { label: "雨", emoji: "🌧️" },
  { label: "雪", emoji: "❄️" },
];

const MAX_PHOTOS = 5;
const MAX_SIZE = 1200;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface BeautyLogFormProps {
  initialData?: Partial<BeautyLogEntry>;
  date?: string;
  onSave: () => void;
  onCancel: () => void;
}

export function BeautyLogForm({
  initialData,
  date: dateOverride,
  onSave,
  onCancel,
}: BeautyLogFormProps) {
  const today = new Date();
  const defaultDate =
    dateOverride ??
    initialData?.date ??
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [date, setDate] = useState(defaultDate);
  const [recipeId, setRecipeId] = useState(initialData?.recipe_id ?? "");
  const [recipeName, setRecipeName] = useState(initialData?.recipe_name ?? "");
  const [recipePreviewUrl, setRecipePreviewUrl] = useState(initialData?.preview_image_url ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selfRating, setSelfRating] = useState<number>(initialData?.self_rating ?? 3);
  const [mood, setMood] = useState(initialData?.mood ?? "");
  const [occasion, setOccasion] = useState(initialData?.occasion ?? "");
  const [weather, setWeather] = useState(initialData?.weather ?? "");
  const [temp, setTemp] = useState<number | undefined>(initialData?.temp);
  const [humidity, setHumidity] = useState<number | undefined>(initialData?.humidity);
  const [userNote, setUserNote] = useState(initialData?.user_note ?? "");
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { recipes } = useRecipes();

  // Check if the selected date is in the future
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isFutureDate = date > todayStr;

  // Auto-fetch weather on mount (only for new entries without existing weather)
  useEffect(() => {
    if (initialData?.weather || weather) return;
    if (!navigator.geolocation) return;

    setWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (data.weather) {
            setWeather(data.weather);
          }
          if (data.temp != null) {
            setTemp(Math.round(data.temp));
          }
          if (data.humidity != null) {
            setHumidity(Math.round(data.humidity));
          }
        } catch {
          // Silently fail — user can manually select
        } finally {
          setWeatherLoading(false);
        }
      },
      () => setWeatherLoading(false),
      { timeout: 5000 }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, remaining);

    try {
      const resized = await Promise.all(selected.map(resizeImage));
      setPhotos((prev) => [...prev, ...resized]);
    } catch {
      toast.error("画像の読み込みに失敗しました");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [photos.length]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = { date, self_rating: selfRating };
      if (recipeId) {
        body.recipe_id = recipeId;
        body.recipe_name = recipeName;
        if (recipePreviewUrl) {
          body.preview_image_url = recipePreviewUrl;
        }
      }
      if (mood) body.mood = mood;
      if (occasion) body.occasion = occasion;
      if (weather) body.weather = weather;
      if (temp != null) body.temp = temp;
      if (humidity != null) body.humidity = humidity;
      if (userNote.trim()) body.user_note = userNote.trim();
      if (photos.length > 0) body.photos = photos;

      const res = await fetch("/api/beauty-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success(isFutureDate ? "メイク予定を保存しました！" : "メイク日記を記録しました！");
      onSave();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const dateObj = new Date(date + "T00:00:00");
  const dateDisplay = dateObj.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const weatherEmoji = WEATHERS.find((w) => w.label === weather)?.emoji;
  const moodEmoji = MOODS.find((m) => m.label === mood)?.emoji;

  return (
    <div className="pb-8">
      {/* ── Journal Date Header ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="sr-only"
            id="log-date-input"
          />
          <label
            htmlFor="log-date-input"
            className="font-display text-2xl font-bold text-text-ink cursor-pointer hover:text-alcheme-rose transition-colors"
          >
            {dateDisplay}
          </label>
          {isFutureDate && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold">
              予定
            </span>
          )}
        </div>
        {/* Inline metadata badges */}
        <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
          {weatherEmoji && (
            <span>
              {weatherEmoji} {weather}
              {temp != null && ` ${temp}°C`}
              {humidity != null && ` 湿度${humidity}%`}
            </span>
          )}
          {moodEmoji && <span>{moodEmoji} {mood}</span>}
          {occasion && (
            <span className="px-2 py-0.5 rounded-full bg-alcheme-rose/10 text-alcheme-rose">
              {occasion}
            </span>
          )}
          {weatherLoading && (
            <span className="inline-flex items-center gap-1 text-text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          )}
        </div>
      </div>

      {/* ── Hero Photo Area ── */}
      <div className="px-5 pb-4">
        {/* All display images: recipe preview + user photos */}
        {(() => {
          const allImages: { src: string; isRecipe: boolean; index: number }[] = [];
          if (recipePreviewUrl) {
            allImages.push({ src: recipePreviewUrl, isRecipe: true, index: -1 });
          }
          photos.forEach((src, i) => allImages.push({ src, isRecipe: false, index: i }));

          if (allImages.length > 0) {
            return (
              <div className="relative rounded-2xl overflow-hidden">
                <div className={`grid gap-1 ${allImages.length === 1 ? "" : allImages.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {allImages.map((img) => (
                    <div
                      key={img.isRecipe ? "recipe" : `photo-${img.index}`}
                      className={`relative ${allImages.length === 1 ? "aspect-[4/3]" : "aspect-square"}`}
                    >
                      <img src={img.src} alt="" className="w-full h-full object-cover" />
                      {img.isRecipe ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white font-bold">
                          AI生成
                        </span>
                      ) : (
                        <button
                          onClick={() => removePhoto(img.index)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-white" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-text-ink shadow-sm hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    追加
                  </button>
                )}
              </div>
            );
          }

          return (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[16/7] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-text-muted hover:border-alcheme-rose/40 hover:text-alcheme-rose transition-colors bg-gray-50/50"
            >
              <Camera className="h-6 w-6 mb-1.5" />
              <span className="text-xs">{isFutureDate ? "メイクのイメージを追加" : "今日のメイクを記録"}</span>
            </button>
          );
        })()}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoSelect}
          className="hidden"
        />
      </div>

      {/* ── Satisfaction Rating ── */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text-muted w-16 flex-shrink-0">満足度</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSelfRating(n)}
                className={`text-xl transition-all ${
                  n <= selfRating ? "text-alcheme-gold" : "text-gray-200"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-gray-100" />

      {/* ── Recipe ── */}
      <div className="px-5 py-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center gap-3 py-1 text-left group"
        >
          {recipeId && recipePreviewUrl ? (
            <img
              src={recipePreviewUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-accent/10 to-magic-pink/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-neon-accent" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-text-muted">レシピ</p>
            <p className="text-sm text-text-ink truncate group-hover:text-alcheme-rose transition-colors">
              {recipeId ? recipeName || "レシピを選択" : "自由メイク"}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted flex-shrink-0" />
        </button>
        <RecipePickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          recipes={recipes}
          selectedId={recipeId}
          onSelect={(id, name) => {
            setRecipeId(id);
            setRecipeName(name);
            // Auto-populate recipe preview image
            const recipe = recipes.find((r) => r.id === id);
            setRecipePreviewUrl(recipe?.preview_image_url ?? "");
          }}
        />
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-gray-100" />

      {/* ── Mood ── */}
      <div className="px-5 py-3">
        <p className="text-[10px] font-medium text-text-muted mb-2 uppercase tracking-wider">Mood</p>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMood(mood === m.label ? "" : m.label)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                mood === m.label
                  ? "bg-alcheme-rose/10 ring-1 ring-alcheme-rose/30"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className={`text-[10px] ${mood === m.label ? "text-alcheme-rose font-medium" : "text-text-muted"}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Scene & Weather (compact row) ── */}
      <div className="px-5 py-3 flex gap-6">
        {/* Occasion */}
        <div className="flex-1">
          <p className="text-[10px] font-medium text-text-muted mb-2 uppercase tracking-wider">Scene</p>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOccasion(occasion === o ? "" : o)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  occasion === o
                    ? "bg-alcheme-rose text-white"
                    : "bg-gray-100 text-text-muted hover:bg-gray-200"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div className="flex-shrink-0">
          <p className="text-[10px] font-medium text-text-muted mb-2 uppercase tracking-wider">Weather</p>
          <div className="flex gap-1">
            {WEATHERS.map((w) => (
              <button
                key={w.label}
                type="button"
                onClick={() => setWeather(weather === w.label ? "" : w.label)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all ${
                  weather === w.label
                    ? "bg-alcheme-rose/10 ring-1 ring-alcheme-rose/30"
                    : "hover:bg-gray-50"
                }`}
                title={w.label}
              >
                {w.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="mx-5 border-t border-gray-100" />

      {/* ── Journal Note ── */}
      <div className="px-5 py-4">
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder={isFutureDate ? "この日のメイクプランを書く..." : "今日のメイクについて書く..."}
          rows={5}
          className="w-full text-sm text-text-ink leading-relaxed resize-none focus:outline-none placeholder:text-gray-300 bg-transparent"
        />
      </div>

      {/* ── Actions ── */}
      <div className="px-5 pt-2 pb-4 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full text-sm text-text-muted hover:bg-gray-100 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 py-2.5 rounded-full bg-text-ink text-sm font-medium text-white hover:bg-text-ink/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "保存中..." : isFutureDate ? "予定を保存" : "記録する"}
        </button>
      </div>
    </div>
  );
}
