import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeShortcutGrid } from "@/components/home-shortcut-grid";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("HomeShortcutGrid", () => {
  it("renders 6 shortcut links", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
  });

  it("includes AI診断 link to /chat", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/chat");
  });

  it("includes ランキング link to /add/community", () => {
    render(<HomeShortcutGrid />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/add/community");
  });

  it("renders all shortcut labels", () => {
    render(<HomeShortcutGrid />);
    expect(screen.getByText("AI診断")).toBeDefined();
    expect(screen.getByText("ランキング")).toBeDefined();
    expect(screen.getByText("レシピ")).toBeDefined();
    expect(screen.getByText("スキャン")).toBeDefined();
    expect(screen.getByText("メイク日記")).toBeDefined();
    expect(screen.getByText("My Cosme")).toBeDefined();
  });
});
