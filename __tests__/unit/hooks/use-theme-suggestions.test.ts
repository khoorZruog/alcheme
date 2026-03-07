import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useThemeSuggestions } from "@/hooks/use-theme-suggestions";

const mockThemes = [
  {
    id: "t1",
    title: "透明感メイク",
    description: "春の陽射しに映える透明感メイク",
    style_keywords: ["ナチュラル", "透明感"],
    character_theme: "cute",
    status: "active",
    created_at: "2026-02-22T00:00:00Z",
    updated_at: "2026-02-22T00:00:00Z",
  },
  {
    id: "t2",
    title: "クールビューティー",
    description: "クールで洗練されたメイク",
    style_keywords: ["クール", "洗練"],
    character_theme: "cool",
    status: "active",
    created_at: "2026-02-22T00:00:00Z",
    updated_at: "2026-02-22T00:00:00Z",
  },
];

describe("useThemeSuggestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("generates themes via API call", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "success", themes: mockThemes }),
    } as Response);

    // Mock image generation responses (fire and forget)
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, image_url: "https://example.com/img.webp" }),
    } as Response);

    const { result } = renderHook(() => useThemeSuggestions());

    expect(result.current.themes).toHaveLength(0);
    expect(result.current.isGenerating).toBe(false);

    await act(async () => {
      await result.current.generateThemes();
    });

    expect(result.current.themes).toHaveLength(2);
    expect(result.current.themes[0].title).toBe("透明感メイク");
    expect(fetchSpy).toHaveBeenCalledWith("/api/themes", { method: "POST" });
  });

  it("updates theme status via PATCH API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // First call: generate themes
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "success", themes: mockThemes }),
    } as Response);

    // Image generation calls
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const { result } = renderHook(() => useThemeSuggestions());

    await act(async () => {
      await result.current.generateThemes();
    });

    // Reset mock to track status update call
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "success" }),
    } as Response);

    await act(async () => {
      await result.current.updateStatus("t1", "liked");
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/themes/t1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "liked" }),
      })
    );

    // Check state was updated
    const updatedTheme = result.current.themes.find((t) => t.id === "t1");
    expect(updatedTheme?.status).toBe("liked");
  });
});
