#!/usr/bin/env python3
# app_btk.py — Btk PDF -> JSON (OpenAI Responses API + JSON Schema, stabil "prompt id" verzió)

from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

from openai import OpenAI
from jsonschema import validate as jsonschema_validate, ValidationError
from pypdf import PdfReader

# ---------------- A STABIL SÉMA (Btk: szakaszok + footnote) ----------------
BTK_SCHEMA = {
    "type": "object",
    "properties": {
        "joganyag_forrasa": {
            "type": "string",
            "const": "2012. évi C. törvény a Büntető Törvénykönyvről",
            "description": "A joganyag azonosítója és címe."
        },
        "szakaszok": {
            "type": "array",
            "description": "Az összes szakasz listája egyszerű formában.",
            "minItems": 1,
            "items": {"$ref": "#/$defs/szakasz"}
        }
    },
    "required": ["joganyag_forrasa", "szakaszok"],
    "additionalProperties": False,
    "$defs": {
        "szakasz": {
            "type": "object",
            "properties": {
                "jel": {
                    "type": "string",
                    "pattern": "^\\d+[A-Za-z\\/\\-]*\\. §$",
                    "description": "Szakasz jelölése, pl. '1. §', '459. §', '176/A. §'."
                },
                "cim": {
                    "type": "string",
                    "description": "A szakasz rövid címe (ha van)."
                },
                "tartalom": {
                    "type": "string",
                    "description": "A szakasz teljes szövege egy mezőben (bekezdésekkel együtt)."
                },
                "footnote": {
                    "type": "array",
                    "description": "A szakaszhoz tartozó lábjegyzetek teljes szövege (sorrendben).",
                    "items": {"type": "string"}
                }
            },
            "required": ["jel", "cim", "tartalom", "footnote"],
            "additionalProperties": False
        }
    }
}

# ---------------- CLI ----------------
def parse_args():
    ap = argparse.ArgumentParser(description="Btk PDF → JSON (Responses API, stabil 'prompt id' verzió)")
    ap.add_argument("--pdf", required=True, type=Path, help="Bemeneti Btk PDF")
    ap.add_argument("--out", required=True, type=Path, help="Kimeneti JSON fájl")
    ap.add_argument("--pages", default=None, help="Oldaltartomány pl. '22-25'. Ha nincs, teljes dokumentum.")
    ap.add_argument("--model", default="gpt-5", help="OpenAI modell, pl. gpt-5")
    ap.add_argument("--api-key", default=None, help="OPENAI_API_KEY felülírás (opcionális)")
    ap.add_argument("--chunk-chars", type=int, default=30000, help="Egy input_text max. hossza (karakter).")
    # stabil prompt hivatkozásai
    ap.add_argument("--prompt-id", default="pmpt_690db3162ae8819796ec0f8d5a4e3e960231da3975e16c0d",
                    help="Előre elmentett prompt id (OpenAI Prompt objektum).")
    ap.add_argument("--prompt-version", default="5", help="Prompt verziószám.")
    return ap.parse_args()

# ---------------- PDF → szöveg ----------------
def extract_text_from_pdf(pdf_path: Path, pages: str | None) -> str:
    reader = PdfReader(str(pdf_path))
    total = len(reader.pages)
    start_idx, end_idx = 0, total - 1
    if pages:
        m = re.match(r"^\s*(\d+)\s*-\s*(\d+)\s*$", pages)
        if not m:
            print("⚠️  --pages formátum ismeretlen, teljes dokumentum lesz feldolgozva.", file=sys.stderr)
        else:
            s, e = int(m.group(1)), int(m.group(2))
            if s < 1 or e < s or e > total:
                raise SystemExit(f"Érvénytelen oldaltartomány: {pages}. A PDF {total} oldalas.")
            start_idx, end_idx = s - 1, e - 1

    texts = []
    for i in range(start_idx, end_idx + 1):
        page = reader.pages[i]
        try:
            t = page.extract_text() or ""
        except Exception:
            t = ""
        texts.append(f"\n\n=== PAGE {i+1} ===\n{t}")
    return "".join(texts).strip()

