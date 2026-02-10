"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Menu,
  ArrowUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  PanelLeft,
} from "lucide-react";

import { ChatSidebar } from "@/components/chat-sidebar";
import { ThemeToggle } from "@/components/theme-toggle"; // Using existing
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { getAnonymousUserId } from "@/lib/anonymous-user";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const HISTORY_LIMIT = 10;
const SITE_URL = "https://jura-chat.vercel.app";
const CANONICAL = SITE_URL;

const CHAT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": ["WebPage", "QAPage"],
  "@id": `${CANONICAL}/chat/#page`,
  url: `${CANONICAL}/chat`,
  name: "JURA – jogi chatfelület",
  inLanguage: "hu-HU",
  isPartOf: { "@id": `${CANONICAL}/#website` },
  about: { "@id": `${CANONICAL}/#jura` },
  description:
    "Interaktív jogi információs chatfelület, ahol a JURA segít a magyar jogszabályok és jogi fogalmak jobb megértésében. A válaszok nem minősülnek jogi tanácsadásnak.",
} as const;

const suggestions = [
  "Mennyi a felmondási idő a munka törvénykönyve szerint?",
  "Milyen jogaid vannak online vásárlás elállásakor 14 napon belül?",
  "Mikor követelhetek kártérítést szerződésszegés miatt?",
  "Milyen jogai vannak a bérlőnek lakásbérleti szerződésnél?",
  "Hogyan oszlik meg a hagyaték a törvényes öröklés szabályai szerint?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Anonymous user
  const [anonymousUserId, setAnonymousUserId] = useState("");

  // Response time tracking
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [totalResponseMs, setTotalResponseMs] = useState(0);
  const [responseCount, setResponseCount] = useState(0);

  // Copy feedback
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Feedback tracking
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<number, "like" | "dislike">
  >({});

  // Upgrade alert


  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const loadingTimerRef = useRef<number | null>(null);
  const requestStartRef = useRef<number | null>(null);
  const shouldScrollOnceRef = useRef(false);

  // Init anonymous user ID
  useEffect(() => {
    setAnonymousUserId(getAnonymousUserId());
  }, []);

  // Auto-scroll to latest message ONLY when explicitly requested (e.g. new message sent)
  useEffect(() => {
    if (messages.length === 0) return;
    if (shouldScrollOnceRef.current) {
      shouldScrollOnceRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  // Firestore save
  async function saveToFirestore(
    allMessages: ChatMessage[],
    userQuery: string
  ) {
    if (!anonymousUserId) return;

    try {
      if (!currentChatId) {
        const title =
          userQuery.length > 50
            ? userQuery.substring(0, 50) + "..."
            : userQuery;
        const newDocRef = await addDoc(collection(db, "chats"), {
          userId: anonymousUserId,
          title,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: allMessages,
        });
        setCurrentChatId(newDocRef.id);
      } else {
        const chatRef = doc(db, "chats", currentChatId);
        await updateDoc(chatRef, {
          messages: allMessages,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Firestore save error:", err);
    }
  }

  async function handleSelectChat(chatId: string) {
    if (loading) return;
    try {
      const docRef = doc(db, "chats", chatId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
        setFeedbackGiven({});
        shouldScrollOnceRef.current = true; // Scroll to bottom when loading a chat
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
      toast.error("Nem sikerült betölteni a beszélgetést.");
    }
  }

  function handleNewChat() {
    setMessages([]);
    setCurrentChatId(null);
    setInput("");
    setFeedbackGiven({});
  }

  async function handleFeedback(
    type: "like" | "dislike",
    msgIndex: number,
    assistantContent: string
  ) {
    const userQuery =
      msgIndex > 0 && messages[msgIndex - 1]?.role === "user"
        ? messages[msgIndex - 1].content
        : "";

    setFeedbackGiven((prev) => ({ ...prev, [msgIndex]: type }));

    try {
      await addDoc(collection(db, "feedback"), {
        type,
        query: userQuery,
        response: assistantContent.substring(0, 2000),
        userId: anonymousUserId,
        chatId: currentChatId || null,
        createdAt: serverTimestamp(),
      });
      toast.success(
        type === "like"
          ? "Köszönjük a pozitív visszajelzést!"
          : "Köszönjük a visszajelzést, javítani fogunk!"
      );
    } catch (err) {
      console.error("Feedback save error:", err);
      toast.error("Nem sikerült menteni a visszajelzést.");
    }
  }

  async function sendMessage(overrideText?: string) {
    const raw = overrideText ?? input;
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    if (messages.length === 0) {
      // Logic for first message if needed
    }

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
    };
    const updatedMessages = [...messages, userMessage, assistantPlaceholder];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    shouldScrollOnceRef.current = true; // Scroll to bottom when sending a message

    requestStartRef.current = Date.now();

    setLoadingSeconds(0);
    if (loadingTimerRef.current !== null) {
      window.clearInterval(loadingTimerRef.current);
    }
    loadingTimerRef.current = window.setInterval(() => {
      if (!requestStartRef.current) return;
      const diffSec = Math.floor(
        (Date.now() - requestStartRef.current) / 1000
      );
      setLoadingSeconds(diffSec);
    }, 1000);

    try {
      const limitedHistory = messages.slice(-HISTORY_LIMIT);

      // FIX: Közvetlen Cloud Run URL használata mindig (production fix)
      const API_URL = "https://ssrjurav2-74elkdduqa-ew.a.run.app/api/chat";

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: limitedHistory,
        }),
      });

      if (!res.ok) {
        let backendError = "Ismeretlen API hiba";
        try {
          const errData = await res.json();
          if (typeof errData?.error === "string") backendError = errData.error;
        } catch { }
        throw new Error(backendError);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let rafPending = false;
      let firstRealChunk = true;

      const flushToUI = (text: string) => {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = { ...last, content: text };
          }
          return next;
        });
      };

      if (!reader) {
        const text = await res.text();
        content = text.replace(/\0/g, "");
        flushToUI(
          content ||
          "Nem érkezett válasz a modelltől. Kérlek, próbáld meg újra egy kicsit később."
        );
      } else {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder
            .decode(value, { stream: true })
            .replace(/\0/g, "");
          if (!chunk) continue;

          if (firstRealChunk) {
            firstRealChunk = false;
            setLoadingSeconds(0);
          }

          content += chunk;

          if (!rafPending) {
            rafPending = true;
            const snapshot = content;
            requestAnimationFrame(() => {
              flushToUI(snapshot);
              rafPending = false;
            });
          }
        }
        flushToUI(
          content ||
          "Nem érkezett válasz a modelltől. Kérlek, próbáld meg újra egy kicsit később."
        );
      }

      const errorMatch = content.match(
        /\[STREAM_ERROR\]([\s\S]*?)\[\/STREAM_ERROR\]/
      );
      if (errorMatch) {
        content =
          content.replace(/\[STREAM_ERROR\][\s\S]*?\[\/STREAM_ERROR\]/, "").trim() ||
          `Hiba a válasz közben: ${errorMatch[1]}`;
        flushToUI(content);
      }

      const finalMessages = [...updatedMessages];
      finalMessages[finalMessages.length - 1] = {
        role: "assistant",
        content,
      };
      saveToFirestore(finalMessages, trimmed);
    } catch (error: any) {
      console.error("Chat hiba:", error);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        const errorContent =
          error?.message ||
          "Hiba történt a válasz feldolgozása közben. Kérlek, próbáld meg újra később.";
        if (last && last.role === "assistant" && last.content === "") {
          next[next.length - 1] = { role: "assistant", content: errorContent };
          return next;
        }
        return [...next, { role: "assistant", content: errorContent }];
      });
    } finally {
      setLoading(false);
      if (loadingTimerRef.current !== null) {
        window.clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      if (requestStartRef.current !== null) {
        const duration = Date.now() - requestStartRef.current;
        setTotalResponseMs((prev) => prev + duration);
        setResponseCount((prev) => prev + 1);
        requestStartRef.current = null;
      }
      setLoadingSeconds(0);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function handleSuggestionClick(text: string) {
    sendMessage(text);
  }

  async function handleCopy(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => {
        setCopiedIndex((current) => (current === index ? null : current));
      }, 1500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  }

  const showEmptyState = messages.length === 0;
  const avgSeconds =
    responseCount > 0
      ? Math.round(totalResponseMs / responseCount / 1000)
      : null;



  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CHAT_JSON_LD) }}
      />
      <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-[#131314]">
        <ChatSidebar
          userId={anonymousUserId}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex"
        />

        <div className="flex flex-1 flex-col h-full min-w-0 relative">
          {!isSidebarOpen && (
            <div className="absolute top-3 left-4 z-50 hidden md:block">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-[#2c2d2e] transition-colors text-neutral-600 dark:text-[#E3E3E3]"
                title="Menü kinyitása"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}

          <header className="shrink-0 border-b border-neutral-200 dark:border-[#131314] bg-white dark:bg-[#131314] z-20">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden p-2 text-neutral-600 dark:text-neutral-400"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <Link href="/" className="flex items-center gap-2">
                  <img
                    src="/images/jura-logo.png"
                    alt="JURA logó"
                    className="h-8 w-auto"
                  />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col relative w-full overflow-hidden bg-white dark:bg-[#131314]">
            {showEmptyState ? (
              <ScrollArea className="flex-1 w-full h-full">
                <section className="flex flex-col items-center justify-center min-h-full px-6 py-10">
                  <div className="flex w-full max-w-3xl flex-col items-center text-center space-y-8">
                    <h1 className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-[#E3E3E3] sm:text-3xl">
                      Üdvözöllek a JURA-ban!
                    </h1>



                    <p className="mb-8 max-w-3xl text-sm text-neutral-900 dark:text-[#E3E3E3]">
                      Kérdezz a magyar jogról – például munkajogról, fogyasztóvédelemről, szerződésekről, bérletről vagy öröklésről.<br />A válaszok nem minősülnek jogi tanácsadásnak.
                    </p>

                    <div className="mb-8 w-full flex flex-wrap justify-center gap-6">
                      {suggestions.map((tip) => (
                        <button
                          key={tip}
                          type="button"
                          onClick={() => handleSuggestionClick(tip)}
                          className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-[#282A2C] px-5 py-3 text-left text-xs text-neutral-900 dark:text-[#E3E3E3] shadow-xs transition hover:shadow-sm hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 sm:text-sm"
                        >
                          {tip}
                        </button>
                      ))}
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#131314] px-6 py-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] focus-within:shadow-[0_0_25px_rgba(16,185,129,0.1)] transition-shadow duration-300"
                    >
                      <textarea
                        ref={textareaRef}
                        id="chat-input-empty"
                        aria-label="Írd be a kérdésed"
                        rows={1}
                        placeholder="Írd be a kérdésed... (pl. Mit ír elő a Ptk. 6:519. §?)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="max-h-40 flex-1 resize-none overflow-y-auto border-none bg-transparent py-3 pr-3 text-base text-neutral-900 dark:text-[#E3E3E3] outline-none placeholder:text-neutral-500 placeholder:leading-normal"
                      />
                      <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="flex items-center rounded-xl bg-neutral-200 px-5 py-3 text-base font-semibold text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-300 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Küldés
                      </button>
                    </form>

                    <p className="mt-3 text-[11px] leading-relaxed text-neutral-900 dark:text-[#E3E3E3]">
                      A JURA egy kísérleti jogi AI-asszisztens. A válaszok{" "}
                      <strong>nem minősülnek jogi tanácsadásnak</strong>, és nem
                      helyettesítik ügyvéd véleményét. Részletek:{" "}
                      <Link
                        href="/jogi-nyilatkozat"
                        className="underline-offset-2 hover:text-neutral-900 dark:text-[#E3E3E3] hover:underline"
                      >
                        jogi nyilatkozat →
                      </Link>
                    </p>
                  </div>
                </section>
              </ScrollArea>
            ) : (
              <>
                <section className="flex flex-1 justify-center relative min-h-0">
                  <div className="w-full h-full overflow-y-auto px-6 pt-4 pb-32 md:pb-40">
                    <div className="mx-auto max-w-4xl flex flex-col">
                      {messages.map((msg, index) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={index}
                            className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div className="group flex max-w-full">
                              <div className={`relative ${isUser ? "max-w-[80%] ml-auto" : "max-w-full"} break-words`}>
                                <div
                                  className={`px-6 py-3 text-base leading-loose break-words ${isUser
                                    ? "rounded-2xl rounded-tr-none bg-neutral-200 dark:bg-[#282A2C] text-neutral-900 dark:text-[#E3E3E3]"
                                    : "pb-10 text-neutral-900 dark:text-[#E3E3E3]"
                                    }`}
                                >
                                  {isUser ? (
                                    msg.content
                                  ) : (
                                    <div className="prose prose-slate max-w-none [&_h1]:font-bold [&_h2]:font-bold [&_h2]:text-lg [&_h3]:font-bold [&_h3]:text-base [&_h2]:mt-3 [&_h2]:mb-2 [&_ul]:mt-1 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold dark:prose-invert">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                                {!isUser && (
                                  <div className="absolute left-6 bottom-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                      type="button"
                                      onClick={() => handleFeedback("like", index, msg.content)}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-base font-bold transition hover:bg-green-200 dark:hover:bg-green-900"
                                      title="Tetszik"
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFeedback("dislike", index, msg.content)}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-base font-bold transition hover:bg-red-200 dark:hover:bg-red-900"
                                      title="Nem tetszik"
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(msg.content, index)}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white text-base font-bold transition hover:bg-neutral-300 dark:hover:bg-neutral-700"
                                      title="Másolás"
                                    >
                                      {copiedIndex === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {loading && messages[messages.length - 1]?.content === "" && (
                        <div className="mb-3 flex justify-start">
                          <div className="flex max-w-[80%] flex-col gap-1 rounded-2xl rounded-bl-none border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-6 py-3 text-xs text-neutral-900 dark:text-[#E3E3E3] shadow-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-neutral-500" />
                              <span className="text-sm">A JURA gondolkodik…</span>
                              <span className="ml-auto text-[11px] tabular-nums text-neutral-900 dark:text-[#E3E3E3]">
                                {loadingSeconds}s
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} className="h-4" />
                    </div>
                  </div>
                </section>
                <footer className="bg-gradient-to-t from-white via-white/95 to-white/80 dark:from-[#131314] dark:via-[#131314]/95 dark:to-[#131314]/80 backdrop-blur shrink-0 z-10 w-full">
                  <div className="mx-auto flex max-w-4xl flex-col gap-2 px-6 pb-4 pt-2">
                    <form
                      onSubmit={handleSubmit}
                      className="flex items-end gap-2 rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#131314] px-6 py-2.5 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] focus-within:shadow-lg dark:focus-within:shadow-[0_0_25px_rgba(16,185,129,0.1)] transition-shadow duration-300"
                    >
                      <textarea
                        ref={textareaRef}
                        id="chat-input"
                        aria-label="Írd be a kérdésed"
                        rows={1}
                        placeholder="Írd be a kérdésed... (pl. Mit ír elő a Ptk. 6:519. §?)"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="max-h-40 flex-1 resize-none overflow-y-auto border-none bg-transparent py-3 pr-3 text-base text-neutral-900 dark:text-neutral-100 outline-none placeholder:text-neutral-500 placeholder:leading-normal"
                      />
                      <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="flex items-center rounded-xl bg-neutral-200 px-5 py-3 text-base font-semibold text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-neutral-300 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Küldés
                      </button>
                    </form>
                    <p className="pb-1 text-center text-[11px] leading-relaxed text-neutral-900 dark:text-[#E3E3E3]">
                      A JURA egy kísérleti jogi AI-asszisztens. A válaszok{" "}
                      <strong>nem minősülnek jogi tanácsadásnak</strong>, és nem
                      helyettesítik ügyvéd véleményét. Részletek:{" "}
                      <Link
                        href="/jogi-nyilatkozat"
                        className="underline-offset-2 hover:text-neutral-900 dark:text-[#E3E3E3] hover:underline"
                      >
                        jogi nyilatkozat →
                      </Link>
                    </p>
                  </div>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
