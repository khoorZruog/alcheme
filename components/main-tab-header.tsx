"use client";

import { ProfileAvatar } from "@/components/profile-avatar";
import { useSideMenu } from "@/lib/contexts/side-menu-context";

interface MainTabHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
}

export function MainTabHeader({
  title,
  subtitle,
  rightElement,
  children,
}: MainTabHeaderProps) {
  const { openSideMenu } = useSideMenu();

  return (
    <div className="sticky top-0 z-20 bg-lum-base/90 backdrop-blur-lg border-b border-white/50">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Avatar + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <ProfileAvatar onClick={openSideMenu} />
            <div className="min-w-0">
              <h1 className="font-display italic font-bold text-2xl text-text-ink leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[10px] text-text-muted tracking-widest font-bold uppercase">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right: Action buttons */}
          {rightElement && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {rightElement}
            </div>
          )}
        </div>
      </div>

      {/* Below-title content (e.g. CategoryFilter) */}
      {children && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
