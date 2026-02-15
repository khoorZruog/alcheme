/**
 * Tests for /api/inventory route handlers (API-07, API-08, API-12)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockGet, mockSet, mockDoc, mockWhere } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDoc: vi.fn(),
  mockWhere: vi.fn(),
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
  timestampToString: vi.fn((ts: unknown) => {
    const t = ts as { toDate?: () => Date } | undefined;
    return t?.toDate?.()?.toISOString?.() ?? new Date().toISOString();
  }),
}));

vi.mock("@/lib/firebase/admin", () => {
  mockDoc.mockReturnValue({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: mockSet,
        id: "new-item-id",
      })),
      where: mockWhere,
      get: mockGet,
    })),
  });

  mockWhere.mockReturnValue({ get: mockGet });

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => ({
        doc: mockDoc,
        where: mockWhere,
        get: mockGet,
      })),
    },
    adminStorage: {},
    default: {},
  };
});

import { GET, POST } from "@/app/api/inventory/route";

describe("GET /api/inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup chainable mocks after clearAllMocks
    mockDoc.mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ set: mockSet, id: "new-item-id" })),
        where: mockWhere,
        get: mockGet,
      })),
    });
    mockWhere.mockReturnValue({ get: mockGet });
  });

  it("API-07: returns inventory items for authenticated user", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockGet.mockResolvedValue({
      docs: [
        {
          id: "item_001",
          data: () => ({
            category: "リップ",
            brand: "KATE",
            product_name: "リップモンスター",
            texture: "マット",
          }),
        },
        {
          id: "item_002",
          data: () => ({
            category: "アイメイク",
            brand: "EXCEL",
            product_name: "スキニーリッチシャドウ",
            texture: "シマー",
          }),
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/inventory");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(2);
    expect(body.count).toBe(2);
    expect(body.items[0].id).toBe("item_001");
  });

  it("returns 401 for unauthenticated request", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/inventory");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("API-08: filters by category query param", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockGet.mockResolvedValue({
      docs: [
        {
          id: "item_001",
          data: () => ({
            category: "リップ",
            brand: "KATE",
            product_name: "リップモンスター",
            texture: "マット",
          }),
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/inventory?category=リップ");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
  });
});

describe("POST /api/inventory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.mockReturnValue({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({ set: mockSet, id: "new-item-id" })),
        where: mockWhere,
        get: mockGet,
      })),
    });
  });

  it("API-12: saves items and returns 201", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockSet.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/inventory", {
      method: "POST",
      body: JSON.stringify({
        items: [
          { brand: "KATE", product_name: "リップモンスター", category: "リップ" },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
  });

  it("returns 401 for unauthenticated request", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/inventory", {
      method: "POST",
      body: JSON.stringify({ items: [] }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
