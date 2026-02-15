"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { REACTION_STAMPS } from "@/types/social";
import type { SocialComment, ReactionKey } from "@/types/social";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たった今";
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return new Date(dateStr).toLocaleDateString("ja-JP");
}

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: SocialComment[];
  commentCount: number;
  onAddComment: (
    text: string,
    type: "comment" | "reaction",
    reactionKey?: string
  ) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  currentUserId?: string;
}

export function CommentsSheet({
  open,
  onOpenChange,
  comments,
  commentCount,
  onAddComment,
  onDeleteComment,
  currentUserId,
}: CommentsSheetProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onAddComment(text.trim(), "comment");
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleSendReaction = async (key: ReactionKey) => {
    if (sending) return;
    setSending(true);
    try {
      await onAddComment("", "reaction", key);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] flex flex-col rounded-t-[20px]">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-sm font-display">
            コメント ({commentCount})
          </SheetTitle>
        </SheetHeader>

        {/* Quick reactions */}
        <div className="flex gap-2 pb-3 border-b border-alcheme-sand">
          {REACTION_STAMPS.map((stamp) => (
            <button
              key={stamp.key}
              onClick={() => handleSendReaction(stamp.key)}
              disabled={sending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-alcheme-sand/50 hover:bg-alcheme-sand text-xs transition-colors btn-squishy disabled:opacity-50"
            >
              <span>{stamp.emoji}</span>
              <span className="text-alcheme-charcoal">{stamp.label}</span>
            </button>
          ))}
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-center text-sm text-alcheme-muted py-8">
              まだコメントがありません
            </p>
          )}
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-accent to-magic-pink flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.author_photo_url ? (
                  <img
                    src={comment.author_photo_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (comment.author_display_name || "?").charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-alcheme-charcoal truncate">
                    {comment.author_display_name || "ユーザー"}
                  </span>
                  <span className="text-xs text-alcheme-muted shrink-0">
                    {timeAgo(comment.created_at)}
                  </span>
                </div>
                {comment.type === "reaction" ? (
                  <p className="text-sm mt-0.5">
                    {REACTION_STAMPS.find((s) => s.key === comment.reaction_key)?.emoji}{" "}
                    {REACTION_STAMPS.find((s) => s.key === comment.reaction_key)?.label}
                  </p>
                ) : (
                  <p className="text-sm text-alcheme-charcoal mt-0.5">
                    {comment.text}
                  </p>
                )}
                {onDeleteComment && currentUserId === comment.user_id && (
                  <button
                    onClick={() => onDeleteComment(comment.id)}
                    className="text-xs text-alcheme-muted hover:text-alcheme-rose mt-1"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2 pt-3 border-t border-alcheme-sand">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendComment();
              }
            }}
            placeholder="コメントを入力..."
            className="flex-1 bg-alcheme-sand/30 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-neon-accent/30"
            disabled={sending}
          />
          <button
            onClick={handleSendComment}
            disabled={!text.trim() || sending}
            className="w-9 h-9 rounded-full bg-gradient-to-r from-neon-accent to-magic-pink flex items-center justify-center text-white btn-squishy disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
