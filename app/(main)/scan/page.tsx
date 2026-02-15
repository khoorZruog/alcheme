"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Sparkles, Search, PackageCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScanCamera, type CapturedImage } from "@/components/scan-camera";
import { cn } from "@/lib/utils";

const SCAN_STEPS = [
  { icon: ScanLine, label: "画像を解析中...", sub: "AIがコスメを識別しています" },
  { icon: Search, label: "楽天APIで検索中...", sub: "商品情報を照合しています" },
  { icon: Sparkles, label: "鑑定結果を生成中...", sub: "スペックを算出しています" },
  { icon: PackageCheck, label: "まもなく完了...", sub: "最終チェック中" },
];

// Step transitions at these elapsed seconds
const STEP_TIMES = [0, 8, 20, 40];

export default function ScanPage() {
  const router = useRouter();
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Progress step timer
  useEffect(() => {
    if (scanning) {
      startTimeRef.current = Date.now();
      setScanStep(0);
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const nextStep = STEP_TIMES.findLastIndex((t) => elapsed >= t);
        setScanStep(Math.min(nextStep, SCAN_STEPS.length - 1));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scanning]);

  const handleScan = async () => {
    if (images.length === 0) return;
    setScanning(true);
    setError(null);

    try {
      const res = await fetch("/api/inventory/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map((img) => ({
            base64: img.base64,
            mime_type: img.mimeType,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.items?.length > 0) {
        // Save user's scan images for display on confirm/detail pages
        const scanImages = images.map((img) => img.previewUrl);
        sessionStorage.setItem("scanImages", JSON.stringify(scanImages));

        // Attach first user image to each item if no image_url or rakuten_image_url
        const enrichedItems = data.items.map((item: Record<string, unknown>) => ({
          ...item,
          image_url: item.image_url || item.rakuten_image_url || scanImages[0] || undefined,
        }));

        sessionStorage.setItem("scanResult", JSON.stringify(enrichedItems));
        router.push("/scan/confirm");
      } else {
        setError(data.error || "鑑定結果が取得できませんでした。もう一度お試しください。");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("通信エラーが発生しました。エージェントサーバーが起動しているか確認してください。");
    } finally {
      setScanning(false);
    }
  };

  // Check for pending scan results
  const [hasPending, setHasPending] = useState(false);
  useEffect(() => {
    setHasPending(!!sessionStorage.getItem("scanResult"));
  }, []);

  const currentStep = SCAN_STEPS[scanStep];
  const StepIcon = currentStep?.icon ?? ScanLine;

  return (
    <div>
      <PageHeader title="Scan" />

      <div className="mx-auto max-w-md px-4 py-6 space-y-5">
        {/* Pending results notice */}
        {hasPending && !scanning && (
          <button
            onClick={() => router.push("/scan/confirm")}
            className="w-full glass-card rounded-2xl p-3 flex items-center justify-between text-left hover:bg-white/80 transition"
          >
            <div>
              <p className="text-sm font-medium text-alcheme-charcoal">保留中の鑑定結果があります</p>
              <p className="text-xs text-alcheme-muted">タップして確認画面へ</p>
            </div>
            <PackageCheck className="h-5 w-5 text-neon-accent shrink-0" />
          </button>
        )}

        <ScanCamera images={images} onImagesChange={setImages} />

        {/* Scan progress indicator */}
        {scanning && (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            {/* Step dots */}
            <div className="flex justify-center gap-2">
              {SCAN_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-500",
                    i <= scanStep ? "bg-neon-accent scale-110" : "bg-gray-200",
                    i === scanStep && "animate-pulse"
                  )}
                />
              ))}
            </div>

            {/* Current step */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon-accent/10 flex items-center justify-center">
                <StepIcon className="h-5 w-5 text-neon-accent animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-alcheme-charcoal">{currentStep.label}</p>
                <p className="text-xs text-alcheme-muted">{currentStep.sub}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-neon-accent to-purple-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(95, ((scanStep + 1) / SCAN_STEPS.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={images.length === 0 || scanning}
          className="btn-squishy w-full h-14 rounded-2xl relative overflow-hidden shadow-neon-glow group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-center justify-center gap-2 text-white font-body font-bold tracking-wider text-lg">
            <ScanLine className={cn("h-5 w-5", scanning && "animate-spin")} />
            {scanning ? "鑑定中..." : `鑑定スタート（${images.length}枚）`}
          </div>
        </button>
      </div>
    </div>
  );
}
