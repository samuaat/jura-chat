#!/usr/bin/env python3
"""
§-alapú jogszabály annotáló/chunkoló script.

Két mód:
  --mode=annotate  (default) Annotálja az eredeti fájlokat: minden § elé beszúrja
                   a jogszabály azonosítóját, hogy az OpenAI chunkolás megtartsa
                   a kontextust. Kimenet: ~9363 fájl (eredeti számban).

  --mode=split     §-alapú darabolás: minden § külön fájl lesz metaadat prefixszel.
                   Sok fájlt generál (~170K), csak akkor használd ha a vector store
                   engedi.

Használat:
    python3 chunk_laws.py <input_dir> <output_dir> [--mode=annotate|split]
"""

import os
import re
import sys
from pathlib import Path

# --- Konfig ---
MIN_CHUNK_CHARS = 200
FALLBACK_CHUNK_SIZE = 2000
FALLBACK_OVERLAP = 300

# --- Regex minták ---
RE_TORVENY = re.compile(r'(\d{4}\.\s*évi\s+[IVXLCDM]+\.?\s*törvény)', re.IGNORECASE)
RE_RENDELET = re.compile(r'(\d+/\d{4}\.\s*\([^)]*\)\s*\S+\.?\s*rendelet)', re.IGNORECASE)
RE_HATAROZAT = re.compile(r'(\d+/\d{4}\.\s*\([^)]*\)\s*\S+\.?\s*határozat)', re.IGNORECASE)
RE_SECTION = re.compile(r'^(\d+(?:/[A-Z])?\. §)', re.MULTILINE)
RE_SUBTITLE = re.compile(r'^(\d+(?:\.\d+)*\.?\s+[A-ZÁÉÍÓÖŐÚÜŰ][^\n]{2,80})$', re.MULTILINE)


def extract_law_id(text: str, filename: str) -> tuple[str, str]:
    """Kinyeri a jogszabály azonosítóját és címét."""
    header = text[:500]
    law_id = ""

    for pattern in [RE_TORVENY, RE_RENDELET, RE_HATAROZAT]:
        m = pattern.search(header)
        if m:
            law_id = m.group(1).strip()
            break

    law_title = ""
    if law_id:
        idx = header.find(law_id)
        if idx >= 0:
            after = header[idx + len(law_id):].strip()
            for line in after.split('\n'):
                line = line.strip()
                if not line or line.startswith('['):
                    continue
                if re.match(r'^\d+\. §', line):
                    break
                if re.match(r'^(ELSŐ|MÁSODIK|HARMADIK|ÁLTALÁNOS|KÜLÖNÖS|ZÁRÓ)', line):
                    break
                law_title = line
                break

    if not law_id:
        law_id = filename

    return law_id, law_title


def find_subtitle_before(text: str, pos: int) -> str:
    """Megkeresi a § előtti alcímet (pl. '42. Azonnali hatályú felmondás')."""
    pre_text = text[max(0, pos - 200):pos]
    pre_lines = pre_text.strip().split('\n')
    if pre_lines:
        last_line = pre_lines[-1].strip()
        if RE_SUBTITLE.match(last_line):
            return last_line
    return ""


# =====================================================================
# ANNOTATE mód: eredeti fájlok annotálása (§ markerek elé metadata)
# =====================================================================

def annotate_file(text: str, law_id: str, law_title: str) -> str:
    """Beszúrja a jogszabály azonosítóját minden § marker elé."""
    tag = f"[{law_id}"
    if law_title:
        tag += f" – {law_title}"
    tag += "]"

    matches = list(RE_SECTION.finditer(text))
    if not matches:
        # Nincs § -- csak a fájl elejére tesszük a tag-et
        return tag + "\n" + text

    # Fordított sorrendben dolgozunk, hogy a pozíciók ne csússzanak el
    result = text
    for match in reversed(matches):
        pos = match.start()
        subtitle = find_subtitle_before(text, pos)

        # Összeállítjuk a beszúrandó headert
        insert = f"\n{tag}\n"
        if subtitle:
            insert = f"\n{tag}\n{subtitle}\n"

        # Beszúrás a § marker elé
        # Ha már van subtitle sor előtte, ne duplikáljuk
        if subtitle:
            sub_pos = result.rfind(subtitle, max(0, pos - 200), pos)
            if sub_pos >= 0:
                result = result[:sub_pos] + insert + result[pos:]
            else:
                result = result[:pos] + insert + result[pos:]
        else:
            result = result[:pos] + insert + result[pos:]

    # Fájl elejére is tegyük
    if not result.startswith(tag):
        result = tag + "\n" + result

    return result


# =====================================================================
# SPLIT mód: §-onkénti darabolás külön fájlokba
# =====================================================================

def split_by_sections(text: str) -> list[dict]:
    """Szétdarabolja a szöveget § határok mentén."""
    matches = list(RE_SECTION.finditer(text))
    if not matches:
        return []

    chunks = []
    for i, match in enumerate(matches):
        section_label = match.group(1)
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        subtitle = find_subtitle_before(text, start)
        chunks.append({
            "section": section_label,
            "subtitle": subtitle,
            "text": text[start:end].strip(),
        })

    # Preambulum
    first_start = matches[0].start()
    header_text = text[:first_start].strip()
    if header_text and len(header_text) > 50:
        chunks.insert(0, {"section": "preambulum", "subtitle": "", "text": header_text})

    return chunks


