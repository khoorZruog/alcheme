import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecipe } from "@/hooks/use-recipe";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Override the global SWR mock for this test
vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: { recipe: { id: "r1", feedback: null } },
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  })),
}));

describe("useRecipe submitFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows success toast on successful feedback", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useRecipe("r1"));
    await act(() => result.current.submitFeedback("liked"));

    expect(toast.success).toHaveBeenCalledWith("フィードバックを送信しました");
  });

  it("shows error toast on failed feedback", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const { result } = renderHook(() => useRecipe("r1"));
    await act(() => result.current.submitFeedback("liked"));

    expect(toast.error).toHaveBeenCalledWith("フィードバックの送信に失敗しました");
  });

  it("shows error toast on network failure", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useRecipe("r1"));
    await act(() => result.current.submitFeedback("disliked"));

    expect(toast.error).toHaveBeenCalledWith("フィードバックの送信に失敗しました");
  });
});
