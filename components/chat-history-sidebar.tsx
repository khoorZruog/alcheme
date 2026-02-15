"use client";

import { useMemo } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { Conversation } from "@/types/chat";

interface ChatHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  isLoading?: boolean;
}

type DateGroup = {
  label: string;
  conversations: Conversation[];
};

function groupByDate(conversations: Conversation[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, Conversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const conv of conversations) {
    const d = new Date(conv.updated_at);
    if (d >= today) {
      groups.today.push(conv);
    } else if (d >= yesterday) {
      groups.yesterday.push(conv);
    } else if (d >= weekAgo) {
      groups.week.push(conv);
    } else {
      groups.older.push(conv);
    }
  }

  const result: DateGroup[] = [];
  if (groups.today.length > 0) result.push({ label: "今日", conversations: groups.today });
  if (groups.yesterday.length > 0) result.push({ label: "昨日", conversations: groups.yesterday });
  if (groups.week.length > 0) result.push({ label: "過去7日間", conversations: groups.week });
  if (groups.older.length > 0) result.push({ label: "それ以前", conversations: groups.older });

  return result;
}

export function ChatHistorySidebar({
  open,
  onOpenChange,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading,
}: ChatHistorySidebarProps) {
  const groups = useMemo(() => groupByDate(conversations), [conversations]);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onOpenChange(false);
  };

  const handleNew = () => {
    onNewConversation();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] sm:max-w-[300px] p-0 flex flex-col bg-[#FAFAFA]!">
        <SheetHeader className="p-4 pb-2 border-b border-gray-200">
          <SheetTitle className="text-text-ink text-base">チャット履歴</SheetTitle>
          <SheetDescription className="sr-only">過去のチャットを選択できます</SheetDescription>
        </SheetHeader>

        {/* New Chat Button */}
        <div className="px-3 py-2">
          <button
            onClick={handleNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-text-muted hover:text-text-ink hover:border-neon-accent/40 transition-colors text-sm"
          >
            <Plus size={16} />
            新しいチャット
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 hide-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-text-muted text-sm">
              読み込み中...
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-text-muted text-sm gap-2">
              <MessageSquare size={24} className="opacity-50" />
              チャット履歴はまだありません
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mt-3">
                <div className="px-2 py-1 text-xs font-medium text-text-muted/70 uppercase tracking-wide">
                  {group.label}
                </div>
                {group.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                      conv.id === activeConversationId
                        ? "bg-neon-accent/10 text-text-ink"
                        : "hover:bg-gray-100 text-text-muted"
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(conv.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <span className="block text-sm truncate">
                        {conv.title || "新しいチャット"}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-text-muted hover:text-red-400 transition-all"
                      aria-label="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
