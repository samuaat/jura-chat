// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";

// IDE a Lambda Function URL-ed
const LAMBDA_URL =
  "https://vsherf4ipngiteew5diiczbvbu0yiygv.lambda-url.us-east-1.on.aws/";

export const runtime = "nodejs";

// CORS preflight
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // { message, history }

    // Továbbküldjük a Lambdának
    const upstream = await fetch(LAMBDA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      // ha a Lambda hibát ad (pl. OpenAI error), azt kulturáltan továbbítjuk
      const errMsg =
        data?.error ||
        `Lambda hiba: ${upstream.status} ${upstream.statusText}`;
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    // Sikeres válasz: a Lambda már { reply: "..."} formában küldi
    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    console.error("API /chat error:", e);
    return NextResponse.json(
      { error: "Szerver hiba az /api/chat végponton." },
      { status: 500 },
    );
  }
}
