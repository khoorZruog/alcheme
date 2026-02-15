"use client";

import { useRef } from "react";
import { ArrowUp, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string, imageBase64?: string, imageMimeType?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({ value, onChange, onSend, disabled, className }: ChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const mimeType = file.type || "image/jpeg";
      onSend(value.trim() || "この画像のコスメを鑑定してください", base64, mimeType);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className={cn("fixed bottom-24 left-4 right-4 z-40", className)}>
      <div className="mx-auto max-w-2xl">
        <div className="glass-panel rounded-full p-2 pl-5 flex items-center gap-3 shadow-xl ring-1 ring-white/50">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 text-text-muted hover:text-neon-accent transition-colors"
            aria-label="画像を添付"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="今日はどんな気分？"
            className="flex-1 bg-transparent border-none focus:outline-none text-text-ink placeholder-text-muted text-base font-body font-medium"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shadow-md btn-squishy transition-all",
              value.trim() && !disabled
                ? "bg-text-ink text-white"
                : "bg-gray-200 text-gray-400"
            )}
            aria-label="送信"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
