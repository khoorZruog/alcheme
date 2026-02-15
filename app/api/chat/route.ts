// POST /api/chat — SSE ストリーミングチャット (Agent Server proxy)

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api/auth";
import { callAgentStream } from "@/lib/api/agent-client";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Agent processing can take 60-90s for complex recipes

export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, image_base64, image_mime_type } = body;

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Call agent server with streaming
    // Session ID is server-determined; no need to send from client
    const agentStream = await callAgentStream("/chat", {
      message,
      user_id: userId,
      ...(image_base64 && image_mime_type
        ? { image_base64, image_mime_type }
        : {}),
    });

    if (!agentStream) {
      // Agent returned no stream — send a fallback error as SSE
      const encoder = new TextEncoder();
      const fallback = new ReadableStream({
        start(controller) {
          const errorMsg = JSON.stringify({
            type: "text_delta",
            data: "エージェントに接続できませんでした。しばらくしてからもう一度お試しください。",
          });
          controller.enqueue(encoder.encode(`data: ${errorMsg}\n\n`));
          const done = JSON.stringify({ type: "done", data: "" });
          controller.enqueue(encoder.encode(`data: ${done}\n\n`));
          controller.close();
        },
      });
      return new Response(fallback, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Proxy the SSE stream from agent server → client
    return new Response(agentStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);

    // Return error as SSE stream so frontend doesn't break
    const encoder = new TextEncoder();
    const isConnRefused =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("fetch failed"));

    const errorMessage = isConnRefused
      ? "エージェントサーバーに接続できません。サーバーが起動しているか確認してください。"
      : "チャット処理中にエラーが発生しました。もう一度お試しください。";

    const errorStream = new ReadableStream({
      start(controller) {
        const msg = JSON.stringify({ type: "text_delta", data: errorMessage });
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        const done = JSON.stringify({ type: "done", data: "" });
        controller.enqueue(encoder.encode(`data: ${done}\n\n`));
        controller.close();
      },
    });

    return new Response(errorStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
}
