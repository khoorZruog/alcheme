import { Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsFormState } from "../use-settings-form";

interface Props {
  form: SettingsFormState;
  update: (key: string, value: any) => void;
}

const SNS_FIELDS = [
  { key: "twitter", label: "Twitter", placeholder: "@username" },
  { key: "instagram", label: "Instagram", placeholder: "@username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "tiktok", label: "TikTok", placeholder: "@username" },
  { key: "website", label: "Webサイト", placeholder: "https://..." },
] as const;

export function SnsLinksSection({ form, update }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-text-ink">
        <Link2 className="h-4 w-4" /> SNSリンク
      </h2>
      {SNS_FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Input
            id={field.key}
            value={form[field.key]}
            onChange={(e) => update(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="rounded-full bg-white/50 border-white/80 focus:border-neon-accent"
          />
        </div>
      ))}
    </section>
  );
}
