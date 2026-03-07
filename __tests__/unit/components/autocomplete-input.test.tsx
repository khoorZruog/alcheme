import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AutocompleteInput } from "@/components/autocomplete-input";

describe("AutocompleteInput", () => {
  const suggestions = [
    { label: "KATE", source: "inventory" as const },
    { label: "KANEBO", source: "catalog" as const },
  ];

  it("renders input with placeholder", () => {
    render(
      <AutocompleteInput
        value=""
        onChange={() => {}}
        suggestions={[]}
        placeholder="例: KATE"
      />,
    );
    expect(screen.getByPlaceholderText("例: KATE")).toBeDefined();
  });

  it("shows dropdown when input has value and suggestions exist", () => {
    render(
      <AutocompleteInput
        value="KA"
        onChange={() => {}}
        suggestions={suggestions}
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    expect(screen.getByText("KATE")).toBeDefined();
    expect(screen.getByText("KANEBO")).toBeDefined();
  });

  it("hides dropdown when input is empty", () => {
    render(
      <AutocompleteInput
        value=""
        onChange={() => {}}
        suggestions={suggestions}
      />,
    );
    expect(screen.queryByText("KATE")).toBeNull();
  });

  it("calls onChange when suggestion is clicked", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        value="KA"
        onChange={onChange}
        suggestions={suggestions}
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    fireEvent.click(screen.getByText("KATE"));
    expect(onChange).toHaveBeenCalledWith("KATE");
  });

  it("shows source badges when showSource is true", () => {
    render(
      <AutocompleteInput
        value="KA"
        onChange={() => {}}
        suggestions={suggestions}
        showSource
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    expect(screen.getByText("手持ち")).toBeDefined();
    expect(screen.getByText("みんなの登録")).toBeDefined();
  });

  it("does not show source badges when showSource is false", () => {
    render(
      <AutocompleteInput
        value="KA"
        onChange={() => {}}
        suggestions={suggestions}
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    expect(screen.queryByText("手持ち")).toBeNull();
  });

  it("selects first suggestion on Enter key", () => {
    const onChange = vi.fn();
    render(
      <AutocompleteInput
        value="KA"
        onChange={onChange}
        suggestions={suggestions}
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("KATE");
  });

  it("closes dropdown on Escape key", () => {
    render(
      <AutocompleteInput
        value="KA"
        onChange={() => {}}
        suggestions={suggestions}
      />,
    );
    const input = screen.getByDisplayValue("KA");
    fireEvent.focus(input);
    expect(screen.getByText("KATE")).toBeDefined();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("KATE")).toBeNull();
  });
});
