"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selfRating, setSelfRating] = useState<number>(initialData?.self_rating ?? 3);
  const [mood, setMood] = useState(initialData?.mood ?? "");
  const [occasion, setOccasion] = useState(initialData?.occasion ?? "");
  const [weather, setWeather] = useState(initialData?.weather ?? "");
  const [userNote, setUserNote] = useState(initialData?.user_note ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const { recipes } = useRecipes();

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = { date, self_rating: selfRating };
      if (recipeId) {
        body.recipe_id = recipeId;
        const recipe = recipes.find((r) => r.id === recipeId);
        if (recipe) body.recipe_name = recipe.recipe_name;
      }
      if (mood) body.mood = mood;
      if (occasion) body.occasion = occasion;
      if (weather) body.weather = weather;
      if (userNote.trim()) body.user_note = userNote.trim();

      const res = await fetch("/api/beauty-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");

      toast.success("メイクログを記録しました！");
      onSave();
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-4">
      {/* Date */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alcheme-rose/30"
        />
      </div>

      {/* Recipe selector */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">使ったレシピ</label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-alcheme-rose/30"
        >
          {recipeId && recipes.find((r) => r.id === recipeId)?.preview_image_url ? (
            <img
              src={recipes.find((r) => r.id === recipeId)!.preview_image_url}
              alt=""
              className="w-8 h-8 rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-alcheme-muted" />
            </div>
          )}
          <span className="flex-1 text-sm text-alcheme-charcoal truncate">
            {recipeId ? recipeName || "レシピを選択" : "レシピなし / 自由メイク"}
          </span>
          <ChevronDown className="h-4 w-4 text-alcheme-muted flex-shrink-0" />
        </button>
        <RecipePickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          recipes={recipes}
          selectedId={recipeId}
          onSelect={(id, name) => {
            setRecipeId(id);
            setRecipeName(name);
          }}
        />
      </div>

      {/* Star rating */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">
          今日の満足度
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSelfRating(n)}
              className={`text-2xl transition-transform ${
                n <= selfRating ? "text-alcheme-gold scale-110" : "text-gray-200"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Mood chips */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">気分</label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMood(mood === m.label ? "" : m.label)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                mood === m.label
                  ? "bg-alcheme-rose text-white"
                  : "bg-gray-100 text-alcheme-charcoal hover:bg-gray-200"
              }`}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Occasion chips */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">シーン</label>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOccasion(occasion === o ? "" : o)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                occasion === o
                  ? "bg-alcheme-rose text-white"
                  : "bg-gray-100 text-alcheme-charcoal hover:bg-gray-200"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Weather chips */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">天気</label>
        <div className="flex flex-wrap gap-2">
          {WEATHERS.map((w) => (
            <button
              key={w.label}
              type="button"
              onClick={() => setWeather(weather === w.label ? "" : w.label)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                weather === w.label
                  ? "bg-alcheme-rose text-white"
                  : "bg-gray-100 text-alcheme-charcoal hover:bg-gray-200"
              }`}
            >
              {w.emoji} {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* User note */}
      <div>
        <label className="block text-xs font-medium text-alcheme-muted mb-1">メモ</label>
        <textarea
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="今日のメイクについてメモ..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-alcheme-rose/30"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-button border border-gray-200 px-4 py-2.5 text-sm font-medium text-alcheme-charcoal hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 rounded-button bg-alcheme-rose px-4 py-2.5 text-sm font-medium text-white hover:bg-alcheme-rose/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "記録する"}
        </button>
      </div>
    </div>
  );
}
