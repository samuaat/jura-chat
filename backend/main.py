import json
import os
import traceback

import functions_framework
from flask import jsonify, Response, stream_with_context
from openai import OpenAI

# --- Config ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
MODEL = os.environ.get("MODEL", "gpt-4o")
MAX_MESSAGE_LENGTH = 10000
MAX_HISTORY_LIMIT = 10

SYSTEM_PROMPT = """Te a JURA jogi asszisztens vagy. Magyar felhasználóknak segítesz jogi kérdésekben az alábbi területeken:

- Munkajog (felmondás, munkaidő, szabadság, munkaszerződés)
- Polgári jog (szerződések, kártérítés, tulajdonjog, kötelmi jog)
- Családjog (házasság, válás, gyermekelhelyezés, tartásdíj)
- Öröklési jog (végrendelet, törvényes öröklés, hagyatéki eljárás)
- Fogyasztóvédelem (elállás, szavatosság, jótállás, online vásárlás)
- Lakásbérlet (bérleti szerződés, felmondás, kaució, közös költség)
- Büntetőjog alapok (feljelentés, eljárás menete, jogok)
- Személyiségi jogok (adatvédelem, jó hírnév, képmáshoz való jog)

Szabályok:
- Mindig magyarul válaszolj.
- Válaszolj szakmailag megalapozottan, de közérthetően.
- Hivatkozz a vonatkozó jogszabályokra (pl. Ptk., Mt., Btk.) ahol releváns.
- Használj konkrét paragrafus-hivatkozásokat ahol lehetséges.
- Hangsúlyozd, hogy a válaszok tájékoztató jellegűek és nem minősülnek jogi tanácsadásnak.
- Ha a kérdés túl specifikus vagy egyedi eset, javasolj ügyvédi konzultációt.
"""

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
}


@functions_framework.http
def chat(request):
    """Fő HTTP belépési pont a Cloud Function-höz."""

    # CORS preflight
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "POST":
        return (jsonify({"error": "Method not allowed"}), 405, CORS_HEADERS)

    # API key check
    if not OPENAI_API_KEY:
        return (
            jsonify({"error": "OpenAI API key not configured."}),
            500,
            CORS_HEADERS,
        )

    try:
        body = request.get_json(silent=True) or {}
        user_message = (body.get("message") or "").strip()
        history = body.get("history") or []

        if not user_message:
            return (jsonify({"error": "Hiányzik az üzenet."}), 400, CORS_HEADERS)

        if len(user_message) > MAX_MESSAGE_LENGTH:
            return (
                jsonify({"error": f"Az üzenet túl hosszú (max {MAX_MESSAGE_LENGTH} karakter)."}),
                413,
                CORS_HEADERS,
            )

        # Build messages for Chat Completions API
        input_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if history and isinstance(history, list):
            for msg in history[-MAX_HISTORY_LIMIT:]:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    input_messages.append({"role": role, "content": content})

        input_messages.append({"role": "user", "content": user_message})

        # Streaming LLM response
        client = OpenAI(api_key=OPENAI_API_KEY)

        def generate():
            full_text = ""
            try:
                stream = client.chat.completions.create(
                    model=MODEL,
                    messages=input_messages,
                    stream=True,
                )

                for chunk in stream:
                    delta = chunk.choices[0].delta.content if chunk.choices[0].delta else None
                    if delta:
                        full_text += delta
                        yield delta

            except Exception as e:
                error_msg = str(e)
                trace_msg = traceback.format_exc()
                print(f"[STREAM ERROR] {error_msg}")
                print(trace_msg)
                yield f"[STREAM_ERROR]{error_msg}[/STREAM_ERROR]"

        streaming_headers = {
            **CORS_HEADERS,
            "X-Content-Type-Options": "nosniff",
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache, no-transform",
            "Transfer-Encoding": "chunked",
        }

        resp = Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers=streaming_headers,
        )
        return resp

    except Exception as e:
        error_msg = str(e)
        trace_msg = traceback.format_exc()
        print(f"[CRITICAL ERROR] {error_msg}")
        print(trace_msg)

        return (
            jsonify({"error": f"Hiba történt a feldolgozás során: {error_msg}"}),
            500,
            CORS_HEADERS,
        )
