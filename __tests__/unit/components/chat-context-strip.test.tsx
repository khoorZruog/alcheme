import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatContextStrip } from "@/components/chat-context-strip";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock hooks
const mockWeather = vi.fn().mockReturnValue({
  data: { weather: "晴れ", temp: 12, humidity: 45 },
  isLoading: false,
});
vi.mock("@/hooks/use-weather", () => ({ useWeather: () => mockWeather() }));

const mockLogs = vi.fn().mockReturnValue({
  logs: [{ date: new Date().toISOString().slice(0, 10), id: "1" }],
  isLoading: false,
});
vi.mock("@/hooks/use-weekly-logs", () => ({ useWeeklyLogs: () => mockLogs() }));

describe("ChatContextStrip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWeather.mockReturnValue({
      data: { weather: "晴れ", temp: 12, humidity: 45 },
      isLoading: false,
    });
    mockLogs.mockReturnValue({
      logs: [{ date: new Date().toISOString().slice(0, 10), id: "1" }],
      isLoading: false,
    });
  });

  it("renders weather pill with temperature and humidity", () => {
    render(<ChatContextStrip />);
    expect(screen.getByText("12°C")).toBeDefined();
    expect(screen.getByText("湿度45%")).toBeDefined();
  });

  it("renders streak pill when logs exist for consecutive days", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    mockLogs.mockReturnValue({
      logs: [
        { date: fmt(today), id: "1" },
        { date: fmt(yesterday), id: "2" },
      ],
      isLoading: false,
    });
    render(<ChatContextStrip />);
    expect(screen.getByText("2日")).toBeDefined();
  });

  it("renders nothing when both hooks are loading", () => {
    mockWeather.mockReturnValue({
      data: { weather: null, temp: null, humidity: null },
      isLoading: true,
    });
    mockLogs.mockReturnValue({ logs: [], isLoading: true });
    const { container } = render(<ChatContextStrip />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when no data available", () => {
    mockWeather.mockReturnValue({
      data: { weather: null, temp: null, humidity: null },
      isLoading: false,
    });
    mockLogs.mockReturnValue({ logs: [], isLoading: false });
    const { container } = render(<ChatContextStrip />);
    expect(container.innerHTML).toBe("");
  });

  it("renders story dots pill", () => {
    render(<ChatContextStrip />);
    // The dots container should be a link to beauty-log
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/beauty-log")).toBe(true);
  });
});
