// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const HISTORY_LIMIT = 10;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Gyakori/kardinális jogi témák – javasolt kérdések
  const suggestions = [
    "Mit tehetek, ha a munkáltatóm azonnali hatállyal felmondott?",
    "Milyen jogaid vannak online vásárlás elállásakor 14 napon belül?",
    "Mikor követelhetek kártérítést szerződésszegés miatt?",
    "Milyen jogai vannak a bérlőnek lakásbérleti szerződésnél?",
    "Hogyan oszlik meg a hagyaték a törvényes öröklés szabályai szerint?",
    "Mik a személyiségi jogi jogsértés feltételei a Ptk. szerint?",
  ];

  // Scroll automatikusan a legutolsó üzenetre
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

  async function sendMessage(overrideText?: string) {
    const raw = overrideText ?? input;
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    const newMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const limitedHistory = updatedMessages.slice(-HISTORY_LIMIT);

      const res = await fetch("/api/chat", {
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
          // ha nem JSON, marad a default
        }
        throw new Error(backendError);
      }

      const data = await res.json();
      const reply: ChatMessage = {
        role: "assistant",
        content:
          data.reply ||
          "⚠️ Nem érkezett válasz a modelltől. Kérlek, próbáld meg újra egy kicsit később.",
      };

      setMessages([...updatedMessages, reply]);
    } catch (error: any) {
      console.error("Chat hiba:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            error?.message ||
            "⚠️ Hiba történt a válasz feldolgozása közben. Kérlek, próbáld meg újra később.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function handleSuggestionClick(text: string) {
    // azonnal küldjük a javasolt kérdést
    sendMessage(text);
  }

  const showEmptyState = messages.length === 0;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              JURA Chat
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              kísérleti
            </span>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            ← Vissza a főoldalra
          </Link>
        </div>
      </header>

      {/* EMPTY STATE – ChatGPT-szerű kezdőképernyő */}
      {showEmptyState ? (
        <section className="flex flex-1 flex-col items-center justify-start px-4 pb-4 pt-10 lg:justify-center lg:pt-0">
          <div className="flex w-full max-w-2xl flex-col items-center text-center">
            <h1 className="mb-4 text-2xl sm:text-3xl font-semibold text-slate-900">
              Üdvözöllek a JURA-ban!
            </h1>
            <p className="mb-8 max-w-md text-sm text-slate-500">
              Kérdezz a magyar jogról – például munkajogról, fogyasztóvédelemről,
              szerződésekről, bérletről vagy öröklésről. A válaszok nem
              minősülnek jogi tanácsadásnak.
            </p>

            {/* Javasolt kérdések – „szétszórt” grid layout */}
            <div className="mb-6 grid w-full gap-3 sm:grid-cols-2">
              {suggestions.map((tip) => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => handleSuggestionClick(tip)}
                  className="rounded-3xl border border-slate-300 bg-white px-4 py-2 text-left text-xs sm:text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {tip}
                </button>
              ))}
            </div>

            {/* Középre helyezett input mező */}
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
            >
              <textarea
                ref={textareaRef}
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
                className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent pb-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Küldés
              </button>
            </form>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
              A JURA egy kísérleti jogi AI-asszisztens. A válaszok{" "}
              <strong>nem minősülnek jogi tanácsadásnak</strong>, és nem
              helyettesítik ügyvéd véleményét. Részletek:{" "}
              <Link
                href="/jogi-nyilatkozat"
                className="underline-offset-2 hover:text-slate-700 hover:underline"
              >
                jogi nyilatkozat →
              </Link>
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* CHAT CONTENT – klasszikus chat nézet */}
          <section className="flex flex-1 justify-center overflow-y-auto pb-4 md:pb-32">
            <div className="flex w-full max-w-3xl flex-col px-4 pt-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex max-w-full gap-3">
                    {msg.role === "assistant" && (
                      <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-slate-900 text-center text-xs font-semibold leading-7 text-white">
                        J
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] whitespace-pre-line break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "rounded-br-none bg-slate-900 text-slate-50"
                          : "rounded-bl-none border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 text-center text-xs font-semibold leading-7 text-slate-700">
                        Én
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mb-3 flex justify-start">
                  <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                    <span>A JURA gondolkodik…</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </section>

          {/* INPUT + LEGAL NOTICE – mobilon nem fixed, desktopon fixed */}
          <footer className="border-t border-slate-200 bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/80 backdrop-blur md:fixed md:inset-x-0 md:bottom-0">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-4 pt-2">
              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
              >
                <textarea
                  ref={textareaRef}
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
                  className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent pb-1 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex h-9 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Küldés
                </button>
              </form>

              <p className="pb-1 text-center text-[11px] leading-relaxed text-slate-500">
                A JURA egy kísérleti jogi AI-asszisztens. A válaszok{" "}
                <strong>nem minősülnek jogi tanácsadásnak</strong>, és nem
                helyettesítik ügyvéd véleményét. Részletek:{" "}
                <Link
                  href="/jogi-nyilatkozat"
                  className="underline-offset-2 hover:text-slate-700 hover:underline"
                >
                  jogi nyilatkozat →
                </Link>
              </p>
            </div>
          </footer>
        </>
      )}
    </main>
  );
}
