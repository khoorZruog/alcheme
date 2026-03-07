/**
 * Tests for ProfileHero component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileHero } from "@/components/profile/profile-hero";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockStats = {
  following_count: 42,
  follower_count: 128,
  total_likes: 356,
};

describe("ProfileHero", () => {
  it("renders display name", () => {
    render(
      <ProfileHero photoUrl={null} displayName="テストユーザー" stats={mockStats} />
    );
    expect(screen.getByText("テストユーザー")).toBeDefined();
  });

  it("renders stat counts", () => {
    render(
      <ProfileHero photoUrl={null} displayName="テスト" stats={mockStats} />
    );
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("128")).toBeDefined();
    expect(screen.getByText("356")).toBeDefined();
  });

  it("renders stat labels", () => {
    render(
      <ProfileHero photoUrl={null} displayName="テスト" stats={mockStats} />
    );
    expect(screen.getByText("フォロー")).toBeDefined();
    expect(screen.getByText("フォロワー")).toBeDefined();
    expect(screen.getByText("いいね・保存")).toBeDefined();
  });

  it("renders tappable links when userId is provided", () => {
    render(
      <ProfileHero
        photoUrl={null}
        displayName="テスト"
        stats={mockStats}
        userId="user-123"
      />
    );
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/social/user-123/following");
    expect(hrefs).toContain("/social/user-123/followers");
  });

  it("renders non-tappable stats when userId is not provided", () => {
    render(
      <ProfileHero photoUrl={null} displayName="テスト" stats={mockStats} />
    );
    const links = screen.queryAllByRole("link");
    expect(links.length).toBe(0);
  });

  it("renders avatar image when photoUrl is provided", () => {
    render(
      <ProfileHero
        photoUrl="https://example.com/photo.jpg"
        displayName="テスト"
        stats={mockStats}
      />
    );
    const img = screen.getByAltText("テスト");
    expect(img.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("renders initial letter when no photoUrl", () => {
    render(
      <ProfileHero photoUrl={null} displayName="Alice" stats={mockStats} />
    );
    expect(screen.getByText("A")).toBeDefined();
  });

  it("formats large counts with K suffix", () => {
    render(
      <ProfileHero
        photoUrl={null}
        displayName="テスト"
        stats={{ following_count: 1500, follower_count: 10000, total_likes: 25000 }}
      />
    );
    expect(screen.getByText("1.5K")).toBeDefined();
    expect(screen.getByText("1.0万")).toBeDefined();
    expect(screen.getByText("2.5万")).toBeDefined();
  });
});
