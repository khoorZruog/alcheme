"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export interface AutocompleteSuggestion {
  label: string;
  source?: "inventory" | "catalog";
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: AutocompleteSuggestion[];
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  /** Show source badges (手持ち / みんなの登録) */
  showSource?: boolean;
  /** Minimum query length to show dropdown (default: 1) */
  minQueryLength?: number;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  isLoading,
  placeholder,
  className,
  showSource,
  minQueryLength = 1,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showDropdown = open && value.length >= minQueryLength && suggestions.length > 0;

  const handleSelect = useCallback(
    (label: string) => {
      onChange(label);
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Enter" && showDropdown) {
        e.preventDefault();
        handleSelect(suggestions[0].label);
      }
    },
    [showDropdown, suggestions, handleSelect],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={
            className ??
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          }
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-text-muted" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.label}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.label)}
              className="w-full text-left px-3 py-2 text-sm text-text-ink hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span className="truncate">{s.label}</span>
              {showSource && s.source && (
                <span
                  className={`shrink-0 text-[10px] px-1.5 rounded-full ${
                    s.source === "inventory"
                      ? "text-amber-600 bg-amber-50"
                      : "text-neon-accent bg-neon-accent/10"
                  }`}
                >
                  {s.source === "inventory" ? "手持ち" : "みんなの登録"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
