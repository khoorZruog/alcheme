import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  computeCosmeInsights,
  getLastUsedDate,
  isExpiringSoon,
} from "@/lib/cosme-usage-insights";
import type { InventoryItem } from "@/types/inventory";
import type { BeautyLogEntry } from "@/types/beauty-log";

// Fix "today" for deterministic tests
const FIXED_NOW = new Date("2026-02-22T10:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

function makeItem(overrides: Partial<InventoryItem> & { id: string }): InventoryItem {
  return {
    category: "アイメイク",
    item_type: "アイシャドウ（パウダー）",
    brand: "TestBrand",
    product_name: "TestProduct",
    color_description: "",
    texture: "シマー",
    estimated_remaining: "80%",
    confidence: "high",
    source: "scan",
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<BeautyLogEntry> & { date: string }): BeautyLogEntry {
  return {
    id: overrides.date,
    used_items: [],
    modifications: [],
    photos: [],
    auto_tags: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getLastUsedDate", () => {
  it("returns null when item never used", () => {
    const logs = [makeLog({ date: "2026-02-20", used_items: ["other"] })];
    expect(getLastUsedDate("item1", logs)).toBeNull();
  });

  it("returns the latest usage date", () => {
    const logs = [
      makeLog({ date: "2026-02-10", used_items: ["item1"] }),
      makeLog({ date: "2026-02-18", used_items: ["item1", "item2"] }),
      makeLog({ date: "2026-02-15", used_items: ["item1"] }),
    ];
    expect(getLastUsedDate("item1", logs)).toBe("2026-02-18");
  });
});

describe("isExpiringSoon", () => {
  it("returns false when no open_date", () => {
    const item = makeItem({ id: "i1" });
    expect(isExpiringSoon(item)).toBe(false);
  });

  it("returns true when PAO expiry is within 30 days", () => {
    // PAO for アイシャドウ（パウダー） = 12 months
    // open_date = 2025-03-01 → expiry = 2026-03-01 → 7 days from now
    const item = makeItem({ id: "i1", open_date: "2025-03-01" });
    expect(isExpiringSoon(item)).toBe(true);
  });

  it("returns false when not expiring soon", () => {
    // open_date = 2026-01-01 → expiry = 2027-01-01 → 313 days from now
    const item = makeItem({ id: "i1", open_date: "2026-01-01" });
    expect(isExpiringSoon(item)).toBe(false);
  });
});

describe("computeCosmeInsights", () => {
  it("returns empty array for empty inventory", () => {
    expect(computeCosmeInsights([], [])).toEqual([]);
  });

  it("detects new_unused items", () => {
    // Created 3 days ago, never used
    const item = makeItem({ id: "new1", created_at: "2026-02-19T00:00:00Z" });
    const insights = computeCosmeInsights([item], []);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("new_unused");
    expect(insights[0].item.id).toBe("new1");
  });

  it("does not flag new_unused if item was used", () => {
    const item = makeItem({ id: "new1", created_at: "2026-02-19T00:00:00Z" });
    const logs = [makeLog({ date: "2026-02-20", used_items: ["new1"] })];
    const insights = computeCosmeInsights([item], logs);
    // Should have no new_unused, but might have dormant etc.
    const newInsights = insights.filter((i) => i.type === "new_unused");
    expect(newInsights).toHaveLength(0);
  });

  it("detects expiring items", () => {
    // PAO = 12 months, opened 2025-02-01 → expires 2026-02-01 → already past
    // Opened 2025-02-10 → expires 2026-02-10 → already past
    // Opened 2025-03-01 → expires 2026-03-01 → 7 days away → should detect
    const item = makeItem({ id: "exp1", open_date: "2025-03-01", created_at: "2025-03-01T00:00:00Z" });
    const insights = computeCosmeInsights([item], []);
    const expiring = insights.filter((i) => i.type === "expiring");
    expect(expiring).toHaveLength(1);
  });

  it("detects dormant items", () => {
    // Last used 35 days ago
    const item = makeItem({ id: "dorm1", created_at: "2026-01-01T00:00:00Z" });
    const logs = [makeLog({ date: "2026-01-18", used_items: ["dorm1"] })];
    const insights = computeCosmeInsights([item], logs);
    const dormant = insights.filter((i) => i.type === "dormant");
    expect(dormant).toHaveLength(1);
    expect(dormant[0].item.id).toBe("dorm1");
  });

  it("detects duplicate items", () => {
    const item1 = makeItem({ id: "dup1", product_id: "prod1", created_at: "2026-01-01T00:00:00Z" });
    const item2 = makeItem({ id: "dup2", product_id: "prod1", created_at: "2026-01-01T00:00:00Z" });
    // Need to also use them so they're not flagged as new_unused
    const logs = [
      makeLog({ date: "2026-02-21", used_items: ["dup1", "dup2"] }),
    ];
    const insights = computeCosmeInsights([item1, item2], logs);
    const duplicates = insights.filter((i) => i.type === "duplicate");
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
  });

  it("detects low_remaining items used frequently", () => {
    const item = makeItem({
      id: "low1",
      estimated_remaining: "15%",
      created_at: "2026-01-01T00:00:00Z",
    });
    // Used 4 times in the last 14 days
    const logs = [
      makeLog({ date: "2026-02-12", used_items: ["low1"] }),
      makeLog({ date: "2026-02-15", used_items: ["low1"] }),
      makeLog({ date: "2026-02-18", used_items: ["low1"] }),
      makeLog({ date: "2026-02-21", used_items: ["low1"] }),
    ];
    const insights = computeCosmeInsights([item], logs);
    const low = insights.filter((i) => i.type === "low_remaining");
    expect(low).toHaveLength(1);
  });

  it("limits to 10 insights and deduplicates by item", () => {
    // Create 12 new unused items
    const items = Array.from({ length: 12 }, (_, i) =>
      makeItem({ id: `item${i}`, created_at: "2026-02-20T00:00:00Z" })
    );
    const insights = computeCosmeInsights(items, []);
    expect(insights.length).toBeLessThanOrEqual(10);
    // Each item should appear at most once
    const ids = insights.map((i) => i.item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prioritizes higher-priority insights", () => {
    // expiring (priority 1) should come before dormant (priority 3)
    const expiringItem = makeItem({
      id: "exp",
      open_date: "2025-03-01",
      created_at: "2025-03-01T00:00:00Z",
    });
    const dormantItem = makeItem({
      id: "dorm",
      created_at: "2025-12-01T00:00:00Z",
    });
    const logs = [makeLog({ date: "2026-01-01", used_items: ["dorm"] })];
    const insights = computeCosmeInsights([expiringItem, dormantItem], logs);
    if (insights.length >= 2) {
      expect(insights[0].priority).toBeLessThanOrEqual(insights[1].priority);
    }
  });
});
