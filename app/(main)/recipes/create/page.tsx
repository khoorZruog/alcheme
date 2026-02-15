"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { RecipeStepEditor, type StepData } from "@/components/recipe-step-editor";
import { InventoryPickerSheet, type PickedItem } from "@/components/inventory-picker-sheet";
import { cn } from "@/lib/utils";

const OCCASIONS = ["仕事", "デート", "休日", "イベント", "その他"];
const WEATHERS = [
  { label: "晴れ", emoji: "☀️" },
  { label: "曇り", emoji: "☁️" },
  { label: "雨", emoji: "🌧️" },
  { label: "雪", emoji: "❄️" },
];

const EMPTY_STEP: StepData = {
  area: "",
  item_id: "",
  item_name: "",
  brand: "",
  instruction: "",
};

export default function RecipeCreatePage() {
  const router = useRouter();

  const [recipeName, setRecipeName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [steps, setSteps] = useState<StepData[]>([{ ...EMPTY_STEP }]);
  const [proTips, setProTips] = useState<string[]>([]);
  const [thinkingProcess, setThinkingProcess] = useState<string[]>([]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStepIndex, setPickerStepIndex] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step management
  const addStep = () => setSteps((prev) => [...prev, { ...EMPTY_STEP }]);

  const updateStep = (index: number, step: StepData) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? step : s)));
  };

  const deleteStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= steps.length) return;
    setSteps((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  const openPicker = (stepIndex: number) => {
    setPickerStepIndex(stepIndex);
    setPickerOpen(true);
  };

  const handleItemPicked = useCallback(
    (item: PickedItem) => {
      updateStep(pickerStepIndex, {
        ...steps[pickerStepIndex],
        item_id: item.item_id,
        item_name: item.item_name,
        brand: item.brand,
        color_code: item.color_code,
        color_name: item.color_name,
      });
    },
    [pickerStepIndex, steps]
  );

  // AI Enhance
  const handleEnhance = useCallback(async () => {
    const validSteps = steps.filter((s) => s.item_id);
    if (validSteps.length === 0) {
      toast.error("少なくとも1つのアイテムを選択してください");
      return;
    }

    setEnhancing(true);
    try {
      const res = await fetch("/api/recipes/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps: validSteps,
          context: { occasion, weather },
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (data.recipe_name) setRecipeName(data.recipe_name);
      if (data.pro_tips) setProTips(data.pro_tips);
      if (data.thinking_process) setThinkingProcess(data.thinking_process);
      toast.success("AIが補完しました！");
    } catch {
      toast.error("AI補完に失敗しました");
    } finally {
      setEnhancing(false);
    }
  }, [steps, occasion, weather]);

  // Save
  const handleSave = useCallback(async () => {
    const validSteps = steps.filter((s) => s.item_id);
    if (validSteps.length === 0) {
      toast.error("少なくとも1つのアイテムを選択してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_name: recipeName || "マイレシピ",
          steps: validSteps,
          context: { occasion, weather },
          source: "manual",
          pro_tips: proTips,
          thinking_process: thinkingProcess,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("レシピを保存しました！");
      router.push(`/recipes/${data.id}`);
    } catch {
      toast.error("保存に失敗しました");
      setSaving(false);
    }
  }, [recipeName, steps, occasion, weather, proTips, thinkingProcess, router]);

  return (
    <div className="min-h-full pb-32">
      <PageHeader title="レシピ作成" backHref="/recipes" />

      <div className="px-4 py-4 space-y-6">
        {/* Recipe Name */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            レシピ名
          </label>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="例: ナチュラルオフィスメイク（AI自動補完可）"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-text-ink placeholder:text-gray-400 focus:border-neon-accent focus:outline-none"
          />
        </div>

        {/* Context: Occasion */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            シーン
          </label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => setOccasion(occasion === occ ? "" : occ)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy",
                  occasion === occ
                    ? "bg-text-ink text-white border-text-ink"
                    : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                )}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* Context: Weather */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-2">
            天気
          </label>
          <div className="flex flex-wrap gap-2">
            {WEATHERS.map((w) => (
              <button
                key={w.label}
                type="button"
                onClick={() => setWeather(weather === w.label ? "" : w.label)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all border btn-squishy",
                  weather === w.label
                    ? "bg-text-ink text-white border-text-ink"
                    : "bg-white text-text-muted border-gray-200 hover:border-neon-accent"
                )}
              >
                {w.emoji} {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <label className="block text-xs font-bold text-text-ink uppercase tracking-widest mb-3">
            ステップ
          </label>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <RecipeStepEditor
                key={i}
                step={step}
                index={i}
                total={steps.length}
                onChange={(s) => updateStep(i, s)}
                onMoveUp={() => moveStep(i, i - 1)}
                onMoveDown={() => moveStep(i, i + 1)}
                onDelete={() => deleteStep(i)}
                onPickItem={() => openPicker(i)}
              />
            ))}
          </div>
          <button
            onClick={addStep}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-text-muted hover:border-neon-accent hover:text-neon-accent transition-colors btn-squishy"
          >
            <Plus className="h-4 w-4" />
            ステップを追加
          </button>
        </div>

        {/* AI Enhance result preview */}
        {proTips.length > 0 && (
          <div className="rounded-2xl bg-neon-accent/5 border border-neon-accent/20 p-4 space-y-2">
            <p className="text-xs font-bold text-neon-accent uppercase tracking-widest">
              プロのコツ (AI)
            </p>
            <ul className="space-y-1">
              {proTips.map((tip, i) => (
                <li key={i} className="text-xs text-text-muted leading-relaxed">• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button
              onClick={handleEnhance}
              disabled={enhancing || steps.every((s) => !s.item_id)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-neon-accent text-sm font-bold text-neon-accent shadow-lg btn-squishy disabled:opacity-40"
            >
              {enhancing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI補完
            </button>
            <button
              onClick={handleSave}
              disabled={saving || steps.every((s) => !s.item_id)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-neon-accent to-magic-pink text-sm font-bold text-white shadow-lg btn-squishy disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Picker */}
      <InventoryPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleItemPicked}
      />
    </div>
  );
}
