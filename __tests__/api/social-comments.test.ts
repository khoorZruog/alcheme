/**
 * Tests for /api/social/posts/[postId]/comments route handlers
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetAuthUserId,
  mockSnapshotGet,
  mockDocGet,
  mockDocSet,
  mockRunTransaction,
  mockDoc,
} = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockSnapshotGet: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocSet: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockDoc: vi.fn(),
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

vi.mock("@/lib/firebase/firestore-helpers", () => ({
  timestampToString: vi.fn(() => "2025-01-01T00:00:00.000Z"),
}));

vi.mock("@/lib/firebase/admin", () => {
  const createChain = (): any => ({
    get: mockSnapshotGet,
    doc: mockDoc,
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    collection: vi.fn().mockReturnThis(),
  });

  mockDoc.mockReturnValue({
    get: mockDocGet,
    set: mockDocSet,
    id: "mock-comment-id",
    collection: vi.fn().mockReturnValue(createChain()),
  });

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => createChain()),
      runTransaction: mockRunTransaction,
    },
    adminStorage: {},
    default: {},
  };
});

import { GET as getComments, POST as addComment } from "@/app/api/social/posts/[postId]/comments/route";

describe("GET /api/social/posts/[postId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      id: "mock-comment-id",
      collection: vi.fn().mockReturnValue({
        get: mockSnapshotGet,
        doc: mockDoc,
        orderBy: vi.fn().mockReturnValue({ get: mockSnapshotGet }),
        collection: vi.fn().mockReturnThis(),
      }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments");
    const res = await getComments(req, { params: Promise.resolve({ postId: "post-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns empty comments list", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockSnapshotGet.mockResolvedValue({ docs: [] });

    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments");
    const res = await getComments(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.comments).toHaveLength(0);
    expect(body.count).toBe(0);
  });
});

describe("POST /api/social/posts/[postId]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      id: "mock-comment-id",
      collection: vi.fn().mockReturnValue({
        get: mockSnapshotGet,
        doc: mockDoc,
        orderBy: vi.fn().mockReturnValue({ get: mockSnapshotGet }),
        collection: vi.fn().mockReturnThis(),
      }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments", {
      method: "POST",
      body: JSON.stringify({ text: "いいね！", type: "comment" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await addComment(req, { params: Promise.resolve({ postId: "post-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid type", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments", {
      method: "POST",
      body: JSON.stringify({ text: "test", type: "invalid" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await addComment(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("type");
  });

  it("returns 400 for reaction without valid reaction_key", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments", {
      method: "POST",
      body: JSON.stringify({ text: "", type: "reaction" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await addComment(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("reaction_key");
  });

  it("returns 400 for empty comment text", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/posts/post-1/comments", {
      method: "POST",
      body: JSON.stringify({ text: "", type: "comment" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await addComment(req, { params: Promise.resolve({ postId: "post-1" }) });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("text");
  });
});
