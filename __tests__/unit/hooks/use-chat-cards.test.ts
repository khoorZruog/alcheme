import { describe, it, expect } from "vitest";
import type { ProductCardData, TechniqueCardData } from "@/types/chat";

/**
 * Unit tests for product_card / technique_card SSE event handling.
 * These test the data transformation logic that happens in use-chat.ts processLine.
 */

// Simulate the SSE parsing logic from use-chat.ts processLine
function parseSSELine(line: string): { type: string; data: unknown } | null {
  if (!line.startsWith("data: ")) return null;
  const json = line.slice(6);
  if (json === "[DONE]") return null;
  return JSON.parse(json);
}

function applyProductCard(
  existing: ProductCardData[] | undefined,
  eventData: string | ProductCardData
): ProductCardData[] {
  const cardData: ProductCardData =
    typeof eventData === "string" ? JSON.parse(eventData) : eventData;
  return [...(existing || []), cardData];
}

function applyTechniqueCard(
  eventData: string | TechniqueCardData
): TechniqueCardData {
  return typeof eventData === "string" ? JSON.parse(eventData) : eventData;
}

describe("SSE product_card handling", () => {
  const sampleProductSSE = `data: {"type":"product_card","data":"{\\"brand\\":\\"CANMAKE\\",\\"product_name\\":\\"パーフェクトマルチアイズ\\",\\"category\\":\\"アイシャドウ\\",\\"duplicate_risk\\":\\"low\\",\\"gap_analysis\\":\\"fills_gap\\",\\"similar_items_count\\":0,\\"compatibility_summary\\":\\"\\"}"}`;

  it("parses product_card SSE event", () => {
    const event = parseSSELine(sampleProductSSE);
    expect(event).not.toBeNull();
    expect(event!.type).toBe("product_card");
  });

  it("applies product card data to empty array", () => {
    const event = parseSSELine(sampleProductSSE);
    const cards = applyProductCard(undefined, event!.data as string);
    expect(cards).toHaveLength(1);
    expect(cards[0].brand).toBe("CANMAKE");
    expect(cards[0].product_name).toBe("パーフェクトマルチアイズ");
    expect(cards[0].duplicate_risk).toBe("low");
    expect(cards[0].gap_analysis).toBe("fills_gap");
  });

  it("accumulates multiple product cards", () => {
    const event = parseSSELine(sampleProductSSE);
    const first = applyProductCard(undefined, event!.data as string);
    const second = applyProductCard(first, event!.data as string);
    expect(second).toHaveLength(2);
  });

  it("handles pre-parsed object data", () => {
    const cardObj: ProductCardData = {
      brand: "DIOR",
      product_name: "リップ",
      category: "リップ",
      duplicate_risk: "high",
      gap_analysis: "near_duplicate",
      similar_items_count: 2,
      compatibility_summary: "重複あり",
    };
    const cards = applyProductCard(undefined, cardObj);
    expect(cards[0].brand).toBe("DIOR");
  });
});

describe("SSE technique_card handling", () => {
  const sampleTechniqueSSE = `data: {"type":"technique_card","data":"{\\"title\\":\\"代用テクニック\\",\\"original_item\\":\\"EXCEL ブラウン\\",\\"substitute_item\\":\\"CANMAKE チーク\\",\\"techniques\\":[\\"少量取る\\",\\"重ね塗り\\"],\\"reasons\\":[\\"同系色\\"],\\"general_tips\\":[\\"少量ずつ\\"]}"}`;

  it("parses technique_card SSE event", () => {
    const event = parseSSELine(sampleTechniqueSSE);
    expect(event).not.toBeNull();
    expect(event!.type).toBe("technique_card");
  });

  it("applies technique card data", () => {
    const event = parseSSELine(sampleTechniqueSSE);
    const card = applyTechniqueCard(event!.data as string);
    expect(card.title).toBe("代用テクニック");
    expect(card.original_item).toBe("EXCEL ブラウン");
    expect(card.substitute_item).toBe("CANMAKE チーク");
    expect(card.techniques).toHaveLength(2);
    expect(card.reasons).toHaveLength(1);
    expect(card.general_tips).toHaveLength(1);
  });

  it("handles pre-parsed object data", () => {
    const techObj: TechniqueCardData = {
      title: "テスト",
      original_item: "A",
      substitute_item: "B",
      techniques: ["step1"],
      reasons: ["reason1"],
      general_tips: ["tip1"],
    };
    const card = applyTechniqueCard(techObj);
    expect(card.title).toBe("テスト");
  });
});

describe("SSE [DONE] and non-data lines", () => {
  it("returns null for [DONE]", () => {
    expect(parseSSELine("data: [DONE]")).toBeNull();
  });

  it("returns null for non-data lines", () => {
    expect(parseSSELine("")).toBeNull();
    expect(parseSSELine("event: message")).toBeNull();
  });
});
