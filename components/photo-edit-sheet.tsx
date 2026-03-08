"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Sparkles,
  Palette,
  SunMedium,
  RotateCw,
  RotateCcw,
  FlipHorizontal2,
  Check,
  Loader2,
  AlertCircle,
  Undo2,
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Dynamic import — @imgly/background-removal uses WASM+Workers (browser-only)
// Static import crashes SSR / module evaluation on server
const importRemoveBackground = () =>
  import("@imgly/background-removal").then((m) => m.removeBackground);

/* ------------------------------------------------------------------ */
/*  Types & constants                                                  */
/* ------------------------------------------------------------------ */

interface PhotoEditSheetProps {
  imageUrl: string | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (imageUrl: string) => void;
}

type ToolTab = "bg" | "filter" | "adjust" | "rotate";

interface FilterDef {
  id: string;
  label: string;
  css: string;
}

const FILTERS: FilterDef[] = [
  { id: "natural", label: "ナチュラル", css: "none" },
  { id: "warm", label: "ウォーム", css: "sepia(0.15) saturate(1.2) brightness(1.05)" },
  { id: "cool", label: "クール", css: "saturate(0.9) hue-rotate(10deg) brightness(1.05)" },
  { id: "vivid", label: "ビビッド", css: "saturate(1.5) contrast(1.1)" },
  { id: "soft", label: "ソフト", css: "contrast(0.9) brightness(1.1)" },
  { id: "mono", label: "モノクロ", css: "grayscale(1)" },
];

