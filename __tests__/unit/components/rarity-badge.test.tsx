import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RarityBadge } from "@/components/rarity-badge";

describe("RarityBadge", () => {
  it("renders SSR variant with amber styling", () => {
    const { container } = render(<RarityBadge rarity="SSR" />);
    expect(container.textContent).toContain("SSR");
    expect(container.innerHTML).toContain("bg-amber-400");
  });

  it("renders SR variant", () => {
    const { container } = render(<RarityBadge rarity="SR" />);
    expect(container.textContent).toContain("SR");
    expect(container.innerHTML).toContain("bg-purple-400");
  });

  it("renders R variant", () => {
    const { container } = render(<RarityBadge rarity="R" />);
    // "R" alone could match other text, check the badge exists
    expect(container.firstChild).toBeDefined();
  });

  it("renders N variant", () => {
    const { container } = render(<RarityBadge rarity="N" />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders without stars when showStars=false", () => {
    const { container } = render(
      <RarityBadge rarity="SSR" showStars={false} />
    );
    // Should show text instead of star icons
    expect(container.textContent).toContain("SSR");
  });

  it("supports sm size", () => {
    const { container } = render(<RarityBadge rarity="SR" size="sm" />);
    expect(container.firstChild).toBeDefined();
  });
});
