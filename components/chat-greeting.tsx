"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/auth-provider";

function getTimeGreeting(hour: number): string {
  if (hour < 11) return "おはようございます";
  if (hour < 17) return "こんにちは";
  return "こんばんは";
}

export function ChatGreeting() {
  const { profile } = useAuth();

  const greeting = useMemo(() => {
    const timeGreeting = getTimeGreeting(new Date().getHours());
    const name = profile?.displayName;
    return name ? `${timeGreeting}、${name}さん！` : `${timeGreeting}！`;
  }, [profile?.displayName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="text-center py-4"
    >
      <p className="text-xl font-bold text-text-ink">{greeting}</p>
      <p className="text-sm text-text-muted mt-1">今日はどんなメイクにしましょうか？</p>
    </motion.div>
  );
}
