// src/app/api/chat/route.ts
import { Agent, setGlobalDispatcher } from "undici";
import { NextRequest } from "next/server";

const UPSTREAM_URL = process.env.CHAT_UPSTREAM_URL;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_HISTORY_LIMIT = 30;
const PROXY_TIMEOUT_MS = 540_000; // Cloud Functions max ~9 perc (540s)
const HEARTBEAT_INTERVAL_MS = 25_000; // küldjünk életjelet, hogy a kapcsolat ne záródjon le

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

  // Azonnal visszatérünk egy ReadableStream-mel, hogy a Load Balancer lássa a 200 OK-t és a headereket.
  // A "thinking" idő alatt Heartbeat-et küldünk.

  const encoder = new TextEncoder();

  // --- STREAM START ---
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Helper a biztonságos íráshoz
      const safelyEnqueue = (chunk: Uint8Array) => {
        if (isClosed) return;
        try {
          controller.enqueue(chunk);
        } catch (e) {
          isClosed = true; // Ha már nem tudunk írni, tekintsük lezártnak
          console.warn("Stream enqueue failed, marking closed.", e);
        }
      };

      // 1. Azonnali "életjel"
      safelyEnqueue(encoder.encode(" "));

      // 2. Heartbeat loop (recursive timeout a biztonságért)
      const startHeartbeat = () => {
        if (isClosed) return;
        setTimeout(() => {
          if (isClosed) return;
          safelyEnqueue(encoder.encode(" "));
          startHeartbeat(); // következő ütem
        }, HEARTBEAT_INTERVAL_MS);
      };

      startHeartbeat();

      // Timeout controller a fetch-hez
      const fetchController = new AbortController();
      const fetchTimeoutId = setTimeout(() => fetchController.abort(), PROXY_TIMEOUT_MS);

      try {
        // 3. Upstream hívás
        const upstreamResponse = await fetch(UPSTREAM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          // @ts-expect-error – undici dispatcher
          dispatcher: upstreamDispatcher,
          signal: fetchController.signal,
        });

        clearTimeout(fetchTimeoutId);

        if (!upstreamResponse.ok) {
          const text = await upstreamResponse.text();
          let errText = `Upstream error: ${upstreamResponse.status}`;
          try {
            const json = JSON.parse(text);
            if (json.error) errText = json.error;
          } catch { }

          safelyEnqueue(encoder.encode(JSON.stringify({ error: errText })));
          return;
        }

        if (!upstreamResponse.body) {
          safelyEnqueue(encoder.encode(JSON.stringify({ error: "Upstream response has no body" })));
          return;
        }

        const reader = upstreamResponse.body.getReader();

        // 4. Pump logic
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (isClosed) break; // Ha a kliens közben lecsatlakozott
          safelyEnqueue(value);
        }

      } catch (err: any) {
        clearTimeout(fetchTimeoutId);
        console.error("Chat proxy stream error:", err);

        if (err.name === "AbortError") {
          safelyEnqueue(encoder.encode(JSON.stringify({ error: "Request timeout after 540s." })));
        } else {
          safelyEnqueue(encoder.encode(JSON.stringify({ error: "Internal proxy error during streaming." })));
        }
      } finally {
        isClosed = true; // Stop heartbeat
        try {
          controller.close();
        } catch (e) {
          // Ignored
        }
      }
    },
    cancel(reason) {
      isClosed = true; // Stop heartbeat immediately
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": corsOrigin,
    },
  });
}
