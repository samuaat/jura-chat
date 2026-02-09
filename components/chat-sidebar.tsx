"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { Menu, Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChatSidebarProps {
  userId?: string;
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  className?: string; // classname prop
  isOpen: boolean; // open state
  onToggle: () => void; // toggle fn
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: any;
}

export function ChatSidebar({ userId, currentChatId, onSelectChat, onNewChat, className, isOpen, onToggle }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    console.log("ChatSidebar: Subscribing to chats for user:", userId);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("ChatSidebar: Snapshot received. Docs:", snapshot.docs.length);
      const fetchedChats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatSession[];
      setChats(fetchedChats);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      toast.error(`Chat betöltési hiba: ${error.message}`); // Show visible error
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Biztosan törölni szeretnéd ezt a beszélgetést?")) return;
    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (currentChatId === chatId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col w-[280px] h-full bg-[#f0f4f9] dark:bg-[#1e1f20] text-neutral-900 dark:text-[#E3E3E3] transition-colors duration-300",
      className
    )}>
      {/* Header: Menu Toggle */}
      <div className="px-4 pt-4 pb-2 flex items-center">
        <button
          onClick={onToggle}
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-[#2c2d2e] transition-colors text-neutral-600 dark:text-[#E3E3E3]"
          title="Menü összecsukása"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <button
          onClick={onNewChat}
          className="flex items-center gap-3 rounded-full bg-[#dfe3e7] dark:bg-[#282a2c] hover:bg-[#d1d5db] dark:hover:bg-[#37393b] px-4 py-3 text-sm font-medium text-neutral-900 dark:text-[#e3e3e3] transition w-fit min-w-[140px]"
        >
          <Plus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <span className="text-sm">Új csevegés</span>
        </button>
      </div>

      {/* Title: Legutóbbiak */}
      <div className="px-6 py-2">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Legutóbbiak</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <div className="flex flex-col gap-1 pb-4">
          {loading ? (
            <div className="px-4 py-2 text-xs text-neutral-500 animate-pulse">Betöltés...</div>
          ) : chats.length === 0 ? (
            <div className="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
              Nincs előzmény.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-full px-4 py-2 text-left text-sm transition relative overflow-hidden",
                  currentChatId === chat.id
                    ? "bg-[#c7d0d9] dark:bg-[#004a77] text-neutral-900 dark:text-[#c2e7ff] font-semibold"
                    : "text-neutral-700 dark:text-[#e3e3e3] hover:bg-neutral-200 dark:hover:bg-[#2c2d2e]"
                )}
                title={chat.title}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate flex-1 max-w-[170px]">{chat.title || "Új beszélgetés"}</span>

                {/* Delete Action (appear on hover) */}
                <div
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 absolute right-2 p-1.5 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer space */}
      <div className="p-2 mt-auto"></div>
    </div>
  );
}
