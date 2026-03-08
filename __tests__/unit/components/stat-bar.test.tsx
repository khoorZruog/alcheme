import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatBar, StatBarGroup, getStatLabel, getStatLabels } from "@/components/stat-bar";

describe("StatBar", () => {
  it("renders default label for pigment (リップ)", () => {
    render(<StatBar statKey="pigment" value={4} />);
    expect(screen.getByText("発色")).toBeDefined();
  });

  it("calculates correct width percentage", () => {
    const { container } = render(<StatBar statKey="longevity" value={3} />);
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("60%");
    }
  });

  it("renders max value (100%)", () => {
    const { container } = render(<StatBar statKey="shelf_life" value={5} />);
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("100%");
    }
  });

  it("renders min value (20%)", () => {
    const { container } = render(
      <StatBar statKey="natural_finish" value={1} />
    );
    const bar = container.querySelector("[style]");
    if (bar) {
      expect((bar as HTMLElement).style.width).toBe("20%");
    }
  });

  it("renders ベースメイク label for pigment (カバー力)", () => {
    render(<StatBar statKey="pigment" value={4} category="ベースメイク" />);
    expect(screen.getByText("カバー力")).toBeDefined();
  });

  it("renders スキンケア label for pigment (保湿)", () => {
    render(<StatBar statKey="pigment" value={4} category="スキンケア" />);
    expect(screen.getByText("保湿")).toBeDefined();
  });

  it("renders その他 label for natural_finish (使いやすさ)", () => {
    render(<StatBar statKey="natural_finish" value={3} category="その他" />);
    expect(screen.getByText("使いやすさ")).toBeDefined();
  });
});

describe("StatBarGroup", () => {
  const stats = { pigment: 4, longevity: 3, shelf_life: 5, natural_finish: 2 };

  it("renders all 4 stat bars with リップ labels (default)", () => {
    render(<StatBarGroup stats={stats} />);
    expect(screen.getByText("発色")).toBeDefined();
    expect(screen.getByText("キープ力")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("ツヤ")).toBeDefined();
  });

  it("renders アイメイク labels", () => {
    render(<StatBarGroup stats={stats} category="アイメイク" />);
    expect(screen.getByText("発色")).toBeDefined();
    expect(screen.getByText("キープ力")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("肌なじみ")).toBeDefined();
  });

  it("renders ベースメイク labels", () => {
    render(<StatBarGroup stats={stats} category="ベースメイク" />);
    expect(screen.getByText("カバー力")).toBeDefined();
    expect(screen.getByText("崩れにくさ")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("仕上がり")).toBeDefined();
  });

  it("renders スキンケア labels", () => {
    render(<StatBarGroup stats={stats} category="スキンケア" />);
    expect(screen.getByText("保湿")).toBeDefined();
    expect(screen.getByText("肌なじみ")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("使用感")).toBeDefined();
  });

  it("renders その他 labels", () => {
    render(<StatBarGroup stats={stats} category="その他" />);
    expect(screen.getByText("仕上がり")).toBeDefined();
    expect(screen.getByText("キープ力")).toBeDefined();
    expect(screen.getByText("コスパ")).toBeDefined();
    expect(screen.getByText("使いやすさ")).toBeDefined();
  });
});

describe("getStatLabel", () => {
  it("returns LIPS labels for リップ", () => {
    expect(getStatLabel("pigment", "リップ")).toBe("発色");
    expect(getStatLabel("longevity", "リップ")).toBe("キープ力");
    expect(getStatLabel("natural_finish", "リップ")).toBe("ツヤ");
  });

  it("returns LIPS labels for アイメイク", () => {
    expect(getStatLabel("pigment", "アイメイク")).toBe("発色");
    expect(getStatLabel("natural_finish", "アイメイク")).toBe("肌なじみ");
  });

  it("returns LIPS labels for ベースメイク", () => {
    expect(getStatLabel("pigment", "ベースメイク")).toBe("カバー力");
    expect(getStatLabel("longevity", "ベースメイク")).toBe("崩れにくさ");
    expect(getStatLabel("natural_finish", "ベースメイク")).toBe("仕上がり");
  });

  it("returns LIPS labels for スキンケア", () => {
    expect(getStatLabel("pigment", "スキンケア")).toBe("保湿");
    expect(getStatLabel("longevity", "スキンケア")).toBe("肌なじみ");
    expect(getStatLabel("natural_finish", "スキンケア")).toBe("使用感");
  });

  it("returns LIPS labels for その他", () => {
    expect(getStatLabel("pigment", "その他")).toBe("仕上がり");
    expect(getStatLabel("natural_finish", "その他")).toBe("使いやすさ");
  });

  it("defaults to リップ when category is undefined", () => {
    expect(getStatLabel("pigment")).toBe("発色");
    expect(getStatLabel("natural_finish")).toBe("ツヤ");
  });

  it("コスパ is shared across all categories", () => {
    expect(getStatLabel("shelf_life", "リップ")).toBe("コスパ");
    expect(getStatLabel("shelf_life", "アイメイク")).toBe("コスパ");
    expect(getStatLabel("shelf_life", "ベースメイク")).toBe("コスパ");
    expect(getStatLabel("shelf_life", "スキンケア")).toBe("コスパ");
    expect(getStatLabel("shelf_life", "その他")).toBe("コスパ");
  });
});

describe("getStatLabels", () => {
  it("returns 4 label entries", () => {
    const labels = getStatLabels();
    expect(labels).toHaveLength(4);
    expect(labels.map((l) => l.key)).toEqual(["pigment", "longevity", "shelf_life", "natural_finish"]);
  });

  it("returns category-specific labels for スキンケア", () => {
    const labels = getStatLabels("スキンケア");
    expect(labels[0]).toEqual({ key: "pigment", label: "保湿" });
    expect(labels[1]).toEqual({ key: "longevity", label: "肌なじみ" });
    expect(labels[2]).toEqual({ key: "shelf_life", label: "コスパ" });
    expect(labels[3]).toEqual({ key: "natural_finish", label: "使用感" });
  });

  it("returns category-specific labels for ベースメイク", () => {
    const labels = getStatLabels("ベースメイク");
    expect(labels[0]).toEqual({ key: "pigment", label: "カバー力" });
    expect(labels[1]).toEqual({ key: "longevity", label: "崩れにくさ" });
    expect(labels[3]).toEqual({ key: "natural_finish", label: "仕上がり" });
  });
});
