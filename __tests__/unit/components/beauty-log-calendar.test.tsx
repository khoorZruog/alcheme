import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BeautyLogCalendar } from "@/components/beauty-log-calendar";
import type { BeautyLogEntry } from "@/types/beauty-log";

const mockLog: BeautyLogEntry = {
  id: "2026-02-10",
  date: "2026-02-10",
  used_items: [],
  modifications: [],
  self_rating: 4,
  auto_tags: [],
  created_at: "2026-02-10T00:00:00Z",
  updated_at: "2026-02-10T00:00:00Z",
};

describe("BeautyLogCalendar", () => {
  const defaultProps = {
    year: 2026,
    month: 2,
    logs: [mockLog],
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onDateClick: vi.fn(),
  };

  it("renders month label", () => {
    render(<BeautyLogCalendar {...defaultProps} />);
    expect(screen.getByText("2026年2月")).toBeDefined();
  });

  it("renders weekday headers", () => {
    render(<BeautyLogCalendar {...defaultProps} />);
    expect(screen.getByText("日")).toBeDefined();
    expect(screen.getByText("月")).toBeDefined();
    expect(screen.getByText("土")).toBeDefined();
  });

  it("renders correct number of day cells (Feb 2026 = 28 days)", () => {
    render(<BeautyLogCalendar {...defaultProps} />);
    // Feb 2026 has 28 days
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("28")).toBeDefined();
  });

  it("calls onDateClick when a date is clicked", () => {
    render(<BeautyLogCalendar {...defaultProps} />);
    fireEvent.click(screen.getByText("15"));
    expect(defaultProps.onDateClick).toHaveBeenCalledWith("2026-02-15");
  });

  it("calls onPrevMonth and onNextMonth", () => {
    render(<BeautyLogCalendar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("前月"));
    expect(defaultProps.onPrevMonth).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("翌月"));
    expect(defaultProps.onNextMonth).toHaveBeenCalled();
  });
});
