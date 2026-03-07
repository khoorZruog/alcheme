/**
 * Tests for FabButton component — NAV-001
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FabButton } from "@/components/fab-button";

vi.mock("@/components/quick-action-sheet", () => ({
  QuickActionSheet: () => null,
}));

describe("FabButton", () => {
  it("renders with correct aria-label", () => {
    render(<FabButton />);
    const button = screen.getByLabelText("クイックアクション");
    expect(button).toBeDefined();
  });
});
