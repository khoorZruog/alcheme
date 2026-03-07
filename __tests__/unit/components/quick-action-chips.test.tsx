import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickActionChips } from "@/components/quick-action-chips";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe("QuickActionChips", () => {
  const onSelect = vi.fn();

  it("renders 6 data-driven chips when visible", () => {
    render(<QuickActionChips visible={true} onSelect={onSelect} />);
    expect(screen.getByText(/メイクテーマ提案/)).toBeDefined();
    expect(screen.getByText(/今日のメイクおみくじ/)).toBeDefined();
    expect(screen.getByText(/おまかせ提案/)).toBeDefined();
    expect(screen.getByText(/手持ちコスメで新コンビ/)).toBeDefined();
    expect(screen.getByText(/眠ってるコスメ活用/)).toBeDefined();
    expect(screen.getByText(/今日の天気に合うメイク/)).toBeDefined();
  });

  it("does not render when not visible", () => {
    render(<QuickActionChips visible={false} onSelect={onSelect} />);
    expect(screen.queryByText(/おまかせ提案/)).toBeNull();
  });

  it("calls onSelect with chip text when clicked", () => {
    render(<QuickActionChips visible={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/おまかせ提案/));
    expect(onSelect).toHaveBeenCalledWith("おまかせ提案", undefined);
  });

  it("calls onSelect for weather chip", () => {
    render(<QuickActionChips visible={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/今日の天気に合うメイク/));
    expect(onSelect).toHaveBeenCalledWith("今日の天気に合うメイク", undefined);
  });

  it("calls onSelect with 'theme' action for theme chip", () => {
    render(<QuickActionChips visible={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/メイクテーマ提案/));
    expect(onSelect).toHaveBeenCalledWith("メイクテーマ提案", "theme");
  });

  it("calls onSelect with 'omikuji' action for omikuji chip", () => {
    render(<QuickActionChips visible={true} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/今日のメイクおみくじ/));
    expect(onSelect).toHaveBeenCalledWith("今日のメイクおみくじ", "omikuji");
  });
});
