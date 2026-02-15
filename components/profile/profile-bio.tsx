"use client";

import { useState } from "react";

interface ProfileBioProps {
  bio: string | null;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  const [expanded, setExpanded] = useState(false);

  if (!bio) return null;

  return (
    <div className="px-4">
      <p
        className={`text-sm text-text-ink leading-relaxed ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {bio}
      </p>
      {!expanded && bio.length > 80 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-text-muted mt-0.5"
        >
          ...プロフィールを見る
        </button>
      )}
    </div>
  );
}
