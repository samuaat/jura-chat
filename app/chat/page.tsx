"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  ArrowUp,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  PanelLeft,
} from "lucide-react";

import { ChatSidebar } from "@/components/chat-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SmartCitation } from "@/components/smart-citation";
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
  "Mit tehetek, ha a munkáltatóm azonnali hatállyal felmondott?",
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

  // Feedback tracking (which messages have been liked/disliked)
  const [feedbackGiven, setFeedbackGiven] = useState<
    Record<number, "like" | "dislike">
  >({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const loadingTimerRef = useRef<number | null>(null);
  const requestStartRef = useRef<number | null>(null);

  // Init anonymous user ID
  useEffect(() => {
    setAnonymousUserId(getAnonymousUserId());
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------
  // Firestore persistence
  // ---------------------------------------------------------------
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

  // ---------------------------------------------------------------
  // Feedback (like/dislike)
  // ---------------------------------------------------------------
  async function handleFeedback(
    type: "like" | "dislike",
    msgIndex: number,
    assistantContent: string
  ) {
    // Find the user query that preceded this assistant message
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

  // ---------------------------------------------------------------
  // Send message (streaming logic preserved from original)
  // ---------------------------------------------------------------
  async function sendMessage(overrideText?: string) {
    const raw = overrideText ?? input;
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const assistantPlaceholder: ChatMessage = {
      role: "assistant",
      content: "",
    };
    const updatedMessages = [...messages, userMessage, assistantPlaceholder];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Start response timer
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

      // Production: direct Cloud Run URL (Firebase Hosting buffers streaming)
      // Dev: local Next.js proxy
      const API_URL =
        process.env.NODE_ENV === "production"
          ? "https://ssrjurav2-74elkdduqa-ew.a.run.app/api/chat"
          : "/api/chat";

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
        } catch {
          // not JSON
        }
        throw new Error(backendError);
      }

      // Stream reading
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

      // STREAM_ERROR marker handling
      const errorMatch = content.match(
        /\[STREAM_ERROR\]([\s\S]*?)\[\/STREAM_ERROR\]/
      );
      if (errorMatch) {
        const cleanContent = content
          .replace(/\[STREAM_ERROR\][\s\S]*?\[\/STREAM_ERROR\]/, "")
          .trim();
        content =
          cleanContent || `Hiba a válasz közben: ${errorMatch[1]}`;
        flushToUI(content);
      }

      // Save to Firestore after successful response
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

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CHAT_JSON_LD) }}
      />

      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        {/* Sidebar */}
        <ChatSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(false)}
          currentChatId={currentChatId}
          anonymousUserId={anonymousUserId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-[var(--background)] px-4 py-3">
            <div className="flex items-center gap-3">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition"
                  aria-label="Oldalsáv megnyitása"
                >
                  <PanelLeft className="h-5 w-5" />
                </button>
              )}
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/images/jura-logo.png"
                  alt="JURA logó"
                  className="h-8 w-auto"
                />
              </Link>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                kísérleti
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Content */}
          {showEmptyState ? (
            /* ---------- EMPTY STATE ---------- */
            <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4">
              <div className="flex w-full max-w-2xl flex-col items-center text-center">
                <img
                  src="/images/jura-logo.png"
                  alt="JURA"
                  className="mb-6 h-12 w-auto"
                />
                <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
                  Miben segíthetek?
                </h1>
                <p className="mb-8 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
                  Kérdezz a magyar jogról – például munkajogról,
                  fogyasztóvédelemről, szerződésekről, bérletről vagy öröklésről.
                </p>

                {/* Suggestion pills */}
                <div className="mb-8 flex w-full flex-wrap justify-center gap-2">
                  {suggestions.map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => handleSuggestionClick(tip)}
                      className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-left text-sm text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {tip}
                    </button>
                  ))}
                </div>

                {/* Input in empty state */}
                <form
                  onSubmit={handleSubmit}
                  className="flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <textarea
                    ref={textareaRef}
                    id="chat-input-empty"
                    aria-label="Írd be a kérdésed"
                    rows={1}
                    placeholder="Írd be a kérdésed..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent py-3 text-base text-[var(--foreground)] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </button>
                </form>

                <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  A JURA egy kísérleti jogi AI-asszisztens. A válaszok{" "}
                  <strong>nem minősülnek jogi tanácsadásnak</strong>.{" "}
                  <Link
                    href="/jogi-nyilatkozat"
                    className="underline-offset-2 hover:underline"
                  >
                    Jogi nyilatkozat
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            /* ---------- CHAT VIEW ---------- */
            <>
              <ScrollArea className="flex-1">
                <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-32">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    const isAssistant = !isUser;

                    return (
                      <div key={index} className="mb-4">
                        {isUser ? (
                          /* User message */
                          <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-neutral-200 px-4 py-3 text-sm leading-relaxed text-neutral-900 dark:bg-[#282A2C] dark:text-[#E3E3E3]">
                              <span className="whitespace-pre-line">
                                {msg.content}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Assistant message */
                          <div className="group">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                                J
                              </div>
                              <div className="min-w-0 flex-1">
                                <div
                                  className={
                                    "prose prose-sm max-w-none text-[var(--foreground)] " +
                                    "prose-headings:text-[var(--foreground)] " +
                                    "prose-strong:text-[var(--foreground)] " +
                                    "prose-a:text-blue-600 dark:prose-a:text-blue-400 " +
                                    "[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold " +
                                    "[&_ul]:mt-1 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 " +
                                    "[&_ol]:mt-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
                                    "[&_strong]:font-semibold " +
                                    "[&_p]:text-[var(--foreground)] " +
                                    "[&_li]:text-[var(--foreground)]"
                                  }
                                >
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ children }) => (
                                        <p>
                                          {Array.isArray(children)
                                            ? children.map((child, i) =>
                                                typeof child === "string" ? (
                                                  <SmartCitation key={i}>
                                                    {child}
                                                  </SmartCitation>
                                                ) : (
                                                  child
                                                )
                                              )
                                            : typeof children === "string" ? (
                                                <SmartCitation>
                                                  {children}
                                                </SmartCitation>
                                              ) : (
                                                children
                                              )}
                                        </p>
                                      ),
                                      li: ({ children }) => (
                                        <li>
                                          {Array.isArray(children)
                                            ? children.map((child, i) =>
                                                typeof child === "string" ? (
                                                  <SmartCitation key={i}>
                                                    {child}
                                                  </SmartCitation>
                                                ) : (
                                                  child
                                                )
                                              )
                                            : typeof children === "string" ? (
                                                <SmartCitation>
                                                  {children}
                                                </SmartCitation>
                                              ) : (
                                                children
                                              )}
                                        </li>
                                      ),
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>

                                {/* Action buttons (copy, like, dislike) */}
                                {msg.content && !loading && (
                                  <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                    {/* Copy */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCopy(msg.content, index)
                                      }
                                      className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                                      aria-label="Másolás"
                                    >
                                      {copiedIndex === index ? (
                                        <Check className="h-3.5 w-3.5" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    {/* Like */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFeedback(
                                          "like",
                                          index,
                                          msg.content
                                        )
                                      }
                                      disabled={
                                        feedbackGiven[index] !== undefined
                                      }
                                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                                        feedbackGiven[index] === "like"
                                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                                          : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                                      } disabled:cursor-default`}
                                      aria-label="Tetszik"
                                    >
                                      <ThumbsUp className="h-3.5 w-3.5" />
                                    </button>
                                    {/* Dislike */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFeedback(
                                          "dislike",
                                          index,
                                          msg.content
                                        )
                                      }
                                      disabled={
                                        feedbackGiven[index] !== undefined
                                      }
                                      className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                                        feedbackGiven[index] === "dislike"
                                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                          : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                                      } disabled:cursor-default`}
                                      aria-label="Nem tetszik"
                                    >
                                      <ThumbsDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Loading indicator */}
                  {loading &&
                    messages[messages.length - 1]?.content === "" && (
                      <div className="mb-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                            J
                          </div>
                          <div className="flex flex-col gap-1 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-neutral-400 dark:bg-neutral-500" />
                              <span className="text-neutral-600 dark:text-neutral-400">
                                A JURA gondolkodik…
                              </span>
                              <span className="ml-2 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
                                {loadingSeconds}s
                              </span>
                            </div>
                            <div className="flex items-center text-[11px] text-neutral-400 dark:text-neutral-500">
                              {avgSeconds !== null ? (
                                <span>
                                  Korábbi átlag: ~{avgSeconds} mp
                                </span>
                              ) : (
                                <span>Válaszidő jellemzően 1–2 perc.</span>
                              )}
                              <div className="ml-3 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 dark:bg-neutral-600 [animation-delay:0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-300 dark:bg-neutral-600 [animation-delay:0.3s]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input footer */}
              <div className="border-t border-neutral-200 bg-[var(--background)] px-4 pb-4 pt-2 dark:border-neutral-800">
                <div className="mx-auto w-full max-w-3xl">
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2 rounded-2xl border border-neutral-300 bg-white px-4 py-2.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                  >
                    <textarea
                      ref={textareaRef}
                      id="chat-input"
                      aria-label="Írd be a kérdésed"
                      rows={1}
                      placeholder="Írd be a kérdésed..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent py-3 text-base text-[var(--foreground)] outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </form>
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                    A válaszok{" "}
                    <strong>nem minősülnek jogi tanácsadásnak</strong>.{" "}
                    <Link
                      href="/jogi-nyilatkozat"
                      className="underline-offset-2 hover:underline"
                    >
                      Jogi nyilatkozat
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
