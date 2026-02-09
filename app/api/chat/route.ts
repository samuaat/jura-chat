// src/app/api/chat/route.ts
import { Agent, setGlobalDispatcher } from "undici";
import { NextRequest } from "next/server";

const UPSTREAM_URL = process.env.CHAT_UPSTREAM_URL;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LIMIT = 30;
const PROXY_TIMEOUT_MS = 540_000; // Cloud Functions max ~9 perc (540s)
const HEARTBEAT_INTERVAL_MS = 2000; // 2 másodpercenként küldjünk életjelet (agresszív keep-alive)

// Kapcsoljuk ki az alapértelmezett headers/body timeoutot, a saját abort controllerünk szab határt
setGlobalDispatcher(
  new Agent({
    connectTimeout: 60_000,
    headersTimeout: 0,
    bodyTimeout: 0,
  })
);

const upstreamDispatcher = new Agent({
  connectTimeout: 60_000,
  headersTimeout: 0,
  bodyTimeout: 0,
  keepAliveTimeout: 120_000,
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // mindig friss, ne cache-elje a Vercel
export const maxDuration = 540; // Cloud Functions max engedélyezett timeout másodpercben

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
  // CORS meghatározása
  const origin = req.headers.get("origin") || "*";
  const allowed = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOrigin =
    allowed.includes(origin) || allowed.includes("*") ? origin : allowed[0] || "*";

  // Upstream ellenőrzés
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

  // Request body validálás (még a stream előtt, szinkron)
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

  if (payload.history !== undefined) {
    if (!Array.isArray(payload.history)) {
      return new Response(JSON.stringify({ error: "'history' must be an array." }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
      });
    }
    payload.history = payload.history.slice(-MAX_HISTORY_LIMIT);
  }

  // --- Upstream fetch (Authorization header továbbítás) ---
  const upstreamHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authHeader = req.headers.get("Authorization");
  if (authHeader) upstreamHeaders["Authorization"] = authHeader;

  const fetchController = new AbortController();
  const fetchTimeoutId = setTimeout(() => fetchController.abort(), PROXY_TIMEOUT_MS);

  let upstreamResponse: globalThis.Response;
  try {
    upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: upstreamHeaders,
      body: JSON.stringify(payload),
      // @ts-expect-error – undici dispatcher
      dispatcher: upstreamDispatcher,
      signal: fetchController.signal,
    });
  } catch (err: any) {
    clearTimeout(fetchTimeoutId);
    console.error("Chat proxy upstream fetch error:", err);
    const errorMsg = err.name === "AbortError"
      ? "Request timeout after 540s."
      : "Internal proxy error connecting to upstream.";
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 502,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": corsOrigin },
    });
  }

  clearTimeout(fetchTimeoutId);

  // Non-200 válaszoknál közvetlenül propagáljuk az upstream státuszkódot és body-t
  if (!upstreamResponse.ok) {
    const text = await upstreamResponse.text();
    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": corsOrigin,
    };
    const retryAfter = upstreamResponse.headers.get("Retry-After");
    if (retryAfter) responseHeaders["Retry-After"] = retryAfter;

    return new Response(text, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  }

  // --- Csak 200-as válasznál indul a heartbeat + pump stream logika ---
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const safelyEnqueue = (chunk: Uint8Array) => {
        if (isClosed) return;
        try {
          controller.enqueue(chunk);
        } catch (e) {
          isClosed = true;
          console.warn("Stream enqueue failed, marking closed.", e);
        }
      };

      // 1. Azonnali null-byte életjel
      safelyEnqueue(encoder.encode("\0"));

      // 2. Heartbeat loop (recursive timeout)
      const startHeartbeat = () => {
        if (isClosed) return;
        setTimeout(() => {
          if (isClosed) return;
          safelyEnqueue(encoder.encode("\0"));
          startHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);
      };

      startHeartbeat();

      try {
        if (!upstreamResponse.body) {
          safelyEnqueue(encoder.encode(JSON.stringify({ error: "Upstream response has no body" })));
          return;
        }

        const reader = upstreamResponse.body.getReader();

        // Pump logic
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (isClosed) break;
          safelyEnqueue(value);
        }

      } catch (err: any) {
        console.error("Chat proxy stream error:", err);
        safelyEnqueue(encoder.encode(JSON.stringify({ error: "Internal proxy error during streaming." })));
      } finally {
        isClosed = true;
        try { controller.close(); } catch {}
      }
    },
    cancel() {
      isClosed = true;
    }
  });

  // Forward rate limit headers from upstream
  const rateLimitHeaders: Record<string, string> = {};
  for (const name of ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]) {
    const val = upstreamResponse.headers.get(name);
    if (val) rateLimitHeaders[name] = val;
  }

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Content-Type-Options": "nosniff",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": corsOrigin,
      ...rateLimitHeaders,
    },
  });
}
