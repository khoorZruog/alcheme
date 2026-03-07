import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CosmeInsightsCard } from "@/components/cosme-insights-card";
import type { CosmeInsight } from "@/lib/cosme-usage-insights";
import type { InventoryItem } from "@/types/inventory";

function makeItem(id: string): InventoryItem {
  return {
    id,
    category: "アイメイク",
    item_type: "アイシャドウ（パウダー）",
    brand: "CANMAKE",
    product_name: "スタイリストアイズ",
    color_description: "",
    texture: "シマー",
    estimated_remaining: "80%",
    confidence: "high",
    source: "scan",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
  };
}

const insights: CosmeInsight[] = [
  {
    type: "new_unused",
    item: makeItem("new1"),
    label: "新しく入手",
    description: "2日前に登録、まだ使っていません",
    priority: 1,
  },
  {
    type: "dormant",
    item: { ...makeItem("dorm1"), brand: "MAC", product_name: "リップティント" },
    label: "しばらく未使用",
    description: "最後に使ったのは35日前です",
    priority: 3,
  },
];

describe("CosmeInsightsCard", () => {
  it("renders nothing when no insights", () => {
    const { container } = render(
      <CosmeInsightsCard insights={[]} onTap={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders section title and insight cards", () => {
    render(<CosmeInsightsCard insights={insights} onTap={() => {}} />);
    expect(screen.getByText("使ってみませんか？")).toBeTruthy();
    expect(screen.getByText("新しく入手")).toBeTruthy();
    expect(screen.getByText("しばらく未使用")).toBeTruthy();
  });

  it("shows brand and product name", () => {
    render(<CosmeInsightsCard insights={insights} onTap={() => {}} />);
    expect(screen.getByText("CANMAKE スタイリストアイズ")).toBeTruthy();
    expect(screen.getByText("MAC リップティント")).toBeTruthy();
  });

  it("calls onTap with the insight when clicked", () => {
    const onTap = vi.fn();
    render(<CosmeInsightsCard insights={insights} onTap={onTap} />);

    const firstCard = screen.getByText("CANMAKE スタイリストアイズ").closest("button");
    fireEvent.click(firstCard!);

    expect(onTap).toHaveBeenCalledWith(
      expect.objectContaining({ type: "new_unused", item: expect.objectContaining({ id: "new1" }) })
    );
  });
});
