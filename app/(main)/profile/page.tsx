"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OwnProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mypage");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-accent to-magic-pink animate-pulse" />
        <p className="text-text-muted text-sm">リダイレクト中...</p>
      </div>
    </div>
  );
}
