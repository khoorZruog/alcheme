/**
 * Tests for /api/auth/session route handlers (API-01, API-02, API-03)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vi.hoisted ensures these are available when vi.mock factories execute (hoisted)
const { mockVerifyIdToken, mockCreateSessionCookie } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
  mockCreateSessionCookie: vi.fn(),
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
  Timestamp: { now: vi.fn(() => ({ toDate: () => new Date() })) },
}));

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
    createSessionCookie: mockCreateSessionCookie,
    verifySessionCookie: vi.fn(),
  },
  adminDb: {},
  adminStorage: {},
  default: {},
}));

import { POST, DELETE } from "@/app/api/auth/session/route";

describe("POST /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API-01: creates session cookie with valid ID token", async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: "user-123" });
    mockCreateSessionCookie.mockResolvedValue("mock-session-cookie");

    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: "valid-token" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockVerifyIdToken).toHaveBeenCalledWith("valid-token");
    expect(mockCreateSessionCookie).toHaveBeenCalledWith(
      "valid-token",
      expect.objectContaining({ expiresIn: expect.any(Number) })
    );
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("session=");
  });

  it("API-02: returns 401 with invalid token", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token"));

    const req = new NextRequest("http://localhost:3000/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: "invalid-token" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });
});

describe("DELETE /api/auth/session", () => {
  it("API-03: clears session cookie", async () => {
    const res = await DELETE();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("session=");
  });
});
