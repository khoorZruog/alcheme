"use client";

import { Globe } from "lucide-react";

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

interface ProfileSocialLinksProps {
  socialLinks?: SocialLinks;
}

export function ProfileSocialLinks({ socialLinks }: ProfileSocialLinksProps) {
  if (!socialLinks) return null;
  const hasAny = Object.values(socialLinks).some(Boolean);
  if (!hasAny) return null;

  return (
    <div className="px-4 flex items-center gap-2 flex-wrap">
      {socialLinks.twitter && (
        <a
          href={`https://x.com/${socialLinks.twitter}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full border border-white/60 bg-white/40 flex items-center justify-center text-text-ink hover:bg-white/70 transition-colors"
          aria-label="X (Twitter)"
        >
          <XIcon />
        </a>
      )}
      {socialLinks.instagram && (
        <a
          href={`https://instagram.com/${socialLinks.instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full border border-white/60 bg-white/40 text-xs font-medium text-text-ink hover:bg-white/70 transition-colors"
        >
          Instagram
        </a>
      )}
      {socialLinks.youtube && (
        <a
          href={socialLinks.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full border border-white/60 bg-white/40 text-xs font-medium text-text-ink hover:bg-white/70 transition-colors"
        >
          YouTube
        </a>
      )}
      {socialLinks.tiktok && (
        <a
          href={`https://tiktok.com/@${socialLinks.tiktok}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full border border-white/60 bg-white/40 text-xs font-medium text-text-ink hover:bg-white/70 transition-colors"
        >
          TikTok
        </a>
      )}
      {socialLinks.website && (
        <a
          href={socialLinks.website}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-full border border-white/60 bg-white/40 text-xs font-medium text-text-ink hover:bg-white/70 transition-colors flex items-center gap-1"
        >
          <Globe className="h-3 w-3" />
          ウェブサイト
        </a>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
