/**
 * Tests for /api/recipes route handlers (API-19, API-20, API-21, API-22)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockSnapshotGet, mockDocGet, mockDocUpdate, mockInnerDoc } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockSnapshotGet: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocUpdate: vi.fn(),
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
  mockInnerDoc.mockReturnValue({
    get: mockDocGet,
    update: mockDocUpdate,
  });

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            get: mockSnapshotGet,
            doc: mockInnerDoc,
          })),
        })),
      })),
    },
    adminStorage: {},
    default: {},
  };
});

// ---------------------------------------------------------------------------
// GET /api/recipes — list
// ---------------------------------------------------------------------------
import { GET as getRecipes } from "@/app/api/recipes/route";

describe("GET /api/recipes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerDoc.mockReturnValue({
      get: mockDocGet,
      update: mockDocUpdate,
    });
  });

  it("API-19: returns recipes list", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockSnapshotGet.mockResolvedValue({
      docs: [
        {
          id: "recipe-1",
          data: () => ({
            recipe_name: "オフィスメイク",
            steps: [{ step: 1, area: "ベース" }],
            created_at: { toDate: () => new Date("2025-01-01") },
          }),
        },
        {
          id: "recipe-2",
          data: () => ({
            recipe_name: "デートメイク",
            steps: [],
            created_at: { toDate: () => new Date("2025-01-02") },
          }),
        },
      ],
    });

    const res = await getRecipes(new NextRequest("http://localhost/api/recipes"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recipes).toHaveLength(2);
    expect(body.count).toBe(2);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const res = await getRecipes(new NextRequest("http://localhost/api/recipes"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });
});

// ---------------------------------------------------------------------------
// GET /api/recipes/[recipeId] — detail
// ---------------------------------------------------------------------------
import { GET as getRecipeDetail } from "@/app/api/recipes/[recipeId]/route";

describe("GET /api/recipes/[recipeId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API-20: returns recipe detail", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: "recipe-1",
        data: () => ({
          recipe_name: "オフィスメイク",
          steps: [{ step: 1, area: "ベース", item_name: "ファンデ" }],
          thinking_process: ["肌のベースから"],
          pro_tips: ["薄く重ねて"],
          created_at: { toDate: () => new Date("2025-01-01") },
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/recipes/recipe-1");
    const res = await getRecipeDetail(req, { params: Promise.resolve({ recipeId: "recipe-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recipe.id).toBe("recipe-1");
    expect(body.recipe.recipe_name).toBe("オフィスメイク");
    expect(body.recipe.steps).toHaveLength(1);
  });

  it("API-22: returns 404 for non-existent recipe", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: false,
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/recipes/nonexistent");
    const res = await getRecipeDetail(req, { params: Promise.resolve({ recipeId: "nonexistent" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain("not found");
  });
});

// ---------------------------------------------------------------------------
// POST /api/recipes/[recipeId]/feedback
// ---------------------------------------------------------------------------
import { POST as postFeedback } from "@/app/api/recipes/[recipeId]/feedback/route";

describe("POST /api/recipes/[recipeId]/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("API-21: saves valid feedback rating", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: true }),
      update: mockDocUpdate.mockResolvedValue(undefined),
    });

    const req = new NextRequest("http://localhost:3000/api/recipes/recipe-1/feedback", {
      method: "POST",
      body: JSON.stringify({ rating: "liked" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postFeedback(req, { params: Promise.resolve({ recipeId: "recipe-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        feedback: expect.objectContaining({
          user_rating: "liked",
        }),
      })
    );
  });

  it("returns 400 for invalid rating value", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");

    const req = new NextRequest("http://localhost:3000/api/recipes/recipe-1/feedback", {
      method: "POST",
      body: JSON.stringify({ rating: "invalid" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postFeedback(req, { params: Promise.resolve({ recipeId: "recipe-1" }) });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain("rating");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/recipes/recipe-1/feedback", {
      method: "POST",
      body: JSON.stringify({ rating: "liked" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postFeedback(req, { params: Promise.resolve({ recipeId: "recipe-1" }) });
    expect(res.status).toBe(401);
  });
});
