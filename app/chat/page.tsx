"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; id: string };

const SUGGESTIONS = [
  "Foglalod össze a csatolt anyag kulcspontjait?",
  "Mely §-ok vonatkoznak erre az esetre?",
  "Írsz egy rövid mintát (felszólító levél)?",
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatCardRef = useRef<HTMLDivElement>(null);

  // autoscroll az aljára
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // válaszgenerálás számláló
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (loading) {
      setLoadingSeconds(0);
      timer = setInterval(() => {
        setLoadingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setLoadingSeconds(0);
      if (timer) clearInterval(timer);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading]);

  // billentyűparancsok
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setHistory([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function sendMessage(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const userMsg: Msg = {
      role: "user",
      content: messageText,
      id: crypto.randomUUID(),
    };
    setHistory((h) => [...h, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();

      const reply = (data?.reply as string) ?? data?.error ?? "Ismeretlen hiba.";
      const asstMsg: Msg = {
        role: "assistant",
        content: reply,
        id: crypto.randomUUID(),
      };
      setHistory((h) => [...h, asstMsg]);
    } catch (e) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "❌ Hálózati hiba. Próbáld újra.",
          id: crypto.randomUUID(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function scrollToChat() {
    chatCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Felső sáv – bal: asszisztens, közép: JURA logó, jobb: status */}
      <header className="h-16 border-b border-slate-200 bg-slate-50 text-slate-900 flex items-center px-12">
        {/* Bal oldal: Jogi Utasításokat Rendszerező Asszisztens felirat */}
        <div className="flex-1 flex items-center">
          <span className="text-base text-slate-600">Jogi Utasításokat Rendszerező Asszisztens</span>
        </div>
        {/* Közép: JURA logó és felirat */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 text-lg font-bold">
              JU
            </div>
            <span className="text-2xl font-bold tracking-tight">JURA</span>
          </div>
        </div>
        {/* Jobb oldal: Server status, zöld kör, Béta felirat */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <span className="text-sm text-slate-600">Server status</span>
          <span className="relative inline-flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-300">Béta</span>
        </div>
      </header>

      {/* Chat középre igazítva, szélesebb, nagyobb betűmérettel, fejlécből eltávolítva a JURA jogi asszisztens és béta feliratot */}
      <main className="flex flex-1 items-center justify-center px-2 py-8">
        <section ref={chatCardRef} className="w-full max-w-3xl">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            {/* fej – eltávolítva minden feliratot */}

            {/* üzenetlista */}
            <div className="max-h-[520px] space-y-4 overflow-y-auto px-6 py-6 text-base">
              {history.length === 0 && (
                <div className="mb-2 text-xs text-slate-500">
                  Kezdésként válassz egy kérdést, vagy írd le röviden, milyen
                  dokumentummal / jogi helyzettel dolgozol.
                </div>
              )}

              {history.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <Avatar role="assistant" />
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-slate-700 shadow-inner border border-slate-100 flex items-center gap-3">
                    <div className="flex gap-1">
                      <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
                    </div>
                    <span className="text-xs text-slate-400 ml-2">{loadingSeconds}s</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />

              {/* quick suggestion chipek a kártya alján */}
              {history.length === 0 && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-[11px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600 hover:bg-slate-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* input sor */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-6">
              <div className="flex items-center gap-2">
                <textarea
                  className="flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base leading-7 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Írd le röviden, miben kérsz segítséget… (Shift+Enter = új sor)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 self-center"
                  title="Küldés (Enter)"
                >
                  {loading ? "Küldés…" : "Küldés"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* --------- UI alkomponensek --------- */

function Avatar({ role }: { role: "user" | "assistant" }) {
  const base =
    "grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full text-[11px] sm:text-xs font-semibold";
  return role === "user" ? (
    <div className={`${base} bg-blue-600 text-white shadow-lg shadow-blue-600/40`}>
      U
    </div>
  ) : (
    <div
      className={`${base} bg-slate-900 text-slate-50 border border-slate-200 shadow-sm`}
    >
      AI
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar role="assistant" />}

      <div
        className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-[1.55] shadow-sm ${
          isUser
            ? "bg-blue-600 text-white shadow-blue-900/20"
            : "bg-white text-slate-900 border border-slate-200"
        }`}
      >
        <div className="whitespace-pre-wrap">{msg.content}</div>

        {/* copy gomb csak asszisztensnél */}
        {!isUser && (
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(msg.content);
              } catch {
                // ignore
              }
            }}
            className="absolute -right-2 -top-2 rounded-full bg-white border border-slate-200 px-2 py-0.5 text-[10px] opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            title="Másolás"
          >
            másol
          </button>
        )}
      </div>

      {isUser && <Avatar role="user" />}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
