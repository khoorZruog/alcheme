import { Sparkles } from "lucide-react";
import { AGENT_THEMES } from "../constants";
import type { SettingsFormState } from "../use-settings-form";

interface Props {
  form: SettingsFormState;
  update: (key: string, value: any) => void;
}

export function AgentThemeSection({ form, update }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <Sparkles className="h-4 w-4" /> エージェントテーマ
      </h2>
      <div className="grid gap-2">
        {AGENT_THEMES.map((theme) => (
          <button
            key={theme.value}
            type="button"
            onClick={() => update("agentTheme", theme.value)}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all btn-squishy ${
              form.agentTheme === theme.value
                ? "border-neon-accent bg-neon-accent/10 shadow-md"
                : "border-white/60 bg-white/40 hover:bg-white/60"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-text-ink">{theme.label}</p>
              <p className="text-xs text-text-muted">{theme.desc}</p>
            </div>
            {form.agentTheme === theme.value && (
              <div className="h-3 w-3 rounded-full bg-neon-accent" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
