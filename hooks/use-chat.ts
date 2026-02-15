"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/types/chat";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "おはようございます！✨ 今日はどんなメイクにしましょうか？手持ちのコスメから最適なレシピを提案しますよ！",
  created_at: new Date().toISOString(),
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (text: string, imageBase64?: string, imageMimeType?: string) => {
      if (!text.trim() && !imageBase64) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        image_url: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined,
        created_at: new Date().toISOString(),
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        is_streaming: true,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setInputValue("");
      setThinkingStatus("考え中...");

      try {
        abortRef.current = new AbortController();

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            image_base64: imageBase64,
            image_mime_type: imageMimeType,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            if (json === "[DONE]") continue;

            try {
              const event = JSON.parse(json);
              if (event.type === "progress") {
                setThinkingStatus(event.data);
              } else if (event.type === "text_delta") {
                setThinkingStatus(null); // Clear thinking once text arrives
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.data }
                      : m
                  )
                );
              } else if (event.type === "recipe_card") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, data: JSON.parse(event.data) }
                      : m
                  )
                );
              } else if (event.type === "preview_image") {
                const previewData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, preview_image_url: previewData.image_url }
                      : m
                  )
                );
              } else if (event.type === "error") {
                setThinkingStatus(null);
                console.error("[chat] Agent error:", event.data);
                const errorDetail = typeof event.data === "string" && event.data.length > 0
                  ? `エラーが発生しました: ${event.data}`
                  : "すみません、エラーが発生しました。もう一度お試しください。";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content || errorDetail }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed events
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || "すみません、エラーが発生しました。もう一度お試しください。" }
              : m
          )
        );
      } finally {
        // Ensure no empty bubbles: if content is still empty after stream ends, show fallback
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, is_streaming: false, content: m.content || "すみません、応答を取得できませんでした。もう一度お試しください。" }
              : m
          )
        );
        setIsLoading(false);
        setThinkingStatus(null);
        abortRef.current = null;
      }
    },
    []
  );

  const resetSession = useCallback(async () => {
    try {
      await fetch("/api/chat/session", { method: "DELETE" });
    } catch {
      // Ignore — session reset is best-effort
    }
    setMessages([INITIAL_MESSAGE]);
    setThinkingStatus(null);
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, inputValue, setInputValue, thinkingStatus, resetSession };
}
