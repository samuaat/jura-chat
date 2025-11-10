// app/chat/page.tsx
"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Üdvözöllek! Én vagyok a JURA kísérleti jogi AI-asszisztens. Miben segíthetek ma?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  // Scroll automatikusan a legutolsó üzenetre
  useEffect(() => {
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

  // Footer magasság követése (input + jogi nyilatkozat)
  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new ResizeObserver(() => {
      setFooterHeight(footerRef.current?.offsetHeight || 0);
    });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessage: ChatMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages,
        }),
      });

      if (!res.ok) throw new Error("API hiba");

      const data = await res.json();
      const reply: ChatMessage = {
        role: "assistant",
        content:
          data.reply ||
          "⚠️ Nem érkezett válasz a modelltől. Kérlek, próbáld meg újra egy kicsit később.",
      };

      setMessages([...updatedMessages, reply]);
    } catch (error) {
      console.error("Chat hiba:", error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
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

      {/* CHAT CONTENT */}
      <section
        className="flex flex-1 justify-center"
        style={{ paddingBottom: `${footerHeight + 12}px` }}
      >
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
                <span className="inline-flex h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                <span>A JURA gondolkodik…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* INPUT + LEGAL NOTICE */}
      <footer
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/80 backdrop-blur"
      >
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
    </main>
  );
}
