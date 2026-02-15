import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MainError from "@/app/(main)/error";

describe("MainError (error boundary)", () => {
  it("renders error message", () => {
    const reset = vi.fn();
    render(<MainError error={new Error("test")} reset={reset} />);
    expect(screen.getByText("エラーが発生しました")).toBeDefined();
  });

  it("calls reset when retry button clicked", () => {
    const reset = vi.fn();
    render(<MainError error={new Error("test")} reset={reset} />);
    fireEvent.click(screen.getByText("再試行"));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("has a link to home", () => {
    const reset = vi.fn();
    render(<MainError error={new Error("test")} reset={reset} />);
    expect(screen.getByText("ホームに戻る")).toBeDefined();
  });
});
