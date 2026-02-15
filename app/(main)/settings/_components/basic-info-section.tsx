import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GENDERS } from "../constants";
import { calcAgeRange } from "../utils";
import { VisibilityCheckbox } from "./visibility-checkbox";
import type { SettingsFormState } from "../use-settings-form";

interface Props {
  form: SettingsFormState;
  update: (key: string, value: any) => void;
}

export function BasicInfoSection({ form, update }: Props) {
  const ageRange = form.birthDate ? calcAgeRange(form.birthDate) : null;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <User className="h-4 w-4" /> 基本情報
      </h2>

      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="displayName">ニックネーム</Label>
        <Input
          id="displayName"
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          placeholder="名前を入力"
          className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
        />
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label>性別</Label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => update("gender", form.gender === g.value ? "" : g.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-all btn-squishy ${
                form.gender === g.value
                  ? "bg-text-ink text-white shadow-md"
                  : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <VisibilityCheckbox
          checked={form.visGender}
          onChange={(v) => update("visGender", v)}
        />
      </div>

      {/* Birthday */}
      <div className="space-y-2">
        <Label htmlFor="birthDate">生年月日</Label>
        <input
          id="birthDate"
          type="date"
          value={form.birthDate}
          onChange={(e) => update("birthDate", e.target.value)}
          className="w-full h-10 rounded-full bg-white/50 border border-white/80 focus:border-neon-accent px-4 text-sm text-text-ink outline-none transition-colors"
        />
        {ageRange && (
          <span className="inline-block text-xs bg-neon-accent/10 text-neon-accent px-2.5 py-0.5 rounded-full font-medium">
            {ageRange}
          </span>
        )}
        <VisibilityCheckbox
          checked={form.visAgeRange}
          onChange={(v) => update("visAgeRange", v)}
          label="年齢をプロフィールに表示しない"
        />
      </div>
    </section>
  );
}
