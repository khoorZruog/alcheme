/**
 * Tests for /api/social/follow route handler
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockRunTransaction } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockRunTransaction: vi.fn(),
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
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date("2025-01-01") })),
  },
}));

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock("@/lib/api/auth", () => ({
  getAuthUserId: mockGetAuthUserId,
}));

vi.mock("@/lib/firebase/admin", () => ({
  adminAuth: {},
  adminDb: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            collection: vi.fn(() => ({
              doc: vi.fn(() => ({})),
            })),
          })),
        })),
      })),
    })),
    runTransaction: mockRunTransaction,
  },
  adminStorage: {},
  default: {},
}));

import { POST as toggleFollow } from "@/app/api/social/follow/route";

describe("POST /api/social/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/follow", {
      method: "POST",
      body: JSON.stringify({ target_user_id: "other-user" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await toggleFollow(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when target_user_id is missing", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/follow", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await toggleFollow(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("target_user_id");
  });

  it("returns 400 when trying to follow yourself", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/follow", {
      method: "POST",
      body: JSON.stringify({ target_user_id: "user-123" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await toggleFollow(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("yourself");
  });

  it("follows a user (toggle on)", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockRunTransaction.mockImplementation(async (fn: any) => {
      return fn({
        get: vi.fn()
          .mockResolvedValueOnce({ exists: false }) // following doc (not following)
          .mockResolvedValueOnce({ exists: false }) // my stats
          .mockResolvedValueOnce({ exists: false }), // target stats
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    });

    const req = new NextRequest("http://localhost:3000/api/social/follow", {
      method: "POST",
      body: JSON.stringify({ target_user_id: "other-user" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await toggleFollow(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.following).toBe(true);
    expect(body.follower_count).toBe(1);
  });

  it("unfollows a user (toggle off)", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockRunTransaction.mockImplementation(async (fn: any) => {
      return fn({
        get: vi.fn()
          .mockResolvedValueOnce({ exists: true }) // following doc (already following)
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ post_count: 0, follower_count: 0, following_count: 1 }),
          })
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ post_count: 0, follower_count: 1, following_count: 0 }),
          }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    });

    const req = new NextRequest("http://localhost:3000/api/social/follow", {
      method: "POST",
      body: JSON.stringify({ target_user_id: "other-user" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await toggleFollow(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.following).toBe(false);
    expect(body.follower_count).toBe(0);
  });
});
