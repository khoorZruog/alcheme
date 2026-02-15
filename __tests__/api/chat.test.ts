/**
 * Tests for /api/chat route handler (API-17, API-18)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockCallAgentStream } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockCallAgentStream: vi.fn(),
}));

vi.mock("firebase-admin/app", () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [{ name: "mock" }]),
  cert: vi.fn(),
  applicationDefault: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  Timestamp: { now: vi.fn() },
}));

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock("@/lib/api/auth", () => ({
  getAuthUserId: mockGetAuthUserId,
}));

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {},
  adminDb: {},
  adminStorage: {},
  default: {},
}));

vi.mock("@/lib/api/agent-client", () => ({
  callAgentStream: mockCallAgentStream,
}));

import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API-17: returns SSE stream for valid message", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type":"text_delta","data":"Hello"}\n\n'));
        controller.enqueue(encoder.encode('data: {"type":"done","data":""}\n\n'));
        controller.close();
      },
    });
    mockCallAgentStream.mockResolvedValue(stream);

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "メイクしたい" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.body).not.toBeNull();
  });

  it("API-18: returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 when message is empty", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("message");
  });

  it("returns SSE fallback when agent stream is null", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockCallAgentStream.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.body).not.toBeNull();
  });
});
