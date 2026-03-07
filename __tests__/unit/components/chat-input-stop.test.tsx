import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "@/components/chat-input";

describe("ChatInput stop button", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
    onStop: vi.fn(),
  };

  it("shows send button when not loading", () => {
    render(<ChatInput {...defaultProps} isLoading={false} />);
    expect(screen.getByLabelText("送信")).toBeDefined();
    expect(screen.queryByLabelText("生成を停止")).toBeNull();
  });

  it("shows stop button when loading", () => {
    render(<ChatInput {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText("生成を停止")).toBeDefined();
    expect(screen.queryByLabelText("送信")).toBeNull();
  });

  it("calls onStop when stop button clicked", () => {
    render(<ChatInput {...defaultProps} isLoading={true} />);
    fireEvent.click(screen.getByLabelText("生成を停止"));
    expect(defaultProps.onStop).toHaveBeenCalled();
  });

  it("stop button is always clickable (not disabled)", () => {
    render(<ChatInput {...defaultProps} isLoading={true} disabled={true} />);
    const stopBtn = screen.getByLabelText("生成を停止");
    expect(stopBtn).not.toHaveProperty("disabled", true);
  });
});
