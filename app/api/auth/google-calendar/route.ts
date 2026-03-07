// GET /api/auth/google-calendar — Google Calendar OAuth 認証URL生成
//
// Settings UI から呼ばれ、認証URL を返す。
// CSRF 防御として state パラメータを httpOnly cookie に保存。

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthUserId } from "@/lib/api/auth";
import { generateAuthUrl } from "@/lib/api/google-calendar";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate CSRF state token
  const state = crypto.randomUUID();

  // Store state in httpOnly cookie (10 min TTL)
  const cookieStore = await cookies();
  cookieStore.set("calendar_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  const authUrl = generateAuthUrl(state);
  return NextResponse.json({ authUrl });
}
