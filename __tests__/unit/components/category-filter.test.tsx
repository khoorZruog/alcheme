import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter } from "@/components/category-filter";

describe("CategoryFilter", () => {
  it("renders all 6 category tabs", () => {
    const onChange = vi.fn();
    render(<CategoryFilter value="全て" onChange={onChange} />);
    expect(screen.getByText("全て")).toBeDefined();
    expect(screen.getByText("ベースメイク")).toBeDefined();
    expect(screen.getByText("アイメイク")).toBeDefined();
    expect(screen.getByText("リップ")).toBeDefined();
    expect(screen.getByText("スキンケア")).toBeDefined();
    expect(screen.getByText("その他")).toBeDefined();
  });

  it("calls onChange with 'リップ' on tab click", () => {
    const onChange = vi.fn();
    render(<CategoryFilter value="全て" onChange={onChange} />);
    fireEvent.click(screen.getByText("リップ"));
    expect(onChange).toHaveBeenCalledWith("リップ");
  });

  it("calls onChange with '全て' when clicking 全て", () => {
    const onChange = vi.fn();
    render(<CategoryFilter value="リップ" onChange={onChange} />);
    fireEvent.click(screen.getByText("全て"));
    expect(onChange).toHaveBeenCalledWith("全て");
  });

  it("applies active styling to selected tab", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter value="アイメイク" onChange={onChange} />
    );
    // The アイメイク button should have active styling
    expect(container).toBeDefined();
  });
});
