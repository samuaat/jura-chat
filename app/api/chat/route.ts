// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

// Use environment variable for upstream Lambda URL. Configure in .env.local as CHAT_UPSTREAM_URL
const DEFAULT_TIMEOUT_MS = 300000; // 20s

export const runtime = "nodejs";

// CORS preflight
export function OPTIONS(req: NextRequest) {
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map(o => o.trim());
  const requestOrigin = req.headers.get("origin");
  let allowOrigin = "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length === 1 && allowedOrigins[0] !== "*") {
    allowOrigin = allowedOrigins[0];
  }
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map(o => o.trim());
  const requestOrigin = req.headers.get("origin");
  let allowOrigin = "*";
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    allowOrigin = requestOrigin;
  } else if (allowedOrigins.length === 1 && allowedOrigins[0] !== "*") {
    allowOrigin = allowedOrigins[0];
  }

  const upstreamUrl = process.env.CHAT_UPSTREAM_URL;
  if (!upstreamUrl) {
    return NextResponse.json(
      { error: "Upstream chat URL not configured on the server." },
      { status: 500, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  // Basic body parsing & validation
  let body: any;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  // Validate message
  if (!body || typeof body.message !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'message' field (must be string)." },
      { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  if (body.message.length > 10000) {
    return NextResponse.json(
      { error: "Message too long (max 10000 characters)." },
      { status: 413, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }

  // Validate history if provided
  if (body.history !== undefined) {
    if (!Array.isArray(body.history)) {
      return NextResponse.json(
        { error: "Invalid 'history' field (must be an array)." },
        { status: 400, headers: { "Access-Control-Allow-Origin": allowOrigin } }
      );
    }
    if (body.history.length > 30) {
      // Truncate long history to a safe length (server-side enforcement)
      body.history = body.history.slice(-30);
    }
  }

  // Forward to upstream with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await upstream.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      const errMsg = data?.error || `Upstream error: ${upstream.status} ${upstream.statusText}`;
      return NextResponse.json(
        { error: errMsg },
        { status: 502, headers: { "Access-Control-Allow-Origin": allowOrigin } }
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Content-Type": "application/json",
      },
    });
  } catch (err: any) {
    clearTimeout(timeout);
    console.error("API /chat error:", err);
    const message = err.name === 'AbortError' ? 'Upstream request timed out.' : 'Server error while forwarding request.';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Access-Control-Allow-Origin": allowOrigin } }
    );
  }
}
