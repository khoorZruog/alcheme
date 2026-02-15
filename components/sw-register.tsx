"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/register-sw";

export function SwRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
