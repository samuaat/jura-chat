// src/app/api/chat/route.ts

import { NextRequest } from "next/server";

const UPSTREAM_URL = process.env.CHAT_UPSTREAM_URL;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LIMIT = 30;
const PROXY_TIMEOUT_MS = 500_000; // ~8,3 perc – a Vercel/Lambda még bírja

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // mindig friss, ne cache-elje a Vercel

// CORS preflight
export function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "*";
  const allowed = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed.includes(origin) || allowed.includes("*") ? origin : allowed[0] || "*";

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin",
    },
  });
}

export async function POST(req: NextRequest) {
  // CORS meghatározása (ugyanaz, mint az OPTIONS-nél)
  const origin = req.headers.get("origin") || "*";
  const allowed = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOrigin =
    allowed.includes(origin) || allowed.includes("*") ? origin : allowed[0] || "*";

  // Upstream ellenőrzés
  //500-as hiba esetén
  if (!UPSTREAM_URL) {
    return new Response(
      JSON.stringify({ error: "Upstream chat URL not configured on the server." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
        },
      }
    );
  }

  // Body beolvasása + validáció
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
    });
  }

  if (!payload || typeof payload.message !== "string") {
    return new Response(JSON.stringify({ error: "Missing or invalid 'message' field (must be string)." }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
    });
  }

  if (payload.message.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters).` }), {
      status: 413,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
    });
  }

  // History validálása + korlátozása
  if (payload.history !== undefined) {
    if (!Array.isArray(payload.history)) {
      return new Response(JSON.stringify({ error: "'history' must be an array." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }
    // Legutóbbi 30 üzenet megtartása
    payload.history = payload.history.slice(-MAX_HISTORY_LIMIT);
  }

  // Timeout controller (max ~8 perc)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ha a Lambda-nak is kell Authorization vagy API-key, ide tedd
        // "Authorization": `Bearer ${process.env.LAMBDA_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Ha a Lambda hibát dob (pl. 500, 429, stb.)
    if (!upstreamResponse.ok) {
      const text = await upstreamResponse.text();
      let errorMessage = `Upstream error: ${upstreamResponse.status}`;
      try {
        const json = JSON.parse(text);
        errorMessage = json.error || errorMessage;
      } catch {}
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": corsOrigin,
        },
      });
    }

    // FONTOS RÉSZ: azonnal streameljük a választ – a header-ek 1-2 ms alatt kimennek!
    const stream = upstreamResponse.body;

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": corsOrigin,
        // Ha SSE-t akarsz a frontendnek, itt állítsd át: "text/event-stream"
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timeout after 500s." }), {
        status: 504,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }

    console.error("Chat proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal proxy error." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
    });
  }
}