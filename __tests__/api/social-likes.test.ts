/**
 * Tests for /api/social/posts/[postId]/like route handler
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

import { POST as toggleLike } from "@/app/api/social/posts/[postId]/like/route";

describe("POST /api/social/posts/[postId]/like", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/like", {
      method: "POST",
    });
    const res = await toggleLike(req, { params: Promise.resolve({ postId: "post-1" }) });
    expect(res.status).toBe(401);
  });

  it("likes a post (toggle on)", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockRunTransaction.mockImplementation(async (fn: any) => {
      return fn({
        get: vi.fn()
          .mockResolvedValueOnce({ exists: true, data: () => ({ like_count: 5 }) }) // post
          .mockResolvedValueOnce({ exists: false }), // like doc (not liked yet)
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    });

    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/like", {
      method: "POST",
    });
    const res = await toggleLike(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(true);
    expect(body.like_count).toBe(6);
  });

  it("unlikes a post (toggle off)", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockRunTransaction.mockImplementation(async (fn: any) => {
      return fn({
        get: vi.fn()
          .mockResolvedValueOnce({ exists: true, data: () => ({ like_count: 5 }) }) // post
          .mockResolvedValueOnce({ exists: true }), // like doc (already liked)
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    });

    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/like", {
      method: "POST",
    });
    const res = await toggleLike(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(false);
    expect(body.like_count).toBe(4);
  });

  it("returns 404 when post not found", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockRunTransaction.mockImplementation(async (fn: any) => {
      return fn({
        get: vi.fn().mockResolvedValueOnce({ exists: false }), // post not found
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      });
    });

    const req = new NextRequest("http://localhost:3000/api/social/posts/nonexist/like", {
      method: "POST",
    });
    const res = await toggleLike(req, { params: Promise.resolve({ postId: "nonexist" }) });
    expect(res.status).toBe(404);
  });
});
