"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ProfileRowProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  summary?: string;
}

export function ProfileRow({ icon, label, href, summary }: ProfileRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between py-3 group transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-text-muted">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-ink">{label}</p>
          {summary && (
            <p className="text-xs text-text-muted truncate">{summary}</p>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-text-muted shrink-0 group-hover:text-text-ink transition-colors" />
    </Link>
  );
}
