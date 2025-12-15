"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  isPartOf: {
    "@id": `${CANONICAL}/#website`,
  },
  about: {
    "@id": `${CANONICAL}/#jura`,
  },
  description:
    "Interaktív jogi információs chatfelület, ahol a JURA segít a magyar jogszabályok és jogi fogalmak jobb megértésében. A válaszok nem minősülnek jogi tanácsadásnak.",
} as const;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Válaszidő visszajelzéshez
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [totalResponseMs, setTotalResponseMs] = useState(0);
  const [responseCount, setResponseCount] = useState(0);

  // Másolás visszajelzéséhez
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const loadingTimerRef = useRef<number | null>(null);
  const requestStartRef = useRef<number | null>(null);

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

  // Interval takarítás unmountkor
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearInterval(loadingTimerRef.current);
      }
    };
  }, []);

  async function sendMessage(overrideText?: string) {
    const raw = overrideText ?? input;
    const trimmed = raw.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };
    const updatedMessages = [...messages, userMessage, assistantPlaceholder];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Válaszidő mérés indítása
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

      // FIX: Közvetlen Cloud Run URL (.run.app), ami stabilabb mint a cloudfunctions.net
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
          // ha nem JSON, marad a default
        }
        throw new Error(backendError);
      }

      // Stream olvasása – folyamatosan frissítjük az utolsó assistant üzenetet
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      if (!reader) {
        const text = await res.text();
        acc = text;
      } else {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, content: acc };
            }
            return next;
          });
        }
      }

      // Végső finomhangolás: ha JSON-t kaptunk, próbáljuk parse-olni
      const finalText = acc.trim();
      let content = finalText;
      try {
        const parsed = JSON.parse(finalText);
        if (typeof parsed?.reply === "string") content = parsed.reply;
        else if (typeof parsed?.content === "string") content = parsed.content;
      } catch {
        // ha nem JSON, hagyjuk szövegként
      }

      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          next[next.length - 1] = {
            ...last,
            content:
              content ||
              "⚠️ Nem érkezett válasz a modelltől. Kérlek, próbáld meg újra egy kicsit később.",
          };
        }
        return next;
      });
    } catch (error: any) {
      console.error("Chat hiba:", error);
      setMessages((prev) => {
        // ha már volt placeholder, azt írjuk felül, különben új assistant üzi
        const next = [...prev];
        const last = next[next.length - 1];
        const errorContent =
          error?.message ||
          "⚠️ Hiba történt a válasz feldolgozása közben. Kérlek, próbáld meg újra később.";
        if (last && last.role === "assistant" && last.content === "") {
          next[next.length - 1] = { role: "assistant", content: errorContent };
          return next;
        }
        return [...next, { role: "assistant", content: errorContent }];
      });
    } finally {
      setLoading(false);
      // Timer leállítása + stat frissítés
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
    // azonnal küldjük a javasolt kérdést
    sendMessage(text);
  }

  const showEmptyState = messages.length === 0;
  const avgSeconds =
    responseCount > 0
      ? Math.round(totalResponseMs / responseCount / 1000)
      : null;

  // Legutóbbi asszisztens üzenet indexe – erre tesszük a copy gombot
  const lastAssistantIndex = (() => {
    let idx = -1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "assistant") idx = i;
    }
    return idx;
  })();

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

  // --- ÚJ KOMPONENS: Figyelmeztető üzenet ---
  const UpgradeAlert = () => (
    <div className="mb-6 w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
      <div className="flex gap-3">
        <span className="text-lg">🚧</span>
        <div>
          <p className="font-semibold">Technikai tájékoztatás</p>
          <p className="mt-1 leading-relaxed text-amber-800">
            A <strong>bírósági határozatkereső</strong> modul jelenleg átfogó
            technikai frissítésen (upgrade) esik át. A funkció végleges,
            stabil verziója pár napon belül elérhetővé válik. Köszönjük a
            türelmedet!
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(CHAT_JSON_LD) }}
      />
      <main className="flex min-h-screen flex-col bg-slate-50">
        {/* HEADER */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/images/jura-logo.png"
                  alt="JURA logó"
                  className="h-8 w-auto"
                />
              </Link>
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
              <h1 className="mb-4 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Üdvözöllek a JURA-ban!
              </h1>

              {/* ITT JELENIK MEG AZ ALERTE (Üres állapotban) */}
              <div className="w-full text-left">
                <UpgradeAlert />
              </div>

              <p className="mb-8 max-w-md text-sm text-slate-500">
                Kérdezz a magyar jogról – például munkajogról,
                fogyasztóvédelemről, szerződésekről, bérletről vagy öröklésről.
                A válaszok nem minősülnek jogi tanácsadásnak.
              </p>

              {/* Javasolt kérdések – „gondolatbuborék” layout */}
              <div className="mb-6 flex w-full flex-col gap-3">
                {suggestions.map((tip, index) => {
                  const alignment =
                    index % 2 === 0 ? "sm:self-start" : "sm:self-end";
                  const width =
                    index % 3 === 0
                      ? "sm:max-w-xs"
                      : index % 3 === 1
                        ? "sm:max-w-sm"
                        : "sm:max-w-md";

                  return (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => handleSuggestionClick(tip)}
                      className={`w-full rounded-3xl border border-slate-300 bg-white px-4 py-2 text-left text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 sm:w-auto sm:text-sm ${alignment} ${width}`}
                    >
                      {tip}
                    </button>
                  );
                })}
              </div>

              {/* Középre helyezett input mező */}
              <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm"
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
                  className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 placeholder:leading-normal"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="flex items-center rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
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
            <section className="flex flex-1 justify-center overflow-y-auto pb-32 md:pb-40">
              <div className="flex w-full max-w-3xl flex-col px-4 pt-4">

                {/* ITT JELENIK MEG AZ ALERTE (Chat közben is) */}
                <UpgradeAlert />

                {messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  const isLastAssistant =
                    !isUser && index === lastAssistantIndex;

                  return (
                    <div
                      key={index}
                      className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div className="group flex max-w-full gap-3">
                        {!isUser && (
                          <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-slate-900 text-center text-xs font-semibold leading-7 text-white">
                            J
                          </div>
                        )}
                        <div className="relative max-w-[80%]">
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser
                              ? "whitespace-pre-line rounded-br-none bg-slate-900 text-slate-50"
                              : "rounded-bl-none border border-slate-200 bg-white text-slate-900"
                              }`}
                          >
                            {isUser ? (
                              msg.content
                            ) : (
                              <div
                                className={
                                  "prose prose-slate prose-sm max-w-none " +
                                  // Headingek (## 1., ## 2., …) finom hangolása
                                  "[&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold " +
                                  // Felsorolások
                                  "[&_ul]:mt-1 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 " +
                                  "[&_ol]:mt-1 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
                                  // Félkövér kiemelések
                                  "[&_strong]:font-semibold"
                                }
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Másolás gomb – csak a legutóbbi asszisztens válasznál */}
                          {isLastAssistant && (
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.content, index)}
                              className="absolute -top-2 right-3 inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[11px] font-medium text-slate-500 shadow-sm opacity-0 transition group-hover:opacity-100 hover:bg-slate-50"
                            >
                              {copiedIndex === index ? "Másolva" : "Másolás"}
                            </button>
                          )}
                        </div>
                        {isUser && (
                          <div className="mt-1 h-7 w-7 flex-shrink-0 rounded-full bg-slate-200 text-center text-xs font-semibold leading-7 text-slate-700">
                            Én
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="mb-3 flex justify-start">
                    <div className="flex max-w-[80%] flex-col gap-1 rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                        <span className="text-sm">A JURA gondolkodik…</span>
                        <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                          {loadingSeconds}s
                        </span>
                      </div>
                      <div className="flex items-center text-[11px] text-slate-400">
                        {avgSeconds !== null ? (
                          <span className="flex-1">
                            Korábbi átlag ebben a beszélgetésben: ~{avgSeconds}{" "}
                            mp
                          </span>
                        ) : (
                          <span className="flex-1">
                            Válaszidő jellemzően 1–2 perc.
                          </span>
                        )}
                        <div className="ml-3 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0.3s]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </section>

            {/* INPUT + LEGAL NOTICE – mobilon nem fixed, desktopon fixed */}
            <footer className="bg-gradient-to-t from-slate-50 via-slate-50/95 to-slate-50/80 backdrop-blur md:fixed md:inset-x-0 md:bottom-0">
              <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 pb-4 pt-2">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 shadow-sm"
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
                    className="max-h-40 flex-1 resize-none overflow-hidden border-none bg-transparent py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 placeholder:leading-normal"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex items-center rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
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
    </>
  );
}