def merge_small_chunks(chunks: list[dict], min_chars: int) -> list[dict]:
    """Összevonja a túl rövid §-okat a következővel."""
    if not chunks:
        return chunks
    merged = []
    buffer = None
    for chunk in chunks:
        if buffer is None:
            buffer = chunk.copy()
        elif len(buffer["text"]) < min_chars:
            buffer["text"] += "\n" + chunk["text"]
            buffer["section"] += "–" + chunk["section"]
            if chunk["subtitle"] and not buffer["subtitle"]:
                buffer["subtitle"] = chunk["subtitle"]
        else:
            merged.append(buffer)
            buffer = chunk.copy()
    if buffer:
        merged.append(buffer)
    return merged


def fallback_chunk(text: str) -> list[str]:
    """Fix méretű chunkolás § nélküli szövegekhez."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + FALLBACK_CHUNK_SIZE
        if end < len(text):
            for sep in ['\n\n', '\n', '. ']:
                cut = text.rfind(sep, start + FALLBACK_CHUNK_SIZE // 2, end + 100)
                if cut > start:
                    end = cut + len(sep)
                    break
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - FALLBACK_OVERLAP if end < len(text) else len(text)
    return chunks


# =====================================================================
# Fő logika
# =====================================================================

def process_file_annotate(filepath: Path, output_dir: Path, stats: dict):
    """ANNOTATE mód: eredeti fájl annotálva kimásolása."""
    try:
        text = filepath.read_text(encoding='utf-8')
    except Exception as e:
        stats["errors"] += 1
        return

    if len(text.strip()) < 10:
        stats["skipped"] += 1
        return

    law_id, law_title = extract_law_id(text, filepath.name)
    annotated = annotate_file(text, law_id, law_title)

    out_path = output_dir / filepath.name
    out_path.write_text(annotated, encoding='utf-8')
    stats["files_written"] += 1
    stats["total_chars"] += len(annotated)


def process_file_split(filepath: Path, output_dir: Path, stats: dict):
    """SPLIT mód: §-onkénti darabolás."""
    filename = filepath.stem

    try:
        text = filepath.read_text(encoding='utf-8')
    except Exception as e:
        stats["errors"] += 1
        return

    if len(text.strip()) < 10:
        stats["skipped"] += 1
        return

    law_id, law_title = extract_law_id(text, filepath.name)
    meta_prefix = f"[{law_id}"
    if law_title:
        meta_prefix += f" – {law_title}"
    meta_prefix += "]\n"

    chunks = split_by_sections(text)
    if chunks:
        chunks = merge_small_chunks(chunks, MIN_CHUNK_CHARS)
        for chunk in chunks:
            header_lines = [meta_prefix.strip()]
            if chunk["subtitle"]:
                header_lines.append(chunk["subtitle"])
            full_text = "\n".join(header_lines) + "\n" + chunk["text"]
            section_id = chunk["section"].replace(". §", "").replace("/", "_").split("–")[0].strip()
            out_name = f"{filename}_{section_id.zfill(4)}.txt"
            (output_dir / out_name).write_text(full_text, encoding='utf-8')
            stats["files_written"] += 1
            stats["total_chars"] += len(full_text)
    else:
        fb_chunks = fallback_chunk(text)
        for i, chunk_text in enumerate(fb_chunks):
            full_text = meta_prefix + chunk_text
            out_name = f"{filename}_fb{str(i).zfill(3)}.txt"
            (output_dir / out_name).write_text(full_text, encoding='utf-8')
            stats["files_written"] += 1
            stats["total_chars"] += len(full_text)


def main():
    args = sys.argv[1:]
    mode = "annotate"

    # Parse --mode flag
    remaining = []
    for a in args:
        if a.startswith("--mode="):
            mode = a.split("=", 1)[1]
        else:
            remaining.append(a)

    if len(remaining) != 2:
        print("Használat: python3 chunk_laws.py <input_dir> <output_dir> [--mode=annotate|split]")
        sys.exit(1)

    input_dir = Path(remaining[0])
    output_dir = Path(remaining[1])

    if not input_dir.is_dir():
        print(f"Input mappa nem létezik: {input_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    files = sorted(input_dir.glob("*.txt"))
    print(f"Mód: {mode}")
    print(f"Feldolgozandó fájlok: {len(files)}")

    stats = {"files_written": 0, "total_chars": 0, "skipped": 0, "errors": 0}

    processor = process_file_annotate if mode == "annotate" else process_file_split

    for i, filepath in enumerate(files):
        if (i + 1) % 1000 == 0:
            print(f"  {i + 1}/{len(files)} feldolgozva...")
        processor(filepath, output_dir, stats)

    print(f"\n=== Eredmény ({mode}) ===")
    print(f"Fájlok kiírva:     {stats['files_written']}")
    print(f"Kihagyott:         {stats['skipped']}")
    print(f"Hibás:             {stats['errors']}")
    print(f"Össz méret:        {stats['total_chars'] / 1024 / 1024:.1f} MB")
    if stats['files_written']:
        avg = stats['total_chars'] / stats['files_written']
        print(f"Átlag fájl méret:  {avg:.0f} karakter ({avg/1024:.1f} KB)")


if __name__ == "__main__":
    main()
