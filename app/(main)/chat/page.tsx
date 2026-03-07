"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Settings, History, SquarePen } from "lucide-react";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { QuickActionChips } from "@/components/quick-action-chips";
import { ThinkingIndicator } from "@/components/thinking-indicator";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar";
import { ChatContextStrip } from "@/components/chat-context-strip";
import { ChatGreeting } from "@/components/chat-greeting";
import { CosmePickerSheet } from "@/components/cosme-picker-sheet";
import { ThemeOverlay } from "@/components/theme-overlay";
import { RecipeOmikujiOverlay } from "@/components/recipe-omikuji-overlay";
import { useSideMenu } from "@/lib/contexts/side-menu-context";
import { useChat } from "@/hooks/use-chat";
import { useInventory } from "@/hooks/use-inventory";
import type { ThemeSuggestion } from "@/types/theme";
import type { Recipe } from "@/types/recipe";

/** Detect if the user's input is a theme suggestion request (should open ThemeOverlay) */
function isThemeSuggestionRequest(text: string): boolean {
  const t = text.trim();
  if (/テーマ/.test(t) && /(提案|おすすめ|教えて|考えて|出して)/.test(t)) return true;
  return false;
}

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
    stopGeneration,
    retryLastMessage,
    selectedItems,
    addSelectedItems,
    removeSelectedItem,
    matchMode,
    setMatchMode,
    selectedBrands,
    setSelectedBrands,
  } = useChat();

  const { items: inventoryItems } = useInventory();
  const { openSideMenu } = useSideMenu();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const suggestHandled = useRef(false);
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cosmePickerOpen, setCosmePickerOpen] = useState(false);
  const [themeOverlayOpen, setThemeOverlayOpen] = useState(false);
  const [omikujiOverlayOpen, setOmikujiOverlayOpen] = useState(false);

  // Handle deep link from inventory insights: ?suggest_item={id}
  useEffect(() => {
    if (suggestHandled.current) return;
    const itemId = searchParams.get("suggest_item");
    if (itemId && inventoryItems.length > 0) {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (item) {
        suggestHandled.current = true;
        addSelectedItems([item]);
        setInputValue("このコスメを使ったメイクを提案して");
      }
    }
  }, [searchParams, inventoryItems, addSelectedItems, setInputValue]);

  // Handle deep link from recipes page: ?theme_title={title}&theme_id={id}
  const themeHandled = useRef(false);
  useEffect(() => {
    if (themeHandled.current) return;
    const themeTitle = searchParams.get("theme_title");
    const themeId = searchParams.get("theme_id");
    if (themeTitle) {
      themeHandled.current = true;
      sendMessage(
        `「${themeTitle}」のメイクを提案して`,
        undefined, undefined, undefined, undefined, undefined, themeId || undefined
      );
    }
  }, [searchParams, sendMessage]);

  const handleThemeSelected = useCallback(
    (theme: ThemeSuggestion) => {
      sendMessage(
        `「${theme.title}」のメイクを提案して`,
        undefined, undefined, undefined, undefined, undefined, theme.id
      );
    },
    [sendMessage]
  );

  const handleOmikujiSelected = useCallback(
    (recipe: Recipe) => {
      setOmikujiOverlayOpen(false);
      router.push(`/recipes/${recipe.id}`);
    },
    [router]
  );

  const handleRequestNewRecipe = useCallback(() => {
    setOmikujiOverlayOpen(false);
    sendMessage("おまかせで新しいメイクレシピを提案して");
  }, [sendMessage]);

  const handleSelectItemForRecipe = useCallback(
    (itemId: string, itemName: string) => {
      const item = inventoryItems.find((i) => i.id === itemId);
      if (item) {
        addSelectedItems([item]);
        sendMessage(`「${itemName}」を使ったメイクを提案して`);
      }
    },
    [inventoryItems, addSelectedItems, sendMessage]
  );

  // Intercept theme suggestion requests → open ThemeOverlay instead of sending to agent
  const handleSend = useCallback(
    (text: string, imageBase64?: string, imageMimeType?: string) => {
      if (!imageBase64 && isThemeSuggestionRequest(text)) {
        setThemeOverlayOpen(true);
        setInputValue("");
        return;
      }
      sendMessage(text, imageBase64, imageMimeType);
    },
    [sendMessage, setInputValue]
  );

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showChips = messages.length <= 1 && !isLoading;

  const handleChipSelect = (text: string, action?: string) => {
    if (action === "theme") {
      setThemeOverlayOpen(true);
    } else if (action === "omikuji") {
      setOmikujiOverlayOpen(true);
    } else if (action === "cosme_picker") {
      setCosmePickerOpen(true);
    } else {
      sendMessage(text);
    }
  };

  return (
    <div className="flex flex-col h-dvh relative overflow-hidden">
      {/* Glass Header */}
      <header className="fixed top-0 w-full glass-panel border-b-0 z-20 px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ProfileAvatar onClick={openSideMenu} />
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
        <div className="mx-auto max-w-2xl">
          {/* Welcome screen — context strip + greeting + quick actions */}
          {messages.length <= 1 && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-260px)]">
              <ChatContextStrip />
              <ChatGreeting />
              <div className="mt-6 w-full">
                <QuickActionChips visible={showChips} onSelect={handleChipSelect} />
              </div>
            </div>
          )}
        </div>
        <div className="mx-auto max-w-2xl space-y-6">
          {messages.map((msg, idx) => {
            // Hide initial AI greeting while welcome screen is shown
            if (messages.length <= 1 && idx === 0 && msg.role === "assistant") return null;
            // Skip empty assistant message while thinking (the Thinking indicator handles it)
            if (msg.role === "assistant" && msg.content === "" && msg.is_streaming) return null;
            const isLastAssistant =
              msg.role === "assistant" &&
              !msg.is_streaming &&
              idx === messages.findLastIndex((m) => m.role === "assistant" && !m.is_streaming);
            return (
              <ChatMessage
                key={msg.id}
                message={msg}
                onSendMessage={sendMessage}
                onSelectItemForRecipe={handleSelectItemForRecipe}
                onRetry={retryLastMessage}
                isLastAssistant={isLastAssistant}
                disabled={isLoading}
              />
            );
          })}

          {/* Thinking indicator */}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <ThinkingIndicator status={thinkingStatus} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Floating Input */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onStop={stopGeneration}
        isLoading={isLoading}
        disabled={isLoading}
        selectedItems={selectedItems}
        onOpenPicker={() => setCosmePickerOpen(true)}
        onRemoveItem={removeSelectedItem}
        matchMode={matchMode}
        selectedBrands={selectedBrands}
        onRemoveBrand={(brand) => setSelectedBrands((prev) => prev.filter((b) => b !== brand))}
        onResetMode={() => setMatchMode("owned_only")}
      />

      {/* Cosme Picker Sheet */}
      <CosmePickerSheet
        open={cosmePickerOpen}
        onOpenChange={setCosmePickerOpen}
        onConfirm={addSelectedItems}
        items={inventoryItems}
        initialSelected={selectedItems}
        matchMode={matchMode}
        onMatchModeChange={setMatchMode}
        selectedBrands={selectedBrands}
        onBrandsChange={setSelectedBrands}
      />

      {/* Theme Suggestion Overlay */}
      <ThemeOverlay
        open={themeOverlayOpen}
        onClose={() => setThemeOverlayOpen(false)}
        onThemeSelected={handleThemeSelected}
      />

      {/* Recipe Omikuji Overlay */}
      <RecipeOmikujiOverlay
        open={omikujiOverlayOpen}
        onClose={() => setOmikujiOverlayOpen(false)}
        onRecipeSelected={handleOmikujiSelected}
        onRequestNewRecipe={handleRequestNewRecipe}
      />
    </div>
  );
}
