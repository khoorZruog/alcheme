import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TechniqueCardInline } from "@/components/technique-card-inline";
import type { TechniqueCardData } from "@/types/chat";

const baseData: TechniqueCardData = {
  title: "アイシャドウの代用テクニック",
  original_item: "EXCEL ブラウンパレット",
  substitute_item: "CANMAKE チーク（コーラルピンク）",
  techniques: [
    "少量をブラシに取り、目元にぼかすように塗る",
    "重ね塗りで発色を調整する",
  ],
  reasons: ["同系色で代用可能"],
  general_tips: ["代用品は少量ずつ重ねるのがコツ"],
};

describe("TechniqueCardInline", () => {
  it("renders title", () => {
    render(<TechniqueCardInline data={baseData} />);
    expect(screen.getByText("アイシャドウの代用テクニック")).toBeDefined();
  });

  it("renders original and substitute items", () => {
    render(<TechniqueCardInline data={baseData} />);
    expect(screen.getByText("EXCEL ブラウンパレット")).toBeDefined();
    expect(screen.getByText("CANMAKE チーク（コーラルピンク）")).toBeDefined();
  });

  it("renders technique steps", () => {
    render(<TechniqueCardInline data={baseData} />);
    expect(screen.getByText(/少量をブラシに取り/)).toBeDefined();
    expect(screen.getByText(/重ね塗りで発色を調整/)).toBeDefined();
  });

  it("renders general tips", () => {
    render(<TechniqueCardInline data={baseData} />);
    expect(screen.getByText(/代用品は少量ずつ/)).toBeDefined();
  });

  it("renders fallback title when empty", () => {
    render(<TechniqueCardInline data={{ ...baseData, title: "" }} />);
    expect(screen.getByText("代用テクニック")).toBeDefined();
  });
});
