/**
 * Tests for BottomNav component — NAV-001 restructure
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
  usePathname: () => "/feed",
}));

describe("BottomNav", () => {
  it("renders home tab with href /feed", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/feed");
  });

  it("renders discover tab with href /add/community", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/add/community");
  });

  it("renders AI chat tab with href /chat (center)", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/chat");
  });

  it("renders Next Cosme tab with href /suggestions", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/suggestions");
  });

  it("renders mypage tab with href /mypage", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/mypage");
  });

  it("does not render inventory tab (moved to side menu)", () => {
    render(<BottomNav />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).not.toContain("/inventory");
  });

  it("does not render center plus button (moved to FAB)", () => {
    render(<BottomNav />);
    const button = screen.queryByLabelText("クイックアクション");
    expect(button).toBeNull();
  });
});
