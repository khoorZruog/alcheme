/**
 * Tests for useFeed hook
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFeed } from "@/hooks/use-feed";

const mockUseSWRInfinite = vi.fn();

vi.mock("swr/infinite", () => ({
  default: (...args: any[]) => mockUseSWRInfinite(...args),
}));

vi.mock("@/lib/api/fetcher", () => ({
  fetcher: vi.fn(),
}));

describe("useFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty posts when loading", () => {
    mockUseSWRInfinite.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      size: 1,
      setSize: vi.fn(),
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useFeed("all"));

    expect(result.current.posts).toHaveLength(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasMore).toBe(false);
  });

  it("returns posts from multiple pages", () => {
    const page1 = {
      posts: [
        { id: "1", recipe_name: "レシピ1" },
        { id: "2", recipe_name: "レシピ2" },
      ],
      next_cursor: "2025-01-01T00:00:00.000Z",
      count: 2,
    };
    const page2 = {
      posts: [
        { id: "3", recipe_name: "レシピ3" },
      ],
      next_cursor: null,
      count: 1,
    };

    mockUseSWRInfinite.mockReturnValue({
      data: [page1, page2],
      error: undefined,
      isLoading: false,
      isValidating: false,
      size: 2,
      setSize: vi.fn(),
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useFeed("all"));

    expect(result.current.posts).toHaveLength(3);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isEmpty).toBe(false);
  });

  it("detects empty feed", () => {
    mockUseSWRInfinite.mockReturnValue({
      data: [{ posts: [], next_cursor: null, count: 0 }],
      error: undefined,
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: vi.fn(),
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useFeed("all"));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.posts).toHaveLength(0);
  });

  it("detects hasMore when cursor exists", () => {
    mockUseSWRInfinite.mockReturnValue({
      data: [{ posts: [{ id: "1" }], next_cursor: "cursor-value", count: 1 }],
      error: undefined,
      isLoading: false,
      isValidating: false,
      size: 1,
      setSize: vi.fn(),
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useFeed("all"));

    expect(result.current.hasMore).toBe(true);
  });
});
