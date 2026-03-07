/**
 * Tests for useFollowList hook
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFollowList } from "@/hooks/use-follow-list";
import type { FollowInfo } from "@/types/social";

const mockUsers: FollowInfo[] = [
  {
    user_id: "user-1",
    display_name: "ユーザー1",
    photo_url: null,
    is_following: true,
  },
  {
    user_id: "user-2",
    display_name: "ユーザー2",
    photo_url: "https://example.com/photo.jpg",
    is_following: false,
  },
];

const mockMutate = vi.fn();

vi.mock("swr", () => ({
  default: vi.fn((key: string | null) => {
    if (!key) return { data: undefined, isLoading: false, mutate: mockMutate };
    return {
      data: { users: mockUsers, count: mockUsers.length },
      isLoading: false,
      mutate: mockMutate,
    };
  }),
}));

vi.mock("@/lib/api/fetcher", () => ({
  fetcher: vi.fn(),
}));

describe("useFollowList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns users and count when userId is provided", () => {
    const { result } = renderHook(() => useFollowList("user-123", "followers"));
    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.count).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it("returns empty array when userId is null", () => {
    const { result } = renderHook(() => useFollowList("", "following"));
    expect(result.current.users).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("exposes mutate function for revalidation", () => {
    const { result } = renderHook(() => useFollowList("user-123", "following"));
    expect(result.current.mutate).toBeDefined();
    result.current.mutate();
    expect(mockMutate).toHaveBeenCalled();
  });

  it("works with followers type", () => {
    const { result } = renderHook(() => useFollowList("user-123", "followers"));
    expect(result.current.users.length).toBe(2);
  });

  it("works with following type", () => {
    const { result } = renderHook(() => useFollowList("user-123", "following"));
    expect(result.current.users.length).toBe(2);
  });
});