const TOOLS: { id: ToolTab; icon: typeof Sparkles; label: string }[] = [
  { id: "bg", icon: Sparkles, label: "背景除去" },
  { id: "filter", icon: Palette, label: "フィルター" },
  { id: "adjust", icon: SunMedium, label: "調整" },
  { id: "rotate", icon: RotateCw, label: "回転" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/** Browser-side background removal + 512x512 white-bg normalization */
async function removeBackgroundClient(dataUrl: string): Promise<string> {
  const removeBackground = await importRemoveBackground();
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const resultBlob = await removeBackground(blob, {
    output: { format: "image/png" },
  });
  const img = new window.Image();
  const url = URL.createObjectURL(resultBlob);
  return new Promise((resolve) => {
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(0, 0, 512, 512);
      const pad = 16;
      const size = 512 - pad * 2;
      const scale = Math.min(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.src = url;
  });
}

export function PhotoEditSheet({ imageUrl, open, onClose, onConfirm }: PhotoEditSheetProps) {
  // Background removal (browser-side)
  const [bgRemovedUrl, setBgRemovedUrl] = useState<string | null>(null);
  const [useBgRemoved, setUseBgRemoved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Filters & adjustments
  const [activeFilter, setActiveFilter] = useState("natural");
  const [brightness, setBrightness] = useState(1.0);
  const [contrast, setContrast] = useState(1.0);
  const [saturation, setSaturation] = useState(1.0);

  // Rotation
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // UI
  const [activeTab, setActiveTab] = useState<ToolTab>("bg");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset state when sheet opens with a new image
  useEffect(() => {
    if (open) {
      setBgRemovedUrl(null);
      setUseBgRemoved(false);
      setActiveFilter("natural");
      setBrightness(1.0);
      setContrast(1.0);
      setSaturation(1.0);
      setRotation(0);
      setFlipped(false);
      setActiveTab("bg");
    }
  }, [open, imageUrl]);

  // Current source image (original or bg-removed)
  const sourceUrl = useBgRemoved && bgRemovedUrl ? bgRemovedUrl : imageUrl;

  // Combined CSS filter string
  const filterDef = FILTERS.find((f) => f.id === activeFilter);
  const cssFilter = buildCssFilter(filterDef?.css ?? "none", brightness, contrast, saturation);

  // CSS transform for rotation + flip
  const cssTransform = buildTransform(rotation, flipped);

  /* ---- Handlers ---- */

  const handleBgRemove = useCallback(async () => {
    if (!imageUrl) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      const result = await removeBackgroundClient(imageUrl);
      setBgRemovedUrl(result);
      setUseBgRemoved(true);
    } catch {
      setProcessError("背景除去に失敗しました。もう一度お試しください。");
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl]);

  const handleConfirm = useCallback(() => {
    if (!sourceUrl) return;

    // Render final image to canvas with all transformations
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const size = 1024;
      const isRotated90 = rotation === 90 || rotation === 270;
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, size, size);

      // Apply CSS filter equivalent
      ctx.filter = cssFilter === "none" ? "none" : cssFilter;

      // Apply rotation + flip
      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipped) ctx.scale(-1, 1);

      const drawW = isRotated90 ? size : size;
      const drawH = isRotated90 ? size : size;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      onConfirm(dataUrl);
    };
    img.crossOrigin = "anonymous";
    img.src = sourceUrl;
  }, [sourceUrl, cssFilter, rotation, flipped, onConfirm]);

  if (!imageUrl) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-card max-h-[92dvh] p-0 flex flex-col"
        hideClose
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="text-sm text-alcheme-muted hover:text-alcheme-charcoal"
          >
            キャンセル
          </button>
          <span className="text-sm font-medium text-alcheme-charcoal">画像を編集</span>
          <button
            onClick={handleConfirm}
            className="text-sm font-bold text-neon-accent"
          >
            完了
          </button>
        </div>

        {/* ── Image preview ── */}
        <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0">
          <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-gray-50">
            <img
              src={sourceUrl || ""}
              alt="プレビュー"
              className="w-full h-full object-contain transition-all duration-200"
              style={{
                filter: cssFilter,
                transform: cssTransform,
              }}
            />
          </div>
        </div>

        {/* ── Tool tabs ── */}
        <div className="flex justify-around px-4 py-2 border-t border-gray-100">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                activeTab === id
                  ? "text-neon-accent"
                  : "text-alcheme-muted hover:text-alcheme-charcoal"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* ── Tool panel ── */}
        <div className="px-4 pb-6 pt-2 min-h-[120px]">
          {activeTab === "bg" && (
            <BgRemovePanel
              isProcessing={isProcessing}
              isDone={!!bgRemovedUrl}
              useBgRemoved={useBgRemoved}
              error={processError}
              onRemove={handleBgRemove}
              onToggle={() => setUseBgRemoved(!useBgRemoved)}
            />
          )}

          {activeTab === "filter" && (
            <FilterPanel
              imageUrl={sourceUrl}
              activeFilter={activeFilter}
              onSelect={setActiveFilter}
            />
          )}

          {activeTab === "adjust" && (
            <AdjustPanel
              brightness={brightness}
              contrast={contrast}
              saturation={saturation}
              onBrightness={setBrightness}
              onContrast={setContrast}
              onSaturation={setSaturation}
            />
          )}

          {activeTab === "rotate" && (
            <RotatePanel
              rotation={rotation}
              flipped={flipped}
              onRotate={setRotation}
              onFlip={() => setFlipped(!flipped)}
            />
          )}
        </div>

        {/* Hidden canvas for final rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-panels                                                         */
/* ------------------------------------------------------------------ */

function BgRemovePanel({
  isProcessing,
  isDone,
  useBgRemoved,
  error,
  onRemove,
  onToggle,
}: {
  isProcessing: boolean;
  isDone: boolean;
  useBgRemoved: boolean;
  error: string | null;
  onRemove: () => void;
  onToggle: () => void;
}) {
  if (isProcessing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-neon-accent animate-spin" />
          <div>
            <p className="text-sm font-medium text-alcheme-charcoal">背景を除去中...</p>
            <p className="text-xs text-alcheme-muted">AIが商品を検出しています</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-linear-to-r from-neon-accent to-purple-500 animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <Button onClick={onRemove} variant="outline" className="w-full rounded-button">
          もう一度試す
        </Button>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="flex gap-3">
        <Button
          onClick={onToggle}
          variant={useBgRemoved ? "default" : "outline"}
          className={cn(
            "flex-1 rounded-button",
            useBgRemoved && "bg-neon-accent hover:bg-neon-accent/90 text-white"
          )}
        >
          <Check className="h-4 w-4 mr-1.5" />
          除去済み
        </Button>
        <Button
          onClick={onToggle}
          variant={!useBgRemoved ? "default" : "outline"}
          className={cn(
            "flex-1 rounded-button",
            !useBgRemoved && "bg-alcheme-charcoal hover:bg-alcheme-charcoal/90 text-white"
          )}
        >
          <Undo2 className="h-4 w-4 mr-1.5" />
          オリジナル
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={onRemove}
      className="btn-squishy w-full h-12 rounded-2xl relative overflow-hidden shadow-neon-glow"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-neon-accent via-purple-500 to-neon-accent opacity-90" />
      <div className="relative z-10 flex items-center justify-center gap-2 text-white font-body font-bold text-sm">
        <Sparkles className="h-4 w-4" />
        背景を除去する
      </div>
    </button>
  );
}

function FilterPanel({
  imageUrl,
  activeFilter,
  onSelect,
}: {
  imageUrl: string | null;
  activeFilter: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          className={cn(
            "flex flex-col items-center gap-1 shrink-0 transition-all",
            activeFilter === f.id ? "opacity-100" : "opacity-60"
          )}
        >
          <div
            className={cn(
              "w-14 h-14 rounded-xl overflow-hidden border-2 transition-colors bg-gray-50",
              activeFilter === f.id ? "border-neon-accent" : "border-transparent"
            )}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={f.label}
                className="w-full h-full object-cover"
                style={{ filter: f.css === "none" ? undefined : f.css }}
              />
            )}
          </div>
          <span
            className={cn(
              "text-[10px] font-medium",
              activeFilter === f.id ? "text-neon-accent" : "text-alcheme-muted"
            )}
          >
            {f.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function AdjustPanel({
  brightness,
  contrast,
  saturation,
  onBrightness,
  onContrast,
  onSaturation,
}: {
  brightness: number;
  contrast: number;
  saturation: number;
  onBrightness: (v: number) => void;
  onContrast: (v: number) => void;
  onSaturation: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <SliderRow label="明るさ" value={brightness} min={0.5} max={1.5} step={0.05} onChange={onBrightness} />
      <SliderRow label="コントラスト" value={contrast} min={0.5} max={1.5} step={0.05} onChange={onContrast} />
      <SliderRow label="彩度" value={saturation} min={0} max={2} step={0.05} onChange={onSaturation} />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-alcheme-muted w-16 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-neon-accent"
      />
      <span className="text-xs text-alcheme-charcoal w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function RotatePanel({
  rotation,
  flipped,
  onRotate,
  onFlip,
}: {
  rotation: number;
  flipped: boolean;
  onRotate: (deg: number) => void;
  onFlip: () => void;
}) {
  return (
    <div className="flex justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRotate((rotation + 270) % 360)}
        className="rounded-button gap-1.5"
      >
        <RotateCcw className="h-4 w-4" />
        左90°
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRotate((rotation + 90) % 360)}
        className="rounded-button gap-1.5"
      >
        <RotateCw className="h-4 w-4" />
        右90°
      </Button>
      <Button
        variant={flipped ? "default" : "outline"}
        size="sm"
        onClick={onFlip}
        className={cn("rounded-button gap-1.5", flipped && "bg-neon-accent text-white")}
      >
        <FlipHorizontal2 className="h-4 w-4" />
        反転
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildCssFilter(
  presetFilter: string,
  brightness: number,
  contrast: number,
  saturation: number,
): string {
  const parts: string[] = [];

  // Preset filter components
  if (presetFilter && presetFilter !== "none") {
    parts.push(presetFilter);
  }

  // Manual adjustments (only add if not default)
  if (Math.abs(brightness - 1.0) > 0.01) parts.push(`brightness(${brightness})`);
  if (Math.abs(contrast - 1.0) > 0.01) parts.push(`contrast(${contrast})`);
  if (Math.abs(saturation - 1.0) > 0.01) parts.push(`saturate(${saturation})`);

  return parts.length > 0 ? parts.join(" ") : "none";
}

function buildTransform(rotation: number, flipped: boolean): string {
  const parts: string[] = [];
  if (rotation) parts.push(`rotate(${rotation}deg)`);
  if (flipped) parts.push("scaleX(-1)");
  return parts.length > 0 ? parts.join(" ") : "none";
}
