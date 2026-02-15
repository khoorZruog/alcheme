/**
 * Tests for /api/social/posts route handlers
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockGetAuthUserId,
  mockSnapshotGet,
  mockDocGet,
  mockDocSet,
  mockDocUpdate,
  mockDocDelete,
  mockRunTransaction,
  mockDoc,
} = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockSnapshotGet: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocSet: vi.fn(),
  mockDocUpdate: vi.fn(),
  mockDocDelete: vi.fn(),
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
    fromDate: vi.fn(() => ({ toDate: () => new Date("2025-01-01") })),
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
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis(),
    collection: vi.fn().mockReturnThis(),
  });

  mockDoc.mockReturnValue({
    get: mockDocGet,
    set: mockDocSet,
    update: mockDocUpdate,
    delete: mockDocDelete,
    id: "mock-post-id",
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

// ---------------------------------------------------------------------------
// GET /api/social/posts — feed
// ---------------------------------------------------------------------------
import { GET as getFeed, POST as createPost } from "@/app/api/social/posts/route";

describe("GET /api/social/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
      delete: mockDocDelete,
      id: "mock-post-id",
      collection: vi.fn().mockReturnValue({
        get: mockSnapshotGet,
        doc: mockDoc,
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        collection: vi.fn().mockReturnThis(),
      }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/posts");
    const res = await getFeed(req);
    expect(res.status).toBe(401);
  });

  it("returns empty feed when no posts", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockSnapshotGet.mockResolvedValue({ docs: [] });
    mockDocGet.mockResolvedValue({ exists: false });

    const req = new NextRequest("http://localhost:3000/api/social/posts");
    const res = await getFeed(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.posts).toHaveLength(0);
    expect(body.next_cursor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /api/social/posts — publish
// ---------------------------------------------------------------------------
describe("POST /api/social/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
      delete: mockDocDelete,
      id: "mock-post-id",
      collection: vi.fn().mockReturnValue({
        get: mockSnapshotGet,
        doc: mockDoc,
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        startAfter: vi.fn().mockReturnThis(),
        collection: vi.fn().mockReturnThis(),
      }),
    });
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);
    const req = new NextRequest("http://localhost:3000/api/social/posts", {
      method: "POST",
      body: JSON.stringify({ recipe_id: "recipe-1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await createPost(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when recipe_id is missing", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const req = new NextRequest("http://localhost:3000/api/social/posts", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await createPost(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("recipe_id");
  });

  it("returns 404 when recipe not found", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockDocGet.mockResolvedValue({ exists: false });

    const req = new NextRequest("http://localhost:3000/api/social/posts", {
      method: "POST",
      body: JSON.stringify({ recipe_id: "nonexistent" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await createPost(req);
    expect(res.status).toBe(404);
  });
});
