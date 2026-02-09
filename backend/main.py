import json
import os
import asyncio
import traceback

import functions_framework
from flask import jsonify, Response, stream_with_context
from openai import OpenAI, AsyncOpenAI

from jura_prompts import (
    NORMATIVE_AGENT_PROMPT,
    CASELAW_AGENT_PROMPT,
    SYNTHESIS_AGENT_PROMPT,
)

# --- Config ---
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
MODEL = os.environ.get("MODEL", "gpt-5-mini")
SEARCH_MODEL = os.environ.get("SEARCH_MODEL", "gpt-4o")
MAX_MESSAGE_LENGTH = 10000
MAX_HISTORY_LIMIT = 10

NORMATIVE_VECTOR_STORE_ID = os.environ.get(
    "NORMATIVE_VECTOR_STORE_ID", "vs_6929a7f49bd88191b5bef2a1f0418b22"
)
CASELAW_VECTOR_STORE_ID = os.environ.get(
    "CASELAW_VECTOR_STORE_ID", "vs_692b42531d5881919d29283368b4dba5"
)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
}


# ---------------------------------------------------------------------
# MOE keresések (OpenAI Responses API + file_search)
# ---------------------------------------------------------------------

def _extract_response_text(response) -> str:
    """Válaszszöveg kinyerése a Responses API objektumból."""
    for item in response.output:
        if getattr(item, "type", None) == "message":
            text_parts = []
            for part in item.content:
                text_attr = getattr(part, "text", None)
                if isinstance(text_attr, str):
                    text_parts.append(text_attr)
                elif hasattr(text_attr, "value"):
                    text_parts.append(text_attr.value)
                elif text_attr is not None:
                    text_parts.append(str(text_attr))
            return "\n".join(text_parts).strip()
    return ""


async def _normative_search(question: str) -> str:
    """Normatív jogszabály-keresés a vector store-ból."""
    print("[MOE] Normatív keresés indítása...")
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        response = await client.responses.create(
            model=SEARCH_MODEL,
            input=[{
                "role": "system",
                "content": [{"type": "input_text", "text": (
                    NORMATIVE_AGENT_PROMPT.strip() + "\n\n"
                    "FELHASZNÁLÓI KÉRDÉS:\n" + question
                )}],
            }],
            tools=[{
                "type": "file_search",
                "vector_store_ids": [NORMATIVE_VECTOR_STORE_ID],
            }],
        )
        result = _extract_response_text(response)
        print(f"[MOE] Normatív válasz: {len(result)} karakter")
        return result or "A normatív keresés nem hozott eredményt."
    except Exception as e:
        print(f"[MOE ERROR] Normatív keresés hiba: {e}")
        return f"Hiba a normatív keresés közben: {e}"
    finally:
        await client.close()


async def _caselaw_search(question: str) -> str:
    """Bírósági gyakorlat keresés a vector store-ból."""
    print("[MOE] Bírósági keresés indítása...")
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        response = await client.responses.create(
            model=SEARCH_MODEL,
            input=[{
                "role": "system",
                "content": [{"type": "input_text", "text": (
                    CASELAW_AGENT_PROMPT.strip() + "\n\n"
                    "FELHASZNÁLÓI KÉRDÉS / TÉNYÁLLÁS:\n" + question
                )}],
            }],
            tools=[{
                "type": "file_search",
                "vector_store_ids": [CASELAW_VECTOR_STORE_ID],
            }],
        )
        result = _extract_response_text(response)
        print(f"[MOE] Bírósági válasz: {len(result)} karakter")
        return result or "A bírósági keresés nem hozott eredményt."
    except Exception as e:
        print(f"[MOE ERROR] Bírósági keresés hiba: {e}")
        return f"Hiba a bírósági keresés közben: {e}"
    finally:
        await client.close()


async def _run_parallel_searches(question: str):
    """Normatív és bírósági keresés párhuzamos futtatása."""
    return await asyncio.gather(
        _normative_search(question),
        _caselaw_search(question),
    )


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

        # --- 1. MOE: Párhuzamos keresés (normatív + bírósági) ---
        print(f"[WORKFLOW] Keresés indítása: {user_message[:80]}...")
        normative_answer, caselaw_answer = asyncio.run(
            _run_parallel_searches(user_message)
        )

        # --- 2. Szintézis prompt összeállítása ---
        synthesis_user_content = (
            "FELHASZNÁLÓI KÉRDÉS:\n"
            f"{user_message}\n\n"
            "=== 1. INPUT: NORMATÍV JOGI HÁTTÉR ===\n"
            f"{normative_answer}\n\n"
            "=== 2. INPUT: BÍRÓSÁGI GYAKORLAT ===\n"
            f"{caselaw_answer}\n\n"
            "Készítsd el a végső választ a fenti inputok alapján, "
            "a System Prompt utasításai szerint."
        )

        synthesis_messages = [
            {"role": "system", "content": SYNTHESIS_AGENT_PROMPT},
        ]

        # Beszélgetési előzmények hozzáadása
        if history and isinstance(history, list):
            for msg in history[-MAX_HISTORY_LIMIT:]:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role in ("user", "assistant") and content:
                    synthesis_messages.append({"role": role, "content": content})

        synthesis_messages.append({"role": "user", "content": synthesis_user_content})

        # --- 3. Streaming szintézis ---
        print("[WORKFLOW] Streaming szintézis indítása...")
        client = OpenAI(api_key=OPENAI_API_KEY)

        def generate():
            try:
                stream = client.chat.completions.create(
                    model=MODEL,
                    messages=synthesis_messages,
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta.content if chunk.choices[0].delta else None
                    if delta:
                        yield delta

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
