"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { MainTabHeader } from "@/components/main-tab-header";
import { InventoryWantView } from "@/app/(main)/inventory/_components/inventory-want-view";

export default function SuggestionsPage() {
  return (
    <div>
      <MainTabHeader
        title="Next Cosme"
        subtitle="SHOP"
        rightElement={
          <Link
            href="/suggestions/add"
            className="w-9 h-9 rounded-full bg-neon-accent/10 text-neon-accent flex items-center justify-center btn-squishy hover:bg-neon-accent/20 transition-colors"
          >
            <Plus size={16} />
          </Link>
        }
      />
      <InventoryWantView />
    </div>
  );
}
