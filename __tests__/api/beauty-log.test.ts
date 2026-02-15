/**
 * Tests for /api/beauty-log route handlers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockGetAuthUserId, mockSnapshotGet, mockDocGet, mockDocSet, mockDocUpdate, mockDocDelete, mockInnerDoc } = vi.hoisted(() => ({
  mockGetAuthUserId: vi.fn(),
  mockSnapshotGet: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocSet: vi.fn(),
  mockDocUpdate: vi.fn(),
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
    set: mockDocSet,
    update: mockDocUpdate,
    delete: mockDocDelete,
  });

  return {
    adminAuth: {},
    adminDb: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            get: mockSnapshotGet,
            orderBy: vi.fn(() => ({
              get: mockSnapshotGet,
            })),
            doc: mockInnerDoc,
            where: vi.fn(() => ({
              where: vi.fn(() => ({
                orderBy: vi.fn(() => ({
                  get: mockSnapshotGet,
                })),
              })),
            })),
          })),
        })),
      })),
    },
    adminStorage: {},
    default: {},
  };
});

// ---------------------------------------------------------------------------
// GET /api/beauty-log — list
// ---------------------------------------------------------------------------
import { GET as getBeautyLogs, POST as postBeautyLog } from "@/app/api/beauty-log/route";

describe("GET /api/beauty-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
      delete: mockDocDelete,
    });
  });

  it("returns beauty logs list", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockSnapshotGet.mockResolvedValue({
      docs: [
        {
          id: "2026-02-15",
          data: () => ({
            date: "2026-02-15",
            self_rating: 4,
            mood: "元気",
            created_at: { toDate: () => new Date() },
            updated_at: { toDate: () => new Date() },
          }),
        },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/beauty-log?month=2026-02");
    const res = await getBeautyLogs(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.logs).toHaveLength(1);
    expect(body.count).toBe(1);
    expect(body.logs[0].date).toBe("2026-02-15");
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/beauty-log");
    const res = await getBeautyLogs(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/beauty-log — create
// ---------------------------------------------------------------------------
describe("POST /api/beauty-log", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInnerDoc.mockReturnValue({
      get: mockDocGet,
      set: mockDocSet,
      update: mockDocUpdate,
      delete: mockDocDelete,
    });
  });

  it("creates new beauty log entry", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockDocGet.mockResolvedValue({ exists: false });
    mockDocSet.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/beauty-log", {
      method: "POST",
      body: JSON.stringify({ date: "2026-02-15", self_rating: 4, mood: "元気" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postBeautyLog(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.id).toBe("2026-02-15");
    expect(mockDocSet).toHaveBeenCalled();
  });

  it("updates existing beauty log entry", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockDocGet.mockResolvedValue({ exists: true });
    mockDocUpdate.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/beauty-log", {
      method: "POST",
      body: JSON.stringify({ date: "2026-02-15", self_rating: 5 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postBeautyLog(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalled();
  });

  it("returns 400 for invalid date format", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");

    const req = new NextRequest("http://localhost:3000/api/beauty-log", {
      method: "POST",
      body: JSON.stringify({ date: "invalid-date", self_rating: 4 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postBeautyLog(req);

    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/beauty-log", {
      method: "POST",
      body: JSON.stringify({ date: "2026-02-15", self_rating: 4 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await postBeautyLog(req);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET/PUT/DELETE /api/beauty-log/[logId]
// ---------------------------------------------------------------------------
import { GET as getLogDetail, PUT as putLog, DELETE as deleteLog } from "@/app/api/beauty-log/[logId]/route";

describe("GET /api/beauty-log/[logId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns log detail", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: "2026-02-15",
        data: () => ({
          date: "2026-02-15",
          self_rating: 4,
          mood: "元気",
        }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/beauty-log/2026-02-15");
    const res = await getLogDetail(req, { params: Promise.resolve({ logId: "2026-02-15" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.log.date).toBe("2026-02-15");
    expect(body.log.self_rating).toBe(4);
  });

  it("returns 404 for non-existent log", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: false }),
    });

    const req = new NextRequest("http://localhost:3000/api/beauty-log/nonexistent");
    const res = await getLogDetail(req, { params: Promise.resolve({ logId: "nonexistent" }) });

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/beauty-log/[logId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates existing log", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: true }),
      update: mockUpdate,
    });

    const req = new NextRequest("http://localhost:3000/api/beauty-log/2026-02-15", {
      method: "PUT",
      body: JSON.stringify({ self_rating: 5 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await putLog(req, { params: Promise.resolve({ logId: "2026-02-15" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });
});

describe("DELETE /api/beauty-log/[logId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes existing log", async () => {
    mockGetAuthUserId.mockResolvedValue("user-123");
    const mockDel = vi.fn().mockResolvedValue(undefined);
    mockInnerDoc.mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: true }),
      delete: mockDel,
    });

    const req = new NextRequest("http://localhost:3000/api/beauty-log/2026-02-15");
    const res = await deleteLog(req, { params: Promise.resolve({ logId: "2026-02-15" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDel).toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetAuthUserId.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/beauty-log/2026-02-15");
    const res = await deleteLog(req, { params: Promise.resolve({ logId: "2026-02-15" }) });

    expect(res.status).toBe(401);
  });
});
