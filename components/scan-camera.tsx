"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CapturedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

interface ScanCameraProps {
  images: CapturedImage[];
  onImagesChange: (images: CapturedImage[]) => void;
  maxImages?: number;
}

const MAX_IMAGES_DEFAULT = 4;

function resizeImage(file: File, maxSize: number): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };

    img.src = url;
  });
}

export function ScanCamera({ images, onImagesChange, maxImages = MAX_IMAGES_DEFAULT }: ScanCameraProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length < maxImages;

  const addImages = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - images.length;
      if (remaining <= 0) return;
      const toProcess = files.slice(0, remaining);
      const newImages: CapturedImage[] = [];
      for (const file of toProcess) {
        const { base64, mimeType } = await resizeImage(file, 1024);
        const previewUrl = `data:${mimeType};base64,${base64}`;
        newImages.push({ base64, mimeType, previewUrl });
      }
      onImagesChange([...images, ...newImages]);
    },
    [images, onImagesChange, maxImages]
  );

  const removeImage = useCallback(
    (index: number) => {
      onImagesChange(images.filter((_, i) => i !== index));
    },
    [images, onImagesChange]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) addImages(files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) addImages(files);
  };

  const mainImage = images[0] ?? null;
  const thumbImages = images.slice(1);

  return (
    <div className="mx-auto max-w-md space-y-3">
      {/* Main preview area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "aspect-4/3 max-h-[50vh] rounded-card bg-alcheme-sand overflow-hidden flex items-center justify-center relative",
          isDragging && "ring-2 ring-alcheme-gold ring-offset-2"
        )}
      >
        {mainImage ? (
          <>
            <img src={mainImage.previewUrl} alt="プレビュー" className="w-full h-full object-contain" />
            <button
              onClick={() => removeImage(0)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
              aria-label="画像を削除"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="text-center text-alcheme-muted">
            <Camera className="mx-auto h-12 w-12 mb-2 opacity-40" />
            <p className="text-sm">画像をドロップまたは選択</p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex gap-2">
          {thumbImages.map((img, i) => (
            <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden bg-alcheme-sand shrink-0">
              <img src={img.previewUrl} alt={`画像${i + 2}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i + 1)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                aria-label="画像を削除"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {canAddMore && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-neon-accent hover:text-neon-accent transition shrink-0"
              aria-label="画像を追加"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          className={cn(
            "flex-1 glass-card bg-white/80 text-text-ink rounded-button font-medium py-3 flex items-center justify-center gap-2 hover:bg-white transition btn-squishy",
            !canAddMore && "opacity-50 pointer-events-none"
          )}
          onClick={() => cameraRef.current?.click()}
          disabled={!canAddMore}
        >
          <Camera className="h-4 w-4" />
          撮影
        </button>
        <button
          className={cn(
            "flex-1 glass-card bg-white/80 text-text-ink rounded-button font-medium py-3 flex items-center justify-center gap-2 hover:bg-white transition btn-squishy",
            !canAddMore && "opacity-50 pointer-events-none"
          )}
          onClick={() => fileRef.current?.click()}
          disabled={!canAddMore}
        >
          <ImagePlus className="h-4 w-4" />
          選択
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />

      <p className="text-center text-xs text-alcheme-muted leading-relaxed">
        複数の角度から撮影すると、より正確に鑑定できます（最大{maxImages}枚）
      </p>
    </div>
  );
}
