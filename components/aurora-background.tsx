"use client";

export function AuroraBackground() {
  return (
    <div className="aurora-container" aria-hidden="true">
      <div className="blob blob-1 animate-blob" />
      <div className="blob blob-2 animate-blob" style={{ animationDelay: "2s" }} />
      <div className="blob blob-3 animate-blob" style={{ animationDelay: "4s" }} />
    </div>
  );
}
