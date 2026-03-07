/**
 * Tests for FeedPostCard component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedPostCard } from "@/components/feed-post-card";
import type { SocialPost } from "@/types/social";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockPost: SocialPost = {
  id: "post-1",
  user_id: "user-1",
  author_display_name: "テストユーザー",
  author_photo_url: null,
  recipe_id: "recipe-1",
  recipe_name: "春のオフィスメイク",
  preview_image_url: "https://example.com/preview.jpg",
  steps_summary: ["ベース作り", "アイメイク", "リップ"],
  character_theme: "cute",
  visibility: "public",
  tags: ["#オフィス", "#イエベ春"],
  like_count: 5,
  comment_count: 3,
  is_liked: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("FeedPostCard", () => {
  it("renders post author name", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("テストユーザー")).toBeDefined();
  });

  it("renders recipe name", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("春のオフィスメイク")).toBeDefined();
  });

  it("renders tags", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("#オフィス")).toBeDefined();
    expect(screen.getByText("#イエベ春")).toBeDefined();
  });

  it("renders steps summary", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("1. ベース作り")).toBeDefined();
    expect(screen.getByText("2. アイメイク")).toBeDefined();
    expect(screen.getByText("3. リップ")).toBeDefined();
  });

  it("renders like count", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("5")).toBeDefined();
  });

  it("renders comment count", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("3")).toBeDefined();
  });

  it("calls onLike when like button clicked", () => {
    const onLike = vi.fn();
    render(<FeedPostCard post={mockPost} onLike={onLike} />);

    // Find and click the like button (first button with Heart icon)
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it("calls onCommentClick when comment button clicked", () => {
    const onCommentClick = vi.fn();
    render(<FeedPostCard post={mockPost} onCommentClick={onCommentClick} />);

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    expect(onCommentClick).toHaveBeenCalledTimes(1);
  });

  it("renders character theme label", () => {
    render(<FeedPostCard post={mockPost} />);
    expect(screen.getByText("キュート")).toBeDefined();
  });

  it("links to post detail and user profile", () => {
    render(<FeedPostCard post={mockPost} />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/profile/user-1");
    expect(hrefs).toContain("/feed/post-1");
  });

  it("shows follow button for non-own, non-followed posts", () => {
    const onFollow = vi.fn();
    render(
      <FeedPostCard
        post={mockPost}
        isOwnPost={false}
        isFollowing={false}
        onFollow={onFollow}
      />
    );
    expect(screen.getByText("フォロー")).toBeDefined();
  });

  it("hides follow button for own posts", () => {
    render(
      <FeedPostCard
        post={mockPost}
        isOwnPost={true}
        isFollowing={false}
        onFollow={() => {}}
      />
    );
    expect(screen.queryByText("フォロー")).toBeNull();
  });

  it("hides follow button when already following", () => {
    render(
      <FeedPostCard
        post={mockPost}
        isOwnPost={false}
        isFollowing={true}
        onFollow={() => {}}
      />
    );
    expect(screen.queryByText("フォロー")).toBeNull();
  });

  it("calls onFollow when follow button is clicked", () => {
    const onFollow = vi.fn();
    render(
      <FeedPostCard
        post={mockPost}
        isOwnPost={false}
        isFollowing={false}
        onFollow={onFollow}
      />
    );
    fireEvent.click(screen.getByText("フォロー"));
    expect(onFollow).toHaveBeenCalledTimes(1);
  });
});
