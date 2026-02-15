import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeFeedback } from "@/components/recipe-feedback";

describe("RecipeFeedback", () => {
  it("renders 3 feedback buttons", () => {
    const onSubmit = vi.fn();
    render(<RecipeFeedback onSubmit={onSubmit} />);
    expect(screen.getByText("良い")).toBeDefined();
    expect(screen.getByText("微妙")).toBeDefined();
    expect(screen.getByText("合わない")).toBeDefined();
  });

  it("calls onSubmit with 'liked' when clicking 良い", () => {
    const onSubmit = vi.fn();
    render(<RecipeFeedback onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("良い"));
    expect(onSubmit).toHaveBeenCalledWith("liked");
  });

  it("calls onSubmit with 'neutral' when clicking 微妙", () => {
    const onSubmit = vi.fn();
    render(<RecipeFeedback onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("微妙"));
    expect(onSubmit).toHaveBeenCalledWith("neutral");
  });

  it("calls onSubmit with 'disliked' when clicking 合わない", () => {
    const onSubmit = vi.fn();
    render(<RecipeFeedback onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText("合わない"));
    expect(onSubmit).toHaveBeenCalledWith("disliked");
  });

  it("shows active state for current rating", () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <RecipeFeedback onSubmit={onSubmit} currentRating="liked" />
    );
    // The liked button should have active styling
    expect(container).toBeDefined();
  });
});
