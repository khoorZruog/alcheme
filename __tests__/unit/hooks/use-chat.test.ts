import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock fetch for SSE
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { useChat } from "@/hooks/use-chat";

describe("useChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with welcome message", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages.length).toBeGreaterThanOrEqual(1);
    expect(result.current.messages[0].role).toBe("assistant");
  });

  it("provides sendMessage function", () => {
    const { result } = renderHook(() => useChat());
    expect(typeof result.current.sendMessage).toBe("function");
  });

  it("provides inputValue and setInputValue", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.inputValue).toBe("");
    act(() => {
      result.current.setInputValue("テスト");
    });
    expect(result.current.inputValue).toBe("テスト");
  });

  it("starts with isLoading = false", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.isLoading).toBe(false);
  });

  it("adds user message on sendMessage", async () => {
    // Mock SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text_delta", data: "返答" })}\n\n`
          )
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "done", data: "" })}\n\n`
          )
        );
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      body: stream,
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.sendMessage("こんにちは");
    });

    // Should have welcome + user message + assistant response
    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
  });
});
