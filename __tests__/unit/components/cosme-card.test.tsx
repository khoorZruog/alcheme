import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CosmeCard } from "@/components/cosme-card";

describe("CosmeCard", () => {
  const defaultProps = {
    itemId: "item_001",
    brand: "KATE",
    productName: "リップモンスター",
    category: "リップ" as const,
    remainingPercent: 80,
  };

  it("renders brand and product name", () => {
    render(<CosmeCard {...defaultProps} />);
    expect(screen.getByText("KATE")).toBeDefined();
    expect(screen.getByText("リップモンスター")).toBeDefined();
  });

  it("renders category badge", () => {
    const { container } = render(<CosmeCard {...defaultProps} category="アイメイク" />);
    expect(container.textContent).toContain("アイメイク");
    expect(container.innerHTML).toContain("bg-purple-100");
  });

  it("renders remaining bar", () => {
    const { container } = render(<CosmeCard {...defaultProps} remainingPercent={60} />);
    expect(container.innerHTML).toContain("bg-green-400");
  });

  it("applies custom className", () => {
    const { container } = render(
      <CosmeCard {...defaultProps} className="custom-class" />
    );
    expect(container.firstChild).toBeDefined();
  });
});
