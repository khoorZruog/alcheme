/**
 * Tests for BottomNav component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/chat",
}));

vi.mock("@/components/quick-action-sheet", () => ({
  QuickActionSheet: () => null,
}));

describe("BottomNav", () => {
  it("renders feed tab with correct href", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/feed");
  });

  it("renders mypage tab with correct href", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/mypage");
  });

  it("renders chat tab with correct href", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/chat");
  });

  it("renders inventory tab with correct href", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/inventory");
  });

  it("does not render recipe tab", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).not.toContain("/recipes");
  });

  it("renders center plus button", () => {
    render(<BottomNav />);
    const button = screen.getByLabelText("クイックアクション");
    expect(button).toBeDefined();
  });
});
