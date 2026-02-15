"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Step = 1 | 2 | 3;

const SKIN_TYPES = ["乾燥肌", "脂性肌", "混合肌", "普通肌", "敏感肌"];
const SKIN_TONES = ["色白", "標準", "やや暗め", "暗め"];
const PERSONAL_COLORS = ["イエベ春", "イエベ秋", "ブルベ夏", "ブルベ冬", "わからない"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [skinType, setSkinType] = useState<string | null>(null);
  const [skinTone, setSkinTone] = useState<string | null>(null);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const saveAndFinish = async (goToScan: boolean) => {
    setSaving(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name || null,
          skinType,
          skinTone,
          personalColor,
          onboardingCompleted: true,
        }),
      });
      router.push(goToScan ? "/scan" : "/chat");
    } catch {
      router.push("/chat");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-alcheme-cream px-6 py-8">
      <Progress value={step * 33} className="mb-8" />

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-xl font-bold text-alcheme-charcoal">
                あなたのお名前は？
              </h2>
              <p className="text-sm text-alcheme-muted">
                alche:me があなたを呼ぶ名前を教えてください
              </p>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ニックネーム"
              className="rounded-input text-center text-lg"
              autoFocus
            />
            <Button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full bg-alcheme-rose hover:bg-alcheme-rose/90 text-white rounded-button"
            >
              次へ
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-xl font-bold text-alcheme-charcoal">
                あなたのことを教えてください
              </h2>
              <p className="text-sm text-alcheme-muted">
                より良いレシピ提案のために（あとで設定もできます）
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-alcheme-charcoal">肌質</p>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSkinType(skinType === t ? null : t)}
                      className={`rounded-badge px-3 py-1.5 text-sm transition-colors ${
                        skinType === t
                          ? "bg-alcheme-rose text-white"
                          : "bg-alcheme-sand text-alcheme-charcoal"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-alcheme-charcoal">スキントーン</p>
                <div className="flex flex-wrap gap-2">
                  {SKIN_TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSkinTone(skinTone === t ? null : t)}
                      className={`rounded-badge px-3 py-1.5 text-sm transition-colors ${
                        skinTone === t
                          ? "bg-alcheme-rose text-white"
                          : "bg-alcheme-sand text-alcheme-charcoal"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-alcheme-charcoal">パーソナルカラー</p>
                <Select value={personalColor ?? ""} onValueChange={(v) => setPersonalColor(v || null)}>
                  <SelectTrigger className="rounded-input">
                    <SelectValue placeholder="選択してください（任意）" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAL_COLORS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => setStep(3)}
                className="w-full bg-alcheme-rose hover:bg-alcheme-rose/90 text-white rounded-button"
              >
                次へ
              </Button>
              <button
                onClick={() => setStep(3)}
                className="w-full text-center text-xs text-alcheme-muted hover:text-alcheme-rose"
              >
                あとで設定する →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center items-center space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold text-alcheme-charcoal">
                最初のコスメをスキャン！
              </h2>
              <p className="text-sm text-alcheme-muted">
                手持ちのコスメを撮影して、在庫に登録しましょう
              </p>
            </div>

            <div className="w-20 h-20 rounded-full bg-alcheme-rose/10 flex items-center justify-center">
              <Camera className="h-10 w-10 text-alcheme-rose" />
            </div>

            <div className="w-full space-y-2">
              <Button
                onClick={() => saveAndFinish(true)}
                disabled={saving}
                className="w-full bg-alcheme-gold hover:bg-alcheme-gold/90 text-white rounded-button"
              >
                {saving ? "保存中..." : "スキャンする"}
              </Button>
              <button
                onClick={() => saveAndFinish(false)}
                disabled={saving}
                className="w-full text-center text-xs text-alcheme-muted hover:text-alcheme-rose"
              >
                あとで →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
