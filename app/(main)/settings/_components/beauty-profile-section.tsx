import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SKIN_TYPES, SKIN_TONES, PERSONAL_COLORS, FACE_TYPES } from "../constants";
import { VisibilityCheckbox } from "./visibility-checkbox";
import type { SettingsFormState } from "../use-settings-form";

interface Props {
  form: SettingsFormState;
  update: (key: string, value: any) => void;
}

export function BeautyProfileSection({ form, update }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <Palette className="h-4 w-4" /> ビューティプロフィール
      </h2>

      {/* Skin Type */}
      <div className="space-y-2">
        <Label>肌質</Label>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update("skinType", form.skinType === t ? "" : t)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all btn-squishy ${
                form.skinType === t
                  ? "bg-text-ink text-white shadow-md"
                  : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <VisibilityCheckbox
          checked={form.visSkinType}
          onChange={(v) => update("visSkinType", v)}
        />
      </div>

      {/* Skin Tone (visual circles) */}
      <div className="space-y-2">
        <Label>スキントーン</Label>
        <div className="flex gap-4 py-1">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone.value}
              type="button"
              onClick={() => update("skinTone", form.skinTone === tone.value ? "" : tone.value)}
              className={`w-12 h-12 rounded-full border-2 transition-all btn-squishy ${
                form.skinTone === tone.value
                  ? "border-text-ink ring-2 ring-text-ink/20 scale-110"
                  : "border-white/60 hover:border-text-ink/40"
              }`}
              style={{ backgroundColor: tone.color }}
              aria-label={tone.label}
              title={tone.label}
            />
          ))}
        </div>
        <VisibilityCheckbox
          checked={form.visSkinTone}
          onChange={(v) => update("visSkinTone", v)}
          label="スキントーンをプロフィールに表示しない"
        />
      </div>

      {/* Personal Color */}
      <div className="space-y-2">
        <Label>パーソナルカラー</Label>
        <div className="flex flex-wrap gap-2">
          {PERSONAL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => update("personalColor", form.personalColor === c.value ? "" : c.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all btn-squishy ${
                form.personalColor === c.value
                  ? "bg-text-ink text-white shadow-md"
                  : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <VisibilityCheckbox
          checked={form.visPersonalColor}
          onChange={(v) => update("visPersonalColor", v)}
        />
      </div>

      {/* Face Type */}
      <div className="space-y-2">
        <Label>顔タイプ</Label>
        <div className="flex flex-wrap gap-2">
          {FACE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update("faceType", form.faceType === t ? "" : t)}
              className={`rounded-full px-3 py-1.5 text-sm transition-all btn-squishy ${
                form.faceType === t
                  ? "bg-text-ink text-white shadow-md"
                  : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
