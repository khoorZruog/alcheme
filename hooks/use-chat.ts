"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, Conversation } from "@/types/chat";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "おはようございます！✨ 今日はどんなメイクにしましょうか？手持ちのコスメから最適なレシピを提案しますよ！",
  created_at: new Date().toISOString(),
};

// --- Firestore persistence helpers ---

async function apiCreateConversation(title: string): Promise<Conversation> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

async function apiSaveMessage(
  conversationId: string,
  msg: Pick<ChatMessage, "role" | "content" | "image_url" | "preview_image_url" | "agent_used" | "data">
) {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
  if (!res.ok) throw new Error("Failed to save message");
  return res.json();
}

async function apiFetchConversations(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error("Failed to fetch conversations");
  const data = await res.json();
  return data.conversations;
}

async function apiFetchConversation(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

async function apiDeleteConversation(id: string) {
  const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

async function apiUpdateConversationTitle(id: string, title: string) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
}

// --- Hook ---

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Conversation history state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  // Load conversation list on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const list = await apiFetchConversations();
      setConversations(list);
    } catch {
      // Silently fail — user may not be logged in yet
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // Reset agent session when switching conversations
      await fetch("/api/chat/session", { method: "DELETE" }).catch(() => {});
      const { conversation, messages: msgs } = await apiFetchConversation(id);
      setConversationId(conversation.id);
      setMessages(msgs.length > 0 ? msgs : [INITIAL_MESSAGE]);
    } catch {
      console.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      await fetch("/api/chat/session", { method: "DELETE" }).catch(() => {});
    } catch {
      // best-effort
    }
    setConversationId(null);
    setMessages([INITIAL_MESSAGE]);
    setThinkingStatus(null);
    setIsLoading(false);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await apiDeleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      // If deleting the active conversation, start fresh
      if (id === conversationId) {
        startNewConversation();
      }
    } catch {
      console.error("Failed to delete conversation");
    }
  }, [conversationId, startNewConversation]);

  const renameConversation = useCallback(async (id: string, title: string) => {
    try {
      await apiUpdateConversationTitle(id, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch {
      console.error("Failed to rename conversation");
    }
  }, []);

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

      // --- Firestore: ensure conversation exists ---
      let activeConvId = conversationId;
      try {
        if (!activeConvId) {
          const title = text.slice(0, 30);
          const conv = await apiCreateConversation(title);
          activeConvId = conv.id;
          setConversationId(conv.id);
          setConversations((prev) => [conv, ...prev]);
        }
        // Save user message (fire-and-forget)
        apiSaveMessage(activeConvId, {
          role: "user",
          content: text,
          image_url: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined,
        }).catch(() => {});
      } catch {
        // If conversation creation fails, continue without persistence
      }

      // --- Streaming (unchanged logic) ---
      let finalContent = "";
      let finalData: ChatMessage["data"] | undefined;
      let finalPreviewUrl: string | undefined;
      let finalAgentUsed: string | undefined;

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

        const processLine = (rawLine: string) => {
          const line = rawLine.replace(/\r$/, ""); // Handle \r\n line endings
          if (!line.startsWith("data: ")) return;
          const json = line.slice(6);
          if (json === "[DONE]") return;

          try {
            const event = JSON.parse(json);
            if (event.type === "progress") {
              setThinkingStatus(event.data);
            } else if (event.type === "text_delta") {
              setThinkingStatus(null);
              finalContent += event.data;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + event.data }
                    : m
                )
              );
            } else if (event.type === "recipe_card") {
              finalData = JSON.parse(event.data);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, data: JSON.parse(event.data) }
                    : m
                )
              );
            } else if (event.type === "preview_image") {
              const previewData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
              finalPreviewUrl = previewData.image_url;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, preview_image_url: previewData.image_url }
                    : m
                )
              );
            } else if (event.type === "agent_used") {
              finalAgentUsed = event.data;
            } else if (event.type === "error") {
              setThinkingStatus(null);
              console.error("[chat] Agent error:", event.data);
              const errorDetail = typeof event.data === "string" && event.data.length > 0
                ? `エラーが発生しました: ${event.data}`
                : "すみません、エラーが発生しました。もう一度お試しください。";
              finalContent = finalContent || errorDetail;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content || errorDetail }
                    : m
                )
              );
            }
          } catch (parseErr) {
            console.warn("[chat] SSE parse error:", parseErr, "raw:", rawLine);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            processLine(line);
          }
        }

        // Flush decoder and process any remaining buffer
        buffer += decoder.decode();
        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            processLine(line);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        const fallback = "すみません、エラーが発生しました。もう一度お試しください。";
        finalContent = finalContent || fallback;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content || fallback }
              : m
          )
        );
      } finally {
        const finalFallback = "すみません、応答を取得できませんでした。もう一度お試しください。";
        const hadContent = !!finalContent;
        finalContent = finalContent || finalFallback;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, is_streaming: false, content: m.content || finalFallback }
              : m
          )
        );
        setIsLoading(false);
        setThinkingStatus(null);
        abortRef.current = null;

        // --- Firestore: save assistant message (skip fallback-only messages) ---
        if (activeConvId && hadContent) {
          apiSaveMessage(activeConvId, {
            role: "assistant",
            content: finalContent,
            preview_image_url: finalPreviewUrl,
            agent_used: finalAgentUsed,
            data: finalData,
          }).catch(() => {});
        }
      }
    },
    [conversationId]
  );

  const resetSession = useCallback(async () => {
    await startNewConversation();
  }, [startNewConversation]);

  return {
    messages,
    isLoading,
    sendMessage,
    inputValue,
    setInputValue,
    thinkingStatus,
    resetSession,
    // Conversation history
    conversationId,
    conversations,
    conversationsLoading,
    loadConversations,
    loadConversation,
    startNewConversation,
    deleteConversation,
    renameConversation,
  };
}
