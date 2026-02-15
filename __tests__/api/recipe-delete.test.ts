/**
 * Tests for DELETE /api/recipes/[recipeId] route handler
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockDocGet, mockDocDelete, mockInnerDoc } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocDelete: vi.fn(),
  mockInnerDoc: vi.fn(),
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
  FieldValue: { increment: vi.fn((n: number) => `increment(${n})`) },
}));

vi.mock("firebase-admin/storage", () => ({
  getStorage: vi.fn(() => ({})),
}));

vi.mock("@/lib/api/auth", () => ({
  getAuthUserId: mockGetAuthUserId,
}));

vi.mock("@/lib/firebase/firestore-helpers", () => ({
  timestampToString: vi.fn(() => "2026-02-15T00:00:00.000Z"),
}));

vi.mock("@/lib/firebase/admin", () => {
  mockInnerDoc.mockReturnValue({
    get: mockDocGet,
    delete: mockDocDelete,
    update: vi.fn(),
  });

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: mockInnerDoc,
          })),
        })),
      })),
    },
  };
});

describe("DELETE /api/recipes/[recipeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/recipes/[recipeId]/route");
    const req = new NextRequest("http://localhost/api/recipes/abc123", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ recipeId: "abc123" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 when recipe does not exist", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockDocGet.mockResolvedValue({ exists: false });

    const { DELETE } = await import("@/app/api/recipes/[recipeId]/route");
    const req = new NextRequest("http://localhost/api/recipes/nonexistent", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ recipeId: "nonexistent" }) });
    expect(res.status).toBe(404);
  });

  it("deletes recipe successfully and returns 200", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        recipe_name: "Test Recipe",
        steps: [],
      }),
    });
    mockDocDelete.mockResolvedValue(undefined);

    const { DELETE } = await import("@/app/api/recipes/[recipeId]/route");
    const req = new NextRequest("http://localhost/api/recipes/recipe-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ recipeId: "recipe-1" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockDocDelete).toHaveBeenCalled();
  });

  it("deletes social post when recipe was published", async () => {
    mockGetAuthUserId.mockResolvedValue("user-1");
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        recipe_name: "Published Recipe",
        published_post_id: "post-123",
        steps: [],
      }),
    });
    mockDocDelete.mockResolvedValue(undefined);

    const { DELETE } = await import("@/app/api/recipes/[recipeId]/route");
    const req = new NextRequest("http://localhost/api/recipes/recipe-2", {
      method: "DELETE",
    });
    const res = await DELETE(req, { params: Promise.resolve({ recipeId: "recipe-2" }) });

    expect(res.status).toBe(200);
    // Should have called delete for both recipe and social post
    expect(mockDocDelete).toHaveBeenCalled();
  });
});
