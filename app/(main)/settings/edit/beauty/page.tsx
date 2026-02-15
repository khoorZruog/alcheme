"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useSettingsForm } from "../../use-settings-form";
import { BeautyProfileSection } from "../../_components/beauty-profile-section";

export default function EditBeautyPage() {
  const router = useRouter();
  const { form, update, saving, saved, handleSave } = useSettingsForm();

  const onSave = async () => {
    await handleSave();
    router.push("/settings");
  };

  return (
    <div>
      <PageHeader title="ビューティプロフィール" backHref="/settings" />
      <div className="px-4 py-4 space-y-6">
        <BeautyProfileSection form={form} update={update} />

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full h-12 rounded-2xl relative overflow-hidden shadow-neon-glow btn-squishy disabled:opacity-50 disabled:pointer-events-none"
        >
          <div className="absolute inset-0 bg-linear-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90" />
          <div className="relative z-10 text-white font-body font-bold tracking-wider flex items-center justify-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? "保存中..." : saved ? "保存しました！" : "保存する"}
          </div>
        </button>
      </div>
    </div>
  );
}
