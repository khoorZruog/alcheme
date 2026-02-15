"use client";

import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import useSWR from 'swr';
import { BottomNav } from '@/components/bottom-nav';
import { AuroraBackground } from '@/components/aurora-background';
import { SideMenu } from '@/components/side-menu';
import { SideMenuProvider } from '@/lib/contexts/side-menu-context';
import { fetcher } from '@/lib/api/fetcher';
import type { UserProfile } from '@/types/user';

// Pages where BottomNav should be hidden
const HIDE_NAV_PATTERNS = ['/scan/confirm', '/inventory/', '/profile'];
// Pages that manage their own full-height layout (no pb-28 needed)
const NO_PADDING_PATTERNS = ['/chat'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const { data: profileData } = useSWR<{ profile: UserProfile }>(
    user ? '/api/users/me' : null,
    fetcher
  );

  const hideNav = HIDE_NAV_PATTERNS.some((p) => pathname.startsWith(p));
  const noPadding = NO_PADDING_PATTERNS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lum-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-accent to-magic-pink animate-pulse" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <AuroraBackground />
      <SideMenuProvider value={{ openSideMenu: () => setSideMenuOpen(true) }}>
        <div className={`relative z-10 ${hideNav || noPadding ? '' : 'pb-28'}`}>
          <main>{children}</main>
        </div>
      </SideMenuProvider>
      {!hideNav && <BottomNav />}
      <SideMenu open={sideMenuOpen} onOpenChange={setSideMenuOpen} />
    </div>
  );
}
