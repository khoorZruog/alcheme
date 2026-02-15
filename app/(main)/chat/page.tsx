"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Settings, History, SquarePen } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { QuickActionChips } from "@/components/quick-action-chips";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar";
import { useSideMenu } from "@/lib/contexts/side-menu-context";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const {
    messages,
    isLoading,
    sendMessage,
    inputValue,
    setInputValue,
    thinkingStatus,
    conversationId,
    conversations,
    conversationsLoading,
    loadConversation,
    startNewConversation,
    deleteConversation,
  } = useChat();

  const { openSideMenu } = useSideMenu();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <header className="fixed top-0 w-full glass-panel border-b-0 z-20 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ProfileAvatar onClick={openSideMenu} />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon-accent to-magic-pink flex items-center justify-center text-white font-display italic font-bold text-base shadow-lg">
            A
          </div>
          <h1 className="font-display font-bold text-2xl text-text-ink leading-none">
            alche:me
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-text-muted hover:text-text-ink transition-colors rounded-full"
            aria-label="チャット履歴"
            title="チャット履歴"
          >
            <History size={18} />
          </button>
          <button
            onClick={startNewConversation}
            className="p-2 text-text-muted hover:text-text-ink transition-colors rounded-full"
            aria-label="新しいチャット"
            title="新しいチャット"
          >
            <SquarePen size={18} />
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

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        conversations={conversations}
        activeConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={startNewConversation}
        onDeleteConversation={deleteConversation}
        isLoading={conversationsLoading}
      />

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-24 pb-40 px-4 hide-scrollbar">
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((msg) => {
            // Skip empty assistant message while thinking (the Thinking indicator handles it)
            if (msg.role === "assistant" && msg.content === "" && msg.is_streaming) return null;
            return <ChatMessage key={msg.id} message={msg} onSendMessage={sendMessage} disabled={isLoading} />;
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
