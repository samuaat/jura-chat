import os
import traceback

import functions_framework
from flask import jsonify, Response, stream_with_context
from openai import OpenAI

from jura_prompts import SYSTEM_PROMPT

# --- Config ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
MODEL = os.environ.get("MODEL", "gpt-5.2")
MAX_MESSAGE_LENGTH = 10000
MAX_HISTORY_LIMIT = 10

NORMATIVE_VECTOR_STORE_ID = os.environ.get(
    "NORMATIVE_VECTOR_STORE_ID", "vs_698a0859caa081918c62fcf51a98bffa"
)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
}


# ---------------------------------------------------------------------
# Fő belépési pont
# ---------------------------------------------------------------------

@functions_framework.http
def chat(request):
    """Fő HTTP belépési pont a Cloud Function-höz."""

    # CORS preflight
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "POST":
        return (jsonify({"error": "Method not allowed"}), 405, CORS_HEADERS)

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

        # --- Input üzenetek összeállítása ---
        input_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]

        # Beszélgetési előzmények
        if history and isinstance(history, list):
            for msg in history[-MAX_HISTORY_LIMIT:]:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    input_messages.append({"role": role, "content": content})

        input_messages.append({"role": "user", "content": user_message})

        # --- Streaming Responses API hívás (file_search + válasz egyben) ---
        print(f"[WORKFLOW] Streaming válasz indítása: {user_message[:80]}...")
        client = OpenAI(api_key=OPENAI_API_KEY)

        def generate():
            try:
                stream = client.responses.create(
                    model=MODEL,
                    input=input_messages,
                    tools=[{
                        "type": "file_search",
                        "vector_store_ids": [NORMATIVE_VECTOR_STORE_ID],
                        "max_num_results": 5,
                        "ranking_options": {
                            "ranker": "auto",
                            "score_threshold": 0.3,
                        },
                    }],
                    stream=True,
                    reasoning={"effort": "low"},
                )
                for event in stream:
                    if event.type == "response.output_text.delta":
                        yield event.delta

            except Exception as e:
                error_msg = str(e)
                print(f"[STREAM ERROR] {error_msg}")
                print(traceback.format_exc())
                yield f"[STREAM_ERROR]{error_msg}[/STREAM_ERROR]"

        streaming_headers = {
            **CORS_HEADERS,
            "X-Content-Type-Options": "nosniff",
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache, no-transform",
            "Transfer-Encoding": "chunked",
        }

        return Response(
            stream_with_context(generate()),
            mimetype="text/event-stream",
            headers=streaming_headers,
        )

    except Exception as e:
        error_msg = str(e)
        print(f"[CRITICAL ERROR] {error_msg}")
        print(traceback.format_exc())

        return (
            jsonify({"error": f"Hiba történt a feldolgozás során: {error_msg}"}),
            500,
            CORS_HEADERS,
        )