def chunk_text(s: str, max_chars: int) -> list[str]:
    s = s.strip()
    if not s:
        return []
    chunks, i = [], 0
    while i < len(s):
        chunk = s[i:i + max_chars]
        j = chunk.rfind("\n=== PAGE ")
        if j > max_chars * 0.5:
            chunk = chunk[:j]
        chunks.append(chunk)
        i += len(chunk)
    return chunks

# ---------------- Responses kimenetből JSON ----------------
def extract_json_text(response) -> str | None:
    txt = getattr(response, "output_text", None)
    if isinstance(txt, str) and txt.strip().startswith("{"):
        return txt
    out = getattr(response, "output", None)
    if isinstance(out, list):
        parts = []
        for item in out:
            content = getattr(item, "content", None)
            if isinstance(content, list):
                for c in content:
                    ctype = getattr(c, "type", None)
                    if ctype in ("output_text", "message"):
                        val = getattr(c, "text", None) or getattr(c, "content", None)
                        if isinstance(val, str):
                            parts.append(val)
        if parts:
            merged = "\n".join(parts)
            m = re.search(r"\{[\s\S]*\}\s*$", merged)
            if m:
                return m.group(0)
    try:
        blob = response.model_dump_json()
    except Exception:
        blob = json.dumps(response, default=str, ensure_ascii=False)
    m = re.search(r"\{[\s\S]*\}\s*$", blob)
    return m.group(0) if m else None

# ---------------- Main ----------------
def main():
    args = parse_args()
    if not args.pdf.exists():
        sys.exit(f"❌ Nem található PDF: {args.pdf}")

    if args.api_key:
        import os
        os.environ["OPENAI_API_KEY"] = args.api_key

    # 1) PDF → szöveg
    plain = extract_text_from_pdf(args.pdf, args.pages)
    if not plain:
        sys.exit("❌ Nem sikerült szöveget kinyerni a PDF-ből a megadott tartományban.")

    chunks = chunk_text(plain, args.chunk_chars)
    if not chunks:
        sys.exit("❌ Üres bemenet a modell számára (chunkolás után).")

    client = OpenAI()

    # 2) Input üzenetek (csak input_text)
    input_messages = [
        {
            "role": "user",
            "content": [
                {"type": "input_text", "text": f"Oldalak: {args.pages or 'TELJES'}. CHUNK-ok száma: {len(chunks)}."}
            ]
        }
    ]
    for idx, ch in enumerate(chunks, start=1):
        input_messages.append({
            "role": "user",
            "content": [{"type": "input_text", "text": f"[CHUNK {idx}/{len(chunks)}]\n{ch}"}]
        })

    # 3) Responses hívás — stabil "prompt id" + JSON Schema
    response = client.responses.create(
        model=args.model,
        prompt={"id": args.prompt_id, "version": args.prompt_version},
        input=input_messages,
        text={
            "format": {
                "type": "json_schema",
                "name": "btk_min_schema_magyar",
                "strict": True,
                "schema": BTK_SCHEMA
            },
            "verbosity": "low"
        },
        reasoning={"summary": "auto"},
        store=True,
        include=["reasoning.encrypted_content", "web_search_call.action.sources"]
    )

    # 4) JSON kinyerése
    json_text = extract_json_text(response)
    if not json_text:
        raw_path = args.out.with_suffix(".raw.json")
        try:
            raw_path.write_text(response.model_dump_json(), encoding="utf-8")
        except Exception:
            raw_path.write_text(json.dumps(response, default=str, ensure_ascii=False), encoding="utf-8")
        sys.exit("❌ Nem találtam JSON-t a válaszban. A nyers válasz elmentve: " + str(raw_path))

    # 5) Parse + validáció
    try:
        data = json.loads(json_text)
    except json.JSONDecodeError as e:
        bad = args.out.with_suffix(".bad.txt")
        bad.write_text(json_text, encoding="utf-8")
        sys.exit(f"❌ JSON parse hiba: {e}. A beérkezett szöveg mentve: {bad}")

    try:
        jsonschema_validate(instance=data, schema=BTK_SCHEMA)
    except ValidationError as e:
        invalid = args.out.with_suffix(".invalid.json")
        invalid.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        sys.exit(f"❌ Séma-validációs hiba: {e.message}. Hibás JSON mentve: {invalid}")

    # 6) Mentés
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ Kész: {args.out}")

if __name__ == "__main__":
    main()
