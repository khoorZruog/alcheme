"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Settings, RotateCcw } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { QuickActionChips } from "@/components/quick-action-chips";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const { messages, isLoading, sendMessage, inputValue, setInputValue, thinkingStatus, resetSession } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showChips = messages.length <= 1 && !isLoading;

  const handleChipSelect = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden">
      {/* Glass Header */}
      <header className="fixed top-0 w-full glass-panel border-b-0 z-20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-neon-accent to-magic-pink flex items-center justify-center text-white font-display italic font-bold text-xl shadow-lg">
            A
          </div>
          <h1 className="font-display font-bold text-2xl text-text-ink leading-none">
            alche:me
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetSession}
            className="p-2 text-text-muted hover:text-text-ink transition-colors rounded-full"
            aria-label="チャットをリセット"
            title="チャットをリセット"
          >
            <RotateCcw size={18} />
          </button>
          <Link
            href="/settings"
            className="p-2 text-text-muted hover:text-text-ink transition-colors rounded-full"
            aria-label="設定"
          >
            <Settings size={20} />
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-24 pb-40 px-4 hide-scrollbar">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((msg) => {
            // Skip empty assistant message while thinking (the Thinking indicator handles it)
            if (msg.role === "assistant" && msg.content === "" && msg.is_streaming) return null;
            return <ChatMessage key={msg.id} message={msg} />;
          })}

          {/* Thinking indicator */}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <ThinkingIndicator status={thinkingStatus} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-44 left-0 right-0 z-30">
        <div className="mx-auto max-w-2xl">
          <QuickActionChips visible={showChips} onSelect={handleChipSelect} />
        </div>
      </div>

      {/* Floating Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={sendMessage}
        disabled={isLoading}
      />
    </div>
  );
}
