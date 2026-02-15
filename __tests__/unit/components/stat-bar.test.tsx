import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatBar, StatBarGroup } from "@/components/stat-bar";

describe("StatBar", () => {
  it("renders label for pigment", () => {
    render(<StatBar statKey="pigment" value={4} />);
    expect(screen.getByText("発色力")).toBeDefined();
  });

  it("calculates correct width percentage", () => {
    const { container } = render(<StatBar statKey="longevity" value={3} />);
    // value=3, max=5, so width should be 60%
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("60%");
    }
  });

  it("renders max value (100%)", () => {
    const { container } = render(<StatBar statKey="shelf_life" value={5} />);
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("100%");
    }
  });

  it("renders min value (20%)", () => {
    const { container } = render(
      <StatBar statKey="natural_finish" value={1} />
    );
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("20%");
    }
  });
});

describe("StatBarGroup", () => {
  it("renders all 4 stat bars", () => {
    const stats = { pigment: 4, longevity: 3, shelf_life: 5, natural_finish: 2 };
    render(<StatBarGroup stats={stats} />);
    expect(screen.getByText("発色力")).toBeDefined();
    expect(screen.getByText("持続力")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("ナチュラル")).toBeDefined();
  });
});
