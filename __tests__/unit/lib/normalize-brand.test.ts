import { describe, it, expect } from "vitest";
import { normalizeBrand } from "@/lib/normalize-brand";

describe("normalizeBrand", () => {
  it("lowercases ASCII", () => {
    expect(normalizeBrand("KATE")).toBe("kate");
  });

  it("converts full-width alphanumeric to half-width", () => {
    expect(normalizeBrand("ＫＡＴＥ")).toBe("kate");
  });

  it("converts full-width digits", () => {
    expect(normalizeBrand("Ｎ２０")).toBe("n20");
  });

  it("handles mixed full-width and half-width", () => {
    expect(normalizeBrand("Ｄior")).toBe("dior");
  });

  it("trims whitespace", () => {
    expect(normalizeBrand("  KATE  ")).toBe("kate");
  });

  it("passes katakana through unchanged", () => {
    expect(normalizeBrand("ケイト")).toBe("ケイト");
  });

  it("handles empty string", () => {
    expect(normalizeBrand("")).toBe("");
  });
});
