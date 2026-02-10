# JURA – Kísérleti Jogi AI-Asszisztens

## Tartalomjegyzék

1. [Projekt áttekintés](#1-projekt-áttekintés)
2. [Architektúra](#2-architektúra)
3. [Könyvtárstruktúra](#3-könyvtárstruktúra)
4. [Frontend (Next.js)](#4-frontend-nextjs)
5. [Backend (Python Cloud Function)](#5-backend-python-cloud-function)
6. [Streaming proxy](#6-streaming-proxy-apichatroutets)
7. [RAG pipeline és vektor tár](#7-rag-pipeline-és-vektor-tár)
8. [Firebase és Firestore](#8-firebase-és-firestore)
9. [Sötét mód és design rendszer](#9-sötét-mód-és-design-rendszer)
10. [CI/CD és deployment](#10-cicd-és-deployment)
11. [Környezeti változók](#11-környezeti-változók)
12. [Lokális fejlesztés](#12-lokális-fejlesztés)
13. [Backend deployment](#13-backend-deployment)
14. [Scriptek (jogszabály-feldolgozás)](#14-scriptek-jogszabály-feldolgozás)
15. [Biztonsági megfontolások](#15-biztonsági-megfontolások)
16. [Ismert limitációk](#16-ismert-limitációk)

---

## 1. Projekt áttekintés

A **JURA** egy kísérleti mesterséges intelligencia alapú jogi információs eszköz, amely magyar jogszabályok és jogi szövegek kiválasztott köre alapján segít a szakaszok, jogintézmények megértésében. A rendszer **retrieval-augmented generation (RAG)** megközelítést használ: a felhasználó kérdését numerikus vektorrá alakítja, egy jogi vektortárban (~9 362 annotált jogszabályfájl) keres releváns részleteket, majd az OpenAI GPT-5.2 modell ezek alapján fogalmazza meg a választ.

**A rendszer NEM minősül jogi tanácsadásnak**, és nem helyettesíti ügyvéd véleményét.

### Technológiai stack összefoglaló

| Réteg | Technológia |
|-------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 3.4, TypeScript 5.9 |
| UI komponensek | Radix UI (scroll-area), Lucide React (ikonok), Sonner (toast) |
| Téma | next-themes (sötét mód), oklch színrendszer, Geist Sans/Mono fontok |
| Adatbázis | Firebase Firestore (chat előzmények, feedback) |
| Streaming proxy | Next.js API Route (Node.js, undici) |
| Backend | Python Flask, Google Cloud Functions Gen2 |
| AI modell | OpenAI GPT-5.2 (Responses API, file_search tool) |
| Vektor tár | OpenAI Vector Store (`vs_698a0859caa081918c62fcf51a98bffa`) |
| Hosting | Firebase Hosting (europe-west1) + Cloud Functions |
| CI/CD | GitHub Actions → Firebase Hosting deploy |

---

## 2. Architektúra

```
┌───────────────────────────────────────────────────────┐
│                    Böngésző (React)                    │
│                   app/chat/page.tsx                    │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  ChatSidebar│  │ Üzenet nézet │  │ Input mező   │ │
│  │  (Firestore)│  │ (Markdown +  │  │ (textarea +  │ │
│  │             │  │  streaming)  │  │  send button) │ │
│  └─────────────┘  └──────────────┘  └──────────────┘ │
└──────────────┬────────────────────────────────────────┘
               │ POST /api/chat (vagy közvetlen Cloud Run URL)
               │ { message: "...", history: [...] }
               ▼
┌──────────────────────────────────────┐
│     Next.js Streaming Proxy          │
│     app/api/chat/route.ts            │
│                                      │
│  • CORS kezelés                      │
│  • Input validáció (max 10K char)    │
│  • Null-byte heartbeat (2s)          │
│  • Upstream fetch + stream pump      │
│  • Rate limit header forwarding      │
│  • Timeout: 540s                     │
└──────────────┬───────────────────────┘
               │ POST (text/event-stream)
               ▼
┌──────────────────────────────────────┐
│     Python Backend (Cloud Function)  │
│     backend/main.py                  │
│                                      │
│  • System prompt (jura_prompts.py)   │
│  • OpenAI Responses API              │
│  • file_search tool + vektor tár     │
│  • max_num_results: 12               │
│  • score_threshold: 0.1              │
│  • reasoning: { effort: "low" }      │
│  • Streaming válasz generálás        │
│  • [STREAM_ERROR] marker hibáknál    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     OpenAI API                       │
│                                      │
│  • GPT-5.2 modell                    │
│  • Vektor tár: 9 362 fájl            │
│  • Chunking: 2000 token, 500 overlap │
│  • Ranker: auto, threshold: 0.1     │
└──────────────────────────────────────┘
```

### Adatfolyam egy kérdés feldolgozásakor

1. A felhasználó beírja a kérdést és elküldi
2. A frontend `fetch()` hívást indít a proxy-hoz (`/api/chat` dev-ben, közvetlen Cloud Run URL production-ben)
3. A proxy validálja az inputot, majd továbbítja az upstream Cloud Function-nek
4. A Cloud Function összeállítja az input üzeneteket (system prompt + history + user message)
5. Az OpenAI Responses API `file_search` tool-lal keres a vektor tárban
6. A modell streaming válaszban generálja a szöveget
7. A proxy null-byte heartbeat-tel tartja életben a kapcsolatot és továbbítja a chunk-okat
8. A frontend `ReadableStream` reader-rel olvassa a chunk-okat, null-byte-okat kiszűri, és `requestAnimationFrame` throttling-gal frissíti a UI-t
9. A válasz végén a chat mentésre kerül a Firestore `chats` kollekcióba

---

## 3. Könyvtárstruktúra

```
jura-chat/
├── app/                              # Next.js App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts              # Streaming proxy (242 sor)
│   ├── chat/
│   │   └── page.tsx                  # Fő chat felület (795 sor)
│   ├── jogi-nyilatkozat/
│   │   └── page.tsx                  # Jogi nyilatkozat oldal (262 sor)
│   ├── projekt/
│   │   └── page.tsx                  # Projekt / modellkártya oldal (319 sor)
│   ├── globals.css                   # oklch színrendszer (light/dark)
│   ├── layout.tsx                    # Root layout (Geist fontok, ThemeProvider)
│   └── page.tsx                      # Landing page (360 sor)
│
├── backend/                          # Python backend (Cloud Function)
│   ├── main.py                       # Flask handler (134 sor)
│   ├── jura_prompts.py               # System prompt (38 sor)
│   └── requirements.txt              # Python függőségek
│
├── components/                       # React komponensek
│   ├── chat-sidebar.tsx              # Oldalsáv chat előzményekkel
│   ├── smart-citation.tsx            # Jogszabályhely-linkek renderelése
│   ├── theme-provider.tsx            # next-themes wrapper
│   ├── theme-toggle.tsx              # Sötét/világos mód gomb
│   └── ui/
│       └── scroll-area.tsx           # Radix UI scroll area
│
├── lib/                              # Segédkönyvtárak
│   ├── firebase.ts                   # Firebase inicializáció (Firestore)
│   ├── anonymous-user.ts             # Anonim felhasználó-azonosító (localStorage)
│   ├── citation-regex.ts             # Jogszabályhely regex + Jogtár URL builder
│   └── utils.ts                      # cn() class merge segédfüggvény
│
├── scripts/                          # Egyszer futtatott segédscriptek
│   ├── chunk_laws.py                 # Jogszabályszöveg annotáló/chunkoló
│   └── upload_to_vectorstore.py      # Vektor tár feltöltő
│
├── public/                           # Statikus fájlok
│   ├── favicon.png
│   └── images/
│       └── jura-logo.png
│
├── .github/workflows/                # CI/CD
│   ├── firebase-hosting-merge.yml    # Auto-deploy main push-ra
│   └── firebase-hosting-pull-request.yml
│
├── firebase.json                     # Firebase konfig (hosting + firestore)
├── firestore.rules                   # Firestore biztonsági szabályok
├── firestore.indexes.json            # Firestore összetett indexek
├── .firebaserc                       # Firebase projekt: jura-v2
├── .env.example                      # Környezeti változók minta
├── package.json                      # npm függőségek
├── tailwind.config.js                # Tailwind konfig (darkMode, fontok)
├── tsconfig.json                     # TypeScript konfig
├── postcss.config.mjs                # PostCSS konfig
├── next.config.ts                    # Next.js konfig
└── eslint.config.mjs                 # ESLint konfig
```

---

## 4. Frontend (Next.js)

### 4.1 Chat felület (`app/chat/page.tsx`)

A fő chat oldal egy "use client" komponens, amely az alábbi főbb részekből áll:

**Állapotkezelés:**
- `messages: ChatMessage[]` — üzenetlista (user + assistant)
- `input: string` — textarea tartalma
- `loading: boolean` — streaming folyamatban van-e
- `isSidebarOpen: boolean` — oldalsáv nyitva/csukva
- `currentChatId: string | null` — aktuális Firestore dokumentum ID
- `anonymousUserId: string` — localStorage-ból kiolvasott UUID
- `loadingSeconds: number` — válaszidő számláló
- `feedbackGiven: Record<number, "like" | "dislike">` — melyik üzenetre adott már visszajelzést

**Streaming logika (`sendMessage()`):**
1. Felhasználói üzenet hozzáadása + üres assistant placeholder
2. `fetch()` hívás a proxy/Cloud Run felé
3. `ReadableStream` reader chunk-onkénti olvasás
4. Null-byte (`\0`) heartbeat szűrés: `.replace(/\0/g, "")`
5. `requestAnimationFrame` throttling a UI frissítéséhez (~60fps)
6. `firstRealChunk` flag: loading indikátor elrejtése az első valódi chunk-nál
7. `[STREAM_ERROR]...[/STREAM_ERROR]` marker detektálás és kezelés
8. Sikeres válasz után Firestore mentés

**Firestore integráció:**
- `saveToFirestore()` — új chat létrehozása vagy meglévő frissítése
- `handleSelectChat()` — korábbi chat betöltése az oldalsávból
- `handleNewChat()` — üzenetlista és chatId törlése
- `handleFeedback()` — like/dislike mentése a `feedback` kollekcióba

**Üzenet megjelenítés:**
- Felhasználói üzenet: jobb oldalon, `bg-neutral-200` (light) / `bg-[#282A2C]` (dark), lekerekített sarkok (`rounded-tr-none`)
- Asszisztens üzenet: bal oldalon, átlátszó háttér, "J" avatar, prose stílus
- ReactMarkdown + remark-gfm a markdown rendereléshez
- SmartCitation komponens a jogszabályhely-linkekhez
- Like/dislike/copy gombok hover-re jelennek meg az asszisztens üzeneteknél

**Üres állapot (empty state):**
- JURA logó középen
- "Miben segíthetek?" felirat
- 5 javasolt kérdés pill gombokként
- Input mező alul

### 4.2 Landing page (`app/page.tsx`)

A főoldal egy szerver komponens (nem "use client"), amely tartalmazza:
- Hero szekció a projekt bemutatásával
- "Milyen témákban segít?" / "Miben nem tud segíteni?" kártyák
- "Belépés a chatbe" gomb
- Jogi nyilatkozat doboz
- "Kinek ajánlott?" szekció (joghallgatók, gyakornokok, laikusok)
- "Mire használható?" / "Mire nem használható?" feature kártyák
- "Hogyan működik?" szekció (3 lépés)
- RAG technikai magyarázat
- Footer jogi nyilatkozat és projekt linkekkel
- ThemeToggle komponens a jobb felső sarokban
- JSON-LD struktúrált adatok SEO-hoz

### 4.3 Layout (`app/layout.tsx`)

- Geist Sans és Geist Mono fontok (`next/font/google`)
- `ThemeProvider` wrapper (`next-themes`, `attribute="class"`, `defaultTheme="light"`)
- `Toaster` (sonner) toast értesítésekhez
- SEO metaadatok (OpenGraph, Twitter Card)
- JSON-LD struktúrált adatok (WebSite + SoftwareApplication schema)
- `suppressHydrationWarning` a `<html>` elemen (next-themes követelmény)

### 4.4 Komponensek

#### `ChatSidebar` (`components/chat-sidebar.tsx`)
- 280px széles, összecsukható oldalsáv
- Szín: `bg-[#f0f4f9]` (light) / `bg-[#1e1f20]` (dark)
- "Új csevegés" gomb
- "Legutóbbiak" label
- Firestore `onSnapshot` real-time listener a `chats` kollekcióra
- Filter: `userId == anonymousUserId`, rendezés: `updatedAt desc`
- Aktív chat kiemelés: `bg-[#c7d0d9]` (light) / `bg-[#004a77]` (dark)
- Törlés gomb hover-re jelenik meg (Trash2 ikon)
- Mobil nézetben rejtett (`hidden md:flex`)

#### `ThemeToggle` (`components/theme-toggle.tsx`)
- Kör alakú gomb (h-9, w-9)
- Sun ikon (light mód) / Moon ikon (dark mód)
- CSS animáció a váltásnál (rotate + scale)
- `useTheme()` hook a `next-themes`-ből

#### `SmartCitation` (`components/smart-citation.tsx`)
- ReactMarkdown `p` és `li` elemek szövegében keresi a jogszabályhely-hivatkozásokat
- Regex minta: `Ptk`, `Btk`, `Mt`, `Pp`, `Kp`, `Ákr`, `Be` + §-szám
- Talált hivatkozásokat kattintható linkké alakítja
- Link cél: Google keresés a `net.jogtar.hu`-n
- Stílus: `text-blue-600 dark:text-blue-400 hover:underline`

#### `ScrollArea` (`components/ui/scroll-area.tsx`)
- Radix UI `@radix-ui/react-scroll-area` wrapper
- Egyedi scrollbar stílus: w-2.5, bg-slate-300, hover bg-slate-400

### 4.5 Segédkönyvtárak (`lib/`)

#### `firebase.ts`
- Firebase app inicializáció (singleton pattern: `getApps().length` ellenőrzés)
- Firestore `db` exportálása
- Projekt: `jura-v2`

#### `anonymous-user.ts`
- `getAnonymousUserId()`: localStorage-ból kiolvas vagy generál egy UUID-t
- Kulcs: `jura_anonymous_uid`
- Kliens oldalon fut (`typeof window` ellenőrzés SSR-hez)

#### `citation-regex.ts`
- `CITATION_REGEX`: globális regex jogszabályhely-hivatkozások kereséséhez
- `buildJogtarUrl(citation)`: Google keresési URL generálás `site:net.jogtar.hu` szűrővel

#### `utils.ts`
- `cn(...inputs)`: `clsx` + `tailwind-merge` kombinálás (class ütközések feloldása)

---

## 5. Backend (Python Cloud Function)

### 5.1 Fájlok

| Fájl | Méret | Leírás |
|------|-------|--------|
| `main.py` | 134 sor | Fő HTTP handler |
| `jura_prompts.py` | 38 sor | System prompt |
| `requirements.txt` | 3 sor | Függőségek |

### 5.2 `main.py` — Cloud Function handler

```
Belépési pont: chat(request)
Framework: functions_framework + Flask
```

**Konfiguráció:**
- `MODEL`: `gpt-5.2` (env: `MODEL`)
- `MAX_MESSAGE_LENGTH`: 10 000 karakter
- `MAX_HISTORY_LIMIT`: 10 üzenet
- `NORMATIVE_VECTOR_STORE_ID`: `vs_698a0859caa081918c62fcf51a98bffa`
- CORS: `Access-Control-Allow-Origin: *`

**Feldolgozás lépései:**
1. CORS preflight kezelés (`OPTIONS` → 204)
2. Method ellenőrzés (csak `POST`)
3. OpenAI API key ellenőrzés
4. Request body parse (`message`, `history`)
5. Input validáció (üres üzenet, hossz)
6. Input üzenetek összeállítása: `[system_prompt, ...history, user_message]`
7. OpenAI Responses API hívás:
   - `model`: gpt-5.2
   - `tools`: file_search (vektor tár, max 12 eredmény, score küszöb 0.1)
   - `stream`: True
   - `reasoning`: { effort: "low" }
8. Generator függvény: `response.output_text.delta` event-ek yield-elése
9. Flask `Response` + `stream_with_context` + `text/event-stream` mimetype
10. Anti-buffering headerek: `X-Accel-Buffering: no`, `Transfer-Encoding: chunked`

**Hibakezelés:**
- Streaming közbeni hiba: `[STREAM_ERROR]...[/STREAM_ERROR]` marker yield
- Kritikus hiba: JSON error response 500-as kóddal

### 5.3 `jura_prompts.py` — System prompt

A system prompt magyar nyelvű utasításokat tartalmaz a modellnek:

- **Identitás**: magasan képzett magyar jogi szakértő asszisztens
- **Tudásbázis elvek**: csak a rendelkezésre álló fájlokból dolgozik; soha ne találjon ki jogszabályt
- **Strukturált gondolkodás**: eljárási / anyagi jogi / fogalmi kérdések megkülönböztetése
- **Szándékelemzés**: vészhelyzet / tervezés / kutatás / adatkeresés mód
- **Stílus**: emberi hangnem, pontos jogszabályhely-idézés
- **Kötelező válaszformátum** (Markdown):
  1. Rövid összefoglaló (3–5 mondat)
  2. Normatív jogi háttér – pontokban
  3. Gyakorlati javaslat
  4. Diszklémer

### 5.4 Függőségek (`requirements.txt`)

```
functions-framework==3.*
openai>=1.75.0
flask>=3.0.0
```

---

## 6. Streaming proxy (`app/api/chat/route.ts`)

A Next.js API Route közvetítő réteget képez a frontend és a Python backend között. Fő feladatai:

### 6.1 CORS kezelés

```typescript
const allowed = (process.env.ALLOWED_ORIGIN || "*").split(",").map(o => o.trim());
const corsOrigin = allowed.includes(origin) || allowed.includes("*") ? origin : allowed[0];
```

Az `ALLOWED_ORIGIN` környezeti változó vesszővel elválasztott domain-listát fogad. Ha `*`, minden origin engedélyezett.

### 6.2 Input validáció

- `message`: kötelező, string, max 10 000 karakter
- `history`: opcionális, tömb, max 30 elem (csonkolás)

### 6.3 Upstream fetch

- `undici` Agent egyedi timeout-okkal (connectTimeout: 60s, headerTimeout: 0, bodyTimeout: 0)
- `AbortController` 540 másodperces globális timeout-tal
- `Authorization` header forwarding

### 6.4 Heartbeat mechanizmus

A proxy null-byte (`\0`) heartbeat-eket küld 2 másodpercenként a kliensnek, hogy a köztes rétegek (Vercel, Firebase, Cloudflare) ne zárják le a kapcsolatot inaktivitás miatt. A frontend ezeket a null-byte-okat kiszűri.

```
Kliens ← \0 (azonnali)
Kliens ← \0 (2s múlva)
Kliens ← \0 (4s múlva)
...
Kliens ← [valódi szöveg chunk-ok a backendtől]
Kliens ← \0 (ha 2s-nál több idő telik el chunk-ok között)
```

### 6.5 Stream pump

```typescript
const reader = upstreamResponse.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  controller.enqueue(value);
}
```

### 6.6 Rate limit headerek

A proxy továbbítja az upstream `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headereket.

### 6.7 Konfiguráció

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 540; // 9 perc
```

---

## 7. RAG pipeline és vektor tár

### 7.1 Jogszabály-feldolgozás pipeline

```
Nyers jogszabályszövegek (*.txt)
        │
        ▼
  chunk_laws.py --mode=annotate
  (§-alapú annotálás, kontextus megőrzés)
        │
        ▼
  Annotált fájlok (9 362 db)
  [2024. évi V. törvény – Ptk.]
  42. Azonnali hatályú felmondás
  78. § (1) A munkáltató azonnali hatállyal...
        │
        ▼
  upload_to_vectorstore.py
  (OpenAI Files API + Vector Store Batch API)
        │
        ▼
  OpenAI Vector Store
  vs_698a0859caa081918c62fcf51a98bffa
  9 362 fájl, 0 hiba
  Chunking: 2000 token max, 500 token overlap
```

### 7.2 `chunk_laws.py` — Annotáló script

Két mód:

**`--mode=annotate` (alapértelmezett):**
- Minden `§` marker elé beszúrja a jogszabály azonosítóját (pl. `[2013. évi V. törvény (Ptk.) – a Polgári Törvénykönyvről]`)
- Az alcímeket is megőrzi a marker előtt
- Így az OpenAI chunking az egyes chunk-okban megtartja a kontextust
- Eredmény: 9 362 annotált fájl (eredeti fájlszám megmarad)

**`--mode=split`:**
- Minden `§` külön fájl lesz metaadat prefixszel
- Kis §-ok összevonása (`MIN_CHUNK_CHARS: 200`)
- § nélküli szövegekre fallback fix méretű chunking
- Sok fájlt generál (~170K), csak akkor ajánlott ha a vektor tár elbírja

**Regex minták:**
- `RE_TORVENY`: `\d{4}\. évi [IVXLCDM]+\. törvény`
- `RE_RENDELET`: `\d+/\d{4}\. \([^)]*\) \S+\. rendelet`
- `RE_HATAROZAT`: `\d+/\d{4}\. \([^)]*\) \S+\. határozat`
- `RE_SECTION`: `^\d+(?:/[A-Z])?\. §`

### 7.3 `upload_to_vectorstore.py` — Feltöltő script

```bash
python3 upload_to_vectorstore.py <input_dir> [--store-id=vs_xxx] [--delete-first]
```

- `--delete-first`: törli a meglévő fájlokat a vektor tárból feltöltés előtt
- Batch méret: 500 fájl/batch (OpenAI limit)
- Chunking: `max_chunk_size_tokens=2000`, `chunk_overlap_tokens=500`
- Progressz kiírás: 50 fájlonként és batch-enként

### 7.4 Vektor tár konfiguráció (runtime)

A `backend/main.py`-ban:

```python
tools=[{
    "type": "file_search",
    "vector_store_ids": ["vs_698a0859caa081918c62fcf51a98bffa"],
    "max_num_results": 12,
    "ranking_options": {
        "ranker": "auto",
        "score_threshold": 0.1,
    },
}]
```

- **max_num_results: 12** — max 12 releváns chunk visszaadása (jobb recall specifikus §-keresésekhez)
- **score_threshold: 0.1** — alacsony küszöb, hogy keyword-match-ek is bekerüljenek
- **ranker: auto** — automatikus ranker választás (OpenAI hybrid search)
- **reasoning: { effort: "low" }** — alacsony reasoning effort (token-takarékos, ~20K token/kérdés)

---

## 8. Firebase és Firestore

### 8.1 Projekt

- **Firebase projekt**: `jura-v2`
- **Régió**: europe-west1
- **Web app ID**: `1:964528236444:web:cae20616cac15785968a59`

### 8.2 Firestore kollekciók

#### `chats` — Chat előzmények

```typescript
{
  userId: string,          // Anonim felhasználó UUID (localStorage-ból)
  title: string,           // Az első felhasználói üzenet első 50 karaktere
  messages: [              // Üzenetlista
    { role: "user", content: "..." },
    { role: "assistant", content: "..." },
    ...
  ],
  createdAt: Timestamp,    // Létrehozás időpontja (serverTimestamp)
  updatedAt: Timestamp,    // Utolsó frissítés (serverTimestamp)
}
```

**Összetett index:** `userId` ASC + `updatedAt` DESC (sidebar lekérdezéshez)

#### `feedback` — Visszajelzések (like/dislike)

```typescript
{
  type: "like" | "dislike",
  query: string,           // A felhasználó kérdése (ami előtte volt)
  response: string,        // Az asszisztens válaszának első 2000 karaktere
  userId: string,          // Anonim felhasználó UUID
  chatId: string | null,   // Chat dokumentum ID
  createdAt: Timestamp,    // Létrehozás időpontja
}
```

### 8.3 Firestore biztonsági szabályok

```
chats:
  - read: mindenki (a sidebar query-hez userId szűrővel)
  - create: kötelező mezők (userId, title, messages), típus ellenőrzés
  - update: csak messages és updatedAt módosítható
  - delete: mindenki

feedback:
  - read: senki (csak admin console-ból)
  - create: kötelező mezők (type, userId), type in ["like", "dislike"]
```

### 8.4 Anonim felhasználó-azonosítás

Autentikáció nélkül, `localStorage`-ban tárolt UUID:

```typescript
// lib/anonymous-user.ts
const uid = localStorage.getItem("jura_anonymous_uid") || crypto.randomUUID();
localStorage.setItem("jura_anonymous_uid", uid);
```

Ez a `userId` mező a Firestore dokumentumokban. Kliens oldalon generálódik, nem ellenőrizhető szerver oldalon (nincs Firebase Auth). Elfogadható beta szintű biztonsághoz.

---

## 9. Sötét mód és design rendszer

### 9.1 Színrendszer (oklch)

A `globals.css`-ben CSS custom property-kkel definiált oklch színek:

| Változó | Light mód | Dark mód |
|---------|-----------|----------|
| `--background` | `oklch(1 0 0)` (fehér) | `oklch(0.129 0.042 264.695)` (sötétkék) |
| `--foreground` | `oklch(0.129 0.042 264.695)` (majdnem fekete) | `oklch(0.984 0.003 247.858)` (törtfehér) |
| `--primary` | `oklch(0.208 0.042 265.755)` (sötétkék) | `oklch(0.929 0.013 255.508)` (világoskék) |
| `--border` | `oklch(0.929 0.013 255.508)` (világosszürke) | `oklch(1 0 0 / 10%)` (fehér 10%) |
| `--sidebar` | `oklch(0.984 0.003 247.858)` (törtfehér) | `oklch(0.208 0.042 265.755)` (sötétkék) |

### 9.2 Fontok

- **Geist Sans**: elsődleges betűtípus (`--font-geist-sans`)
- **Geist Mono**: kód betűtípus (`--font-geist-mono`)
- Betöltés: `next/font/google` (optimalizált, `font-display: swap`)

### 9.3 Tailwind konfiguráció

```javascript
darkMode: "class"  // next-themes .dark osztály alapján
fontFamily: {
  sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  mono: ["var(--font-geist-mono)", "monospace"],
}
borderRadius: {
  lg: "var(--radius)",      // 0.625rem (10px)
  md: "calc(var(--radius) - 2px)",  // 8px
  sm: "calc(var(--radius) - 4px)",  // 6px
}
```

### 9.4 Sidebar stílusok

| Elem | Light | Dark |
|------|-------|------|
| Háttér | `bg-[#f0f4f9]` | `bg-[#1e1f20]` |
| Aktív chat | `bg-[#c7d0d9]` | `bg-[#004a77] text-[#c2e7ff]` |
| "Új csevegés" gomb | `bg-[#dfe3e7]` | `bg-[#282a2c]` |
| Hover | `hover:bg-neutral-200` | `hover:bg-[#2c2d2e]` |

---

## 10. CI/CD és deployment

> **FONTOS**: A projektben **két külön Cloud Function** fut, és ezeket **két külön GitHub Actions workflow** deployolja!
>
> | Komponens | Workflow fájl | Trigger |
> |-----------|--------------|---------|
> | Next.js SSR frontend (`ssrjurav2`) | `firebase-hosting-merge.yml` | Minden push a `main`-re |
> | Python backend (`jura-chat-backend`) | `deploy-backend.yml` | Push a `main`-re, **csak ha `backend/` mappa változott** |
>
> A backend workflow a `paths: ['backend/**']` szűrőt használja, tehát csak akkor fut le, ha a `backend/` mappában történt változás.

### 10.1 GitHub Actions — Firebase Hosting (frontend)

Fájl: `.github/workflows/firebase-hosting-merge.yml`

```yaml
trigger: push to main
runner: ubuntu-latest
steps:
  1. actions/checkout@v4
  2. npm ci && npm run build
  3. FirebaseExtended/action-hosting-deploy@v0
     - channelId: live
     - projectId: jura-v2
     - firebaseToolsVersion: 13.29.1
     - env: FIREBASE_CLI_EXPERIMENTS=webframeworks
```

**Ez a workflow CSAK az alábbiakat deployolja:**
- Firebase Hosting (statikus fájlok, CDN)
- Next.js SSR Cloud Function (`ssrjurav2`) — ez tartalmazza az `app/api/chat/route.ts` proxyt is

**NEM deployolja:**
- A Python backend Cloud Function-t (azt a `deploy-backend.yml` kezeli)
- Firestore szabályokat (azokat `firebase deploy --only firestore` paranccsal kell)

**Szükséges GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT_JURA_V2`: Firebase service account JSON

### 10.2 GitHub Actions — Python Backend

Fájl: `.github/workflows/deploy-backend.yml`

```yaml
trigger: push to main (csak ha backend/ mappa változott)
runner: ubuntu-latest
steps:
  1. actions/checkout@v4
  2. google-github-actions/auth@v2 (GCP_SERVICE_ACCOUNT_KEY)
  3. google-github-actions/setup-gcloud@v2
  4. gcloud functions deploy jura-chat-backend ...
```

**Szükséges GitHub Secret:**
- `GCP_SERVICE_ACCOUNT_KEY`: GCP service account JSON (Cloud Functions deploy jogosultsággal)

**Szükséges IAM szerepkörök a service account-on:**
- `roles/cloudfunctions.developer`
- `roles/iam.serviceAccountUser`
- `roles/run.admin` (Gen2 Cloud Functions Cloud Run-on fut)

### 10.3 Deploy folyamat összefoglaló

```
┌─────────────────────────────────────────────────────────────┐
│ git push origin main                                        │
│                                                             │
│  ┌─ firebase-hosting-merge.yml (MINDIG) ───────────────┐   │
│  │  npm ci && npm run build                             │   │
│  │  Firebase Hosting deploy (Next.js SSR + statikus)    │   │
│  │  → ssrjurav2-74elkdduqa-ew.a.run.app frissül        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ deploy-backend.yml (CSAK ha backend/ változott) ───┐   │
│  │  gcloud functions deploy jura-chat-backend           │   │
│  │  → Python backend Cloud Function frissül             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 10.3 PR preview

A `.github/workflows/firebase-hosting-pull-request.yml` automatikusan preview URL-t generál pull request-ekhez.

---

## 11. Környezeti változók

### Frontend (Next.js)

| Változó | Kötelező | Leírás |
|---------|----------|--------|
| `CHAT_UPSTREAM_URL` | igen | Python backend URL (Cloud Function) |
| `ALLOWED_ORIGIN` | nem | CORS engedélyezett originek (vesszővel elválasztva) |

Ezek Firebase Hosting secrets-ként vannak konfigurálva a `firebase.json`-ben.

### Backend (Python Cloud Function)

| Változó | Kötelező | Leírás |
|---------|----------|--------|
| `OPENAI_API_KEY` | igen | OpenAI API kulcs |
| `MODEL` | nem | Modell neve (alapértelmezett: `gpt-5.2`) |
| `NORMATIVE_VECTOR_STORE_ID` | nem | Vektor tár ID (alapértelmezett: `vs_698a0859caa081918c62fcf51a98bffa`) |

### `.env.example`

```bash
CHAT_UPSTREAM_URL=
ALLOWED_ORIGIN=
```

---

## 12. Lokális fejlesztés

### 12.1 Előfeltételek

- Node.js 20+
- Python 3.11+ (backend fejlesztéshez)
- Firebase CLI (`npm install -g firebase-tools`)

### 12.2 Frontend indítás

```bash
# Függőségek telepítése
npm install

# Környezeti változók (hozd létre az .env.local fájlt)
echo "CHAT_UPSTREAM_URL=http://localhost:8080" > .env.local

# Fejlesztői szerver indítása
npm run dev
```

A frontend a http://localhost:3000 címen érhető el.

### 12.3 Backend indítás (lokális)

```bash
cd backend

# Python függőségek
pip install -r requirements.txt

# Cloud Function lokális futtatás
OPENAI_API_KEY=sk-... functions-framework --target=chat --port=8080
```

### 12.4 Tesztelés curl-lel

```bash
# Backend közvetlen tesztelés
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"message":"Mi az a Ptk.?"}' \
  --no-buffer

# Frontend proxy tesztelés
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Mi az a Ptk.?"}' \
  --no-buffer
```

### 12.5 Production URL

Production-ben a frontend közvetlenül a Cloud Run URL-t hívja (Firebase Hosting buffereli a streaming-et):

```typescript
const API_URL = process.env.NODE_ENV === "production"
  ? "https://ssrjurav2-74elkdduqa-ew.a.run.app/api/chat"
  : "/api/chat";
```

---

## 13. Backend deployment

> A Python backend Cloud Function **automatikusan deployolódik** git push-ra, ha a `backend/` mappa változott (`.github/workflows/deploy-backend.yml`).
> Manuális deploy is lehetséges az alábbi paranccsal.

A Python backend Google Cloud Functions Gen2-re van telepítve.

### 13.1 Mikor kell backend-et deployolni?

Az alábbi fájlok módosítása esetén **manuális deploy szükséges**:

| Fájl | Leírás |
|------|--------|
| `backend/main.py` | Fő handler (model config, file_search paraméterek, streaming logika) |
| `backend/jura_prompts.py` | System prompt (válaszformátum, stílus, utasítások) |
| `backend/requirements.txt` | Python függőségek |

### 13.2 Deploy parancs

```bash
gcloud functions deploy jura-chat-backend \
  --gen2 \
  --region=europe-west1 \
  --runtime=python312 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=chat \
  --source=backend/ \
  --set-env-vars="MODEL=gpt-5.2" \
  --set-secrets="OPENAI_API_KEY=OPENAI_API_KEY:latest" \
  --memory=256Mi \
  --timeout=540s \
  --max-instances=10
```

### 13.3 Deploy ellenőrzés

A deploy után ellenőrizheted, hogy a változások élesedtek-e:

```bash
# Teszt kérdés a live endpoint-ra
curl -s -X POST 'https://<BACKEND_URL>/api/chat' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Miről szól az Mt. 20. §?","history":[]}' \
  --max-time 60
```

Vagy az OpenAI Dashboard-on (`platform.openai.com/responses`) ellenőrizheted a `File Search` szekciót:
- **max_num_results: 12** esetén legfeljebb 12 fájl jelenik meg keresési körönként
- **score_threshold: 0.1** esetén alacsonyabb relevancia score-ú chunk-ok is bekerülnek

### 13.4 Megjegyzések

- A `OPENAI_API_KEY` Google Cloud Secret Manager-ben van tárolva
- A function publikusan elérhető (`allow-unauthenticated`) a CORS headerek miatt
- Timeout 540s (9 perc) a hosszú streaming válaszokhoz
- A `gcloud` CLI-t előtte be kell állítani: `gcloud auth login` és `gcloud config set project jura-v2`

### 13.5 Cloud Function neve és URL

- **Function neve**: `jura-chat-backend`
- **Régió**: `europe-west1`
- **Cloud Run URL**: A deploy output-ban megjelenik (pl. `https://jura-chat-backend-xxxxx-ew.a.run.app`)
- Ez az URL kerül a Next.js proxy `CHAT_UPSTREAM_URL` secret-jébe

---

## 14. Scriptek (jogszabály-feldolgozás)

### 14.1 `chunk_laws.py`

**Használat:**
```bash
python3 scripts/chunk_laws.py <input_dir> <output_dir> [--mode=annotate|split]
```

**Példa:**
```bash
# Annotálás (ajánlott)
python3 scripts/chunk_laws.py raw_laws/ annotated_laws/ --mode=annotate

# Darabolás (sok fájl)
python3 scripts/chunk_laws.py raw_laws/ chunked_laws/ --mode=split
```

**Kimenet statisztika:**
```
Mód: annotate
Feldolgozandó fájlok: 9363
Fájlok kiírva:     9362
Kihagyott:         1
Hibás:             0
Össz méret:        285.3 MB
Átlag fájl méret:  30456 karakter (29.7 KB)
```

### 14.2 `upload_to_vectorstore.py`

**Használat:**
```bash
OPENAI_API_KEY=sk-... python3 scripts/upload_to_vectorstore.py <input_dir> [--store-id=vs_xxx] [--delete-first]
```

**Példa:**
```bash
# Meglévő fájlok törlése + újrafeltöltés
OPENAI_API_KEY=sk-... python3 scripts/upload_to_vectorstore.py annotated_laws/ --delete-first

# Hozzáadás meglévőhöz
OPENAI_API_KEY=sk-... python3 scripts/upload_to_vectorstore.py annotated_laws/ --store-id=vs_698a0859caa081918c62fcf51a98bffa
```

---

## 15. Biztonsági megfontolások

### 15.1 Jelenlegi állapot

| Terület | Állapot | Megjegyzés |
|---------|---------|------------|
| Firebase Auth | Nincs | Anonim localStorage UUID helyettesíti |
| Firestore szabályok | Alapszintű | Típus-validáció van, de userId nem hitelesített |
| CORS | Konfigurálható | `ALLOWED_ORIGIN` env változóval |
| Input validáció | Van | Max 10K char üzenet, max 30 history elem |
| Rate limiting | Nincs | OpenAI API rate limit-re támaszkodik |
| XSS védelem | Van | React alapértelmezett escaping + ReactMarkdown |

### 15.2 Javaslatok production-höz

1. **Firebase Anonymous Auth** hozzáadása — automatikus, user interakció nélkül, de `request.auth.uid` ellenőrizhető a Firestore szabályokban
2. **Rate limiting** az API proxy-ban (pl. IP alapú, Redis-szel)
3. **ALLOWED_ORIGIN** szűkítése production domain-ekre
4. **Content Security Policy** headerek hozzáadása

---

## 16. Ismert limitációk

1. **Nem jogi tanácsadás** — A rendszer kizárólag tájékoztató jellegű, nem helyettesíti ügyvéd véleményét
2. **Aktualitás nem garantált** — A vektor tárban lévő jogszabályszövegek nem feltétlenül naprakészek
3. **Hallucináció lehetséges** — Bár a `reasoning: low` és `score_threshold: 0.1` csökkenti, a modell generálhat nem létező jogszabályhelyet. A `reasoning: "low"` beállítás téma-tévesztést is okozhat hosszabb beszélgetéseknél
4. **Nincs valódi autentikáció** — A localStorage UUID könnyen hamisítható, más felhasználó chat-jei nem védettek
5. **Firebase Hosting buffering** — A Firebase Hosting buffereli a streaming-et, ezért production-ben közvetlen Cloud Run URL-t használunk
6. **Válaszidő** — Jellemzően 20–40 másodperc (OpenAI file_search + generálás), átlagosan ~33s a 30 kérdéses teszten
7. **Mobil sidebar** — Az oldalsáv mobilon rejtett, nincs hamburger menüs megnyitási lehetőség kis képernyőn
