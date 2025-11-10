// app/projekt/page.tsx
import Link from "next/link";

export const metadata = {
  title: "JURA projekt – modellkártya és háttér",
  description:
    "A JURA (Jogi Utasításokat Rendszerező Asszisztens) projekt bemutatása: célok, technikai működés, adatkezelés és finanszírozás.",
};

export default function ProjektPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:pb-20 lg:pt-16">
        {/* Vissza link */}
        <div className="mb-6 text-sm text-slate-600">
          <Link
            href="/"
            className="underline-offset-4 hover:text-slate-900 hover:underline"
          >
            ← Vissza a főoldalra
          </Link>
        </div>

        {/* Cím + meta infó */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            <span>Kutatási projekt</span>
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            <span>Modellkártya</span>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            JURA – Jogi Utasításokat Rendszerező Asszisztens
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Proof of Concept innovációs projekt a Magyar Agrár- és
            Élettudományi Egyetem támogatásával. A JURA egy kísérleti, GPT-5
            architektúrára épülő jogi információs asszisztens, amely
            retrieval-augmented generation (RAG) megközelítést alkalmaz a
            magyar joganyag egy kiválasztott részhalmazán.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Utolsó frissítés: {today}
          </p>
        </header>

        {/* Finanszírozás kártya */}
        <section className="mb-8 grid gap-4 md:grid-cols-[1.4fr,1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">
              Finanszírozás és projektadatok
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-slate-700">
              A JURA projekt a{" "}
              <strong>Magyar Agrár- és Élettudományi Egyetem</strong> (MATE)
              Proof of Concept innováció finanszírozási programjának
              keretében valósul meg. A kutatás célja egy olyan kísérleti jogi
              AI-asszisztens létrehozása, amely az intézmény jogi működésével
              kapcsolatos kérdésekre tud strukturált, visszakövethető módon
              válaszolni.
            </p>
            <p className="text-sm text-slate-700">
              A projekt keretében a teljes egyetemi joganyag strukturálása,
              indexelése és a RAG rendszer számára történő feldolgozása már
              megtörtént; jelenleg a frissítések automatizálása és a
              finomhangolás van fókuszban.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Projektazonosító</span>
              <span className="font-semibold text-slate-900">
                POC-2025-14
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Projektfelelős</span>
              <span className="font-semibold text-slate-900">
                Sámóczi Márió Márk
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Támogatás összege</span>
              <span className="font-semibold text-slate-900">
                1&nbsp;000&nbsp;000 Ft
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="mt-0.5 text-slate-500">Program</span>
              <span className="text-right text-slate-900">
                MATE Proof of Concept innováció finanszírozási program
              </span>
            </div>
          </div>
        </section>

        {/* Cél és felhasználási kör */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            A JURA célja és felhasználási köre
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A JURA elsődleges célja, hogy{" "}
            <strong>jogi információs eszközként</strong> támogassa az
            egyetemi joganyag értelmezését: segítse az egyes szakaszok,
            jogintézmények és belső szabályzatok közötti eligazodást, valamint
            gyorsítsa a tájékozódást.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A rendszer <strong>nem minősül jogi tanácsadásnak</strong>, és
            nem hoz létre ügyvéd–ügyfél viszonyt. Kifejezetten{" "}
            <strong>oktatási, kutatási és tájékoztató</strong> céllal működik,
            és nem helyettesíti hivatásos jogász szakmai véleményét vagy
            képviseletét.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A JURA válaszai minden esetben a jogszabályok és belső
            szabályzatok hiteles forrásból történő ellenőrzésével együtt
            értelmezendők.
          </p>
        </section>

        {/* Technikai architektúra */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Technikai működés – modellkártya
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">
            A JURA egy <strong>retrieval-augmented generation (RAG)</strong>{" "}
            rendszer, amely a klasszikus keresést és a nagy nyelvi modelleket
            (LLM) kombinálja. A háttérben egy{" "}
            <strong>OpenAI GPT-5 architektúrára épülő nagy nyelvi modell</strong>{" "}
            dolgozik, amelyet speciális jogi prompt-technikákkal és
            korlátozásokkal használunk.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-900">
                Fő komponensek
              </h3>
              <ul className="space-y-1.5 text-slate-700">
                <li>• Jogszabály- és szabályzat-korpuszt feldolgozó ETL-pipeline</li>
                <li>• Embedding modell és vektortár (szakasz- és chunk-szintű indexelés)</li>
                <li>• Re-ranker / cross-encoder a releváns találatok újrasorrendezésére</li>
                <li>• GPT-5 alapú LLM a válaszgeneráláshoz</li>
                <li>• JURA webes felület (Next.js + serverless API)</li>
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-900">
                Válaszgenerálás folyamata
              </h3>
              <ol className="space-y-1.5 text-slate-700 list-decimal pl-5">
                <li>
                  A felhasználói kérdést embeddinggé alakítjuk, és a vektortárban
                  megkeressük a legrelevánsabb szövegrészleteket.
                </li>
                <li>
                  A találatokat re-ranker rendezi sorba, elsősorban jogi relevancia
                  és kontextus szerint.
                </li>
                <li>
                  A GPT-5 alapú modell csak ezeket a releváns részleteket kapja meg
                  háttérként, és ezek alapján fogalmaz meg összefoglaló választ.
                </li>
                <li>
                  A válaszban törekszünk a <strong>források visszautalására</strong>,
                  hogy a felhasználó az eredeti szöveget is meg tudja nézni.
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Adatforrások és adatkezelés */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Adatforrások és adatkezelés
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A rendszer elsősorban{" "}
            <strong>jogi szövegekből és belső szabályzatokból</strong> épül fel.
            Ezeket egységesítve, tisztítva és strukturálva dolgozzuk fel, majd
            szöveg-chunkokra bontjuk, amelyeket metaadatokkal látunk el
            (forrásdokumentum, szakaszszám, fejezet, bekezdés stb.).
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A jogi korpusz és a kód lokálisan és felhőalapú környezetben kerül
            tárolásra. A kutatási adatok túlnyomó része szöveges állomány
            (<code>.txt</code>, <code>.json</code>, <code>.jsonl</code>,
            illetve <code>.py</code> forráskódok), egységes fájlnév-konvencióval
            és a visszakövethetőséget biztosító metaadat-struktúrával.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A JURA nem kér és nem igényel természetes személyek azonosítására
            alkalmas adatokat a működéséhez; a felhasználókat kifejezetten
            kérjük, hogy <strong>ne osszanak meg érzékeny vagy személyes
            adatokat</strong> a rendszerrel.
          </p>
        </section>

        {/* MI alkalmazások szerepe */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Mesterséges intelligencia szerepe
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A projekt <strong>teljes mértékben MI-alapú</strong> megközelítésre
            épül: a kód egy része is MI-támogatással készült, a jogi szövegek
            chunkolását és a releváns szakaszok kiválasztását pedig több
            gépi tanulási komponens segíti (embedding modell, cross-encoder,
            LLM).
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A cél nem az, hogy a modell „döntsön” a felhasználó helyett, hanem
            hogy <strong>jogi szövegértelmezési támogatást</strong> nyújtson:
            kontextust, hivatkozásokat és magyarázatokat adjon, amelyeket
            emberi szakértő tud értékelni.
          </p>
        </section>

        {/* Projektállapot és következő lépések */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Projektállapot és következő lépések
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A projekt jelenleg egy <strong>működő, tesztelhető béta
            rendszerrel</strong> rendelkezik, amely az egyetem jogi
            működésével kapcsolatos kérdésekre ad kísérleti válaszokat. A
            joganyag strukturálása és indexelése lezárult; a Proof of Concept
            célkitűzései teljesíthetők, és további többletfejlesztések is
            reálisak.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A hátralévő szakasz kulcsfeladatai:
          </p>
          <ul className="mb-2 list-disc pl-5 text-sm text-slate-700">
            <li>
              joganyag-változások <strong>automatizált követése és
              szinkronizálása</strong> a korpusszal;
            </li>
            <li>
              a chunkolási eljárás finomítása, hogy a jogi szövegek
              szemantikailag is optimális egységekre legyenek bontva;
            </li>
            <li>
              a rendszer <strong>megbízhatóságának és UX-ének</strong> további
              javítása (pl. forráshivatkozások, magyarázó panelek);
            </li>
            <li>
              hosszabb távon: jogi nyelvezetre finomhangolt, dedikált modell
              és oltalmazható know-how kialakítása.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-slate-700">
            A projekt eredményeként létrejövő strukturált adatbázis, a
            feldolgozási pipeline és a finomhangolt modell{" "}
            <strong>szellemi tulajdonként és know-how-ként is
            oltalmazható</strong>, ami alapot adhat későbbi intézményi vagy
            piaci hasznosításnak.
          </p>
        </section>

        {/* Vissza / call to action */}
        <section className="text-center text-sm text-slate-600">
          <p className="mb-3">
            A JURA jelenleg kísérleti fázisban működik. A rendszer kipróbálásához
            térj vissza a főoldalra, és indíts új beszélgetést.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg"
          >
            Vissza a JURA főoldalára
          </Link>
        </section>
      </div>
    </main>
  );
}
