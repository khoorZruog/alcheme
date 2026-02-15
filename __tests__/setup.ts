import { vi } from "vitest";
import { ReadableStream, TextEncoderStream } from "node:stream/web";

// Polyfill Web Streams for jsdom (used by use-chat SSE test)
if (typeof globalThis.ReadableStream === "undefined") {
  // @ts-expect-error — Node.js web streams are compatible enough for tests
  globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.TextEncoderStream === "undefined") {
  // @ts-expect-error — Node.js web streams
  globalThis.TextEncoderStream = TextEncoderStream;
}

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props;
    return Object.assign(document.createElement("img"), rest);
  },
}));

// Mock SWR globally (can be overridden per test)
vi.mock("swr", () => ({
  default: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: false,
    mutate: vi.fn(),
  })),
}));
