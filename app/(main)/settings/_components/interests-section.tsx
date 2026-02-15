import { Heart, X } from "lucide-react";
import { INTEREST_TAGS, CONCERN_TAGS, MAX_TAGS } from "../constants";
import { VisibilityCheckbox } from "./visibility-checkbox";
import type { SettingsFormState } from "../use-settings-form";

interface Props {
  form: SettingsFormState;
  update: (key: string, value: any) => void;
}

function toggleTag(list: string[], tag: string, max: number): string[] {
  if (list.includes(tag)) return list.filter((t) => t !== tag);
  if (list.length >= max) return list;
  return [...list, tag];
}

export function InterestsSection({ form, update }: Props) {
  const allSelected = [...form.interests, ...form.concerns];

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <Heart className="h-4 w-4" /> 興味関心・悩み
      </h2>
      <p className="text-xs text-text-muted">タグは各{MAX_TAGS}つまで選択できます</p>

      {/* Interest tags */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-ink">興味のある項目・好きな項目</p>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_TAGS.map((tag) => {
            const selected = form.interests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => update("interests", toggleTag(form.interests, tag, MAX_TAGS))}
                className={`rounded-full px-3 py-1.5 text-xs transition-all btn-squishy ${
                  selected
                    ? "bg-text-ink text-white"
                    : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Concern tags */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-ink">悩み</p>
        <div className="flex flex-wrap gap-1.5">
          {CONCERN_TAGS.map((tag) => {
            const selected = form.concerns.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => update("concerns", toggleTag(form.concerns, tag, MAX_TAGS))}
                className={`rounded-full px-3 py-1.5 text-xs transition-all btn-squishy ${
                  selected
                    ? "bg-text-ink text-white"
                    : "bg-white/50 text-text-ink border border-white/60 hover:bg-white/80"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tags summary */}
      {allSelected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/40">
          {form.interests.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-text-ink text-white text-xs px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => update("interests", form.interests.filter((t) => t !== tag))}
                className="hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {form.concerns.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-text-ink text-white text-xs px-2.5 py-1 rounded-full"
            >
              {tag}
              <button
                type="button"
                onClick={() => update("concerns", form.concerns.filter((t) => t !== tag))}
                className="hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <VisibilityCheckbox
        checked={form.visInterests}
        onChange={(v) => update("visInterests", v)}
        label="興味関心・悩みをプロフィールに表示しない"
      />
    </section>
  );
}
