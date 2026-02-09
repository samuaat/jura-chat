"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Trash2, Plus, PanelLeftClose } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface ChatItem {
  id: string;
  title: string;
  updatedAt: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentChatId: string | null;
  anonymousUserId: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  currentChatId,
  anonymousUserId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);

  useEffect(() => {
    if (!anonymousUserId) return;

    const q = query(
      collection(db, "chats"),
      where("userId", "==", anonymousUserId),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: ChatItem[] = snapshot.docs.map((d) => ({
          id: d.id,
          title: d.data().title || "Uj beszélgetés",
          updatedAt: d.data().updatedAt?.toMillis?.() || 0,
        }));
        setChats(items);
      },
      (error) => {
        console.error("Sidebar subscription error:", error);
      }
    );

    return () => unsubscribe();
  }, [anonymousUserId]);

  async function handleDelete(chatId: string) {
    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (currentChatId === chatId) {
        onNewChat();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  if (!isOpen) return null;

  return (
    <aside className="hidden md:flex w-[280px] flex-shrink-0 flex-col bg-[#f0f4f9] dark:bg-[#1e1f20] border-r border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-[#2c2d2e] transition"
          aria-label="Oldalsáv bezárása"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg bg-[#dfe3e7] px-3 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-[#d1d5db] dark:bg-[#282a2c] dark:text-[#E3E3E3] dark:hover:bg-[#37393b]"
        >
          <Plus className="h-4 w-4" />
          Uj csevegés
        </button>
      </div>

      {/* Chat List */}
      <div className="px-3 pb-1">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Legutóbbiak
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 py-1">
          {chats.map((chat) => {
            const isActive = chat.id === currentChatId;
            return (
              <div key={chat.id} className="group relative">
                <button
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    isActive
                      ? "bg-[#c7d0d9] font-semibold text-neutral-900 dark:bg-[#004a77] dark:text-[#c2e7ff]"
                      : "text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-[#2c2d2e]"
                  }`}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate max-w-[170px]">{chat.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(chat.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded opacity-0 group-hover:opacity-100 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label="Törlés"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}

          {chats.length === 0 && (
            <p className="px-3 py-4 text-xs text-neutral-400 dark:text-neutral-500 text-center">
              Még nincs mentett beszélgetés
            </p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
