"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { MainTabHeader } from "@/components/main-tab-header";
import { CosmeSegmentTabs, type CosmeSegment } from "@/components/cosme-segment-tabs";
import { InventoryHaveView } from "./_components/inventory-have-view";
import { InventoryWantView } from "./_components/inventory-want-view";
import { InventoryGridSkeleton } from "@/components/loading-skeleton";

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const segment = (searchParams.get("tab") as CosmeSegment) || "have";

  const setSegment = (s: CosmeSegment) => {
    const params = new URLSearchParams(searchParams.toString());
    if (s === "have") {
      params.delete("tab");
    } else {
      params.set("tab", s);
    }
    const qs = params.toString();
    router.replace(`/inventory${qs ? "?" + qs : ""}`, { scroll: false });
  };

  return (
    <div className="min-h-full pb-8">
      <MainTabHeader title="My Cosme" subtitle="コスメコレクション">
        <CosmeSegmentTabs value={segment} onChange={setSegment} />
      </MainTabHeader>

      {segment === "have" ? <InventoryHaveView /> : <InventoryWantView />}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-20"><InventoryGridSkeleton /></div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
