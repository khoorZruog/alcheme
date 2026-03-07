import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

import { PageHeader } from "@/components/page-header";

describe("PageHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title", () => {
    render(<PageHeader title="テスト" />);
    expect(screen.getByText("テスト")).toBeDefined();
  });

  it("calls onBack when provided", () => {
    const onBack = vi.fn();
    render(<PageHeader title="テスト" onBack={onBack} />);
    fireEvent.click(screen.getByLabelText("戻る"));
    expect(onBack).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("calls router.push when backHref provided and no onBack", () => {
    render(<PageHeader title="テスト" backHref="/home" />);
    fireEvent.click(screen.getByLabelText("戻る"));
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("calls router.back when neither onBack nor backHref provided", () => {
    render(<PageHeader title="テスト" />);
    fireEvent.click(screen.getByLabelText("戻る"));
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it("renders rightElement when provided", () => {
    render(<PageHeader title="テスト" rightElement={<span data-testid="right">R</span>} />);
    expect(screen.getByTestId("right")).toBeDefined();
  });
});
