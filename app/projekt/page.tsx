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
            retrieval-augmented generation (RAG) megközelítést alkalmaz a{" "}
            <strong>magyar jogszabályok és jogi szövegek kiválasztott körén</strong>.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Utolsó frissítés: {today}
          </p>
        </header>

        {/* Finanszírozás / projekt kontextus – EGYSZERŰ DOBOZ, nincs külön stats card */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            Finanszírozás és projektkörnyezet
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A JURA projekt a{" "}
            <strong>Magyar Agrár- és Élettudományi Egyetem</strong> (MATE){" "}
            Proof of Concept innovációs finanszírozási programjának
            keretében valósul meg. A támogatás célja egy olyan kísérleti
            rendszer létrehozása, amely a magyar joganyag egy kiválasztott
            részhalmazán bemutatja, hogyan lehet a modern nagy nyelvi
            modelleket jogi szövegértelmezésre és információszolgáltatásra
            használni.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A projekt fókusza <strong>nem egyetlen intézmény belső
            joganyagára</strong>, hanem a magyar jogszabályok és kapcsolódó
            jogi szövegek szélesebb körére irányul. A cél egy olyan prototípus
            megalkotása, amely később különböző intézményi és társadalmi
            felhasználási környezetekhez is adaptálható.
          </p>
        </section>

        {/* Cél és felhasználási kör */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            A JURA célja és felhasználási köre
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A JURA elsődleges célja, hogy{" "}
            <strong>jogi információs eszközként</strong> segítse a magyar
            jogszabályok, jogintézmények és alapfogalmak jobb
            megértését. A rendszer támogatja a szakaszok közötti eligazodást,
            a fogalmak tisztázását és a kapcsolódó joganyag feltárását, ezáltal
            gyorsítja a <strong>tájékozódást</strong>.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A JURA <strong>nem minősül jogi tanácsadásnak</strong>, és nem hoz
            létre ügyvéd–ügyfél viszonyt. Kifejezetten{" "}
            <strong>oktatási, kutatási és tájékoztató</strong> céllal
            működik: joghallgatók, jogi érdeklődők és a jogszabályi környezet
            iránt érdeklődő felhasználók számára nyújt támogatást.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A JURA válaszai minden esetben a jogszabályok hiteles forrásból
            történő ellenőrzésével együtt értelmezendők, a rendszer pedig nem
            helyettesíti hivatásos jogász szakmai véleményét vagy képviseletét.
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
            dolgozik, amelyet jogi domainre optimalizált prompt-technikákkal és
            korlátozásokkal használunk, különös hangsúlyt fektetve a
            forrásokra való visszautalásra és a bizonytalanság jelzésére.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-900">
                Fő komponensek
              </h3>
              <ul className="space-y-1.5 text-slate-700">
                <li>• Jogszabály- és kapcsolódó jogi szövegkorpuszt feldolgozó ETL-pipeline</li>
                <li>• Embedding modell és vektortár (szakasz- és chunk-szintű indexelés)</li>
                <li>• Re-ranker / cross-encoder a releváns találatok újrasorrendezésére</li>
                <li>• GPT-5 alapú LLM a válaszgeneráláshoz</li>
                <li>• JURA webes felület (Next.js + serverless API, chat UI)</li>
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <h3 className="mb-2 text-sm font-semibold tracking-tight text-slate-900">
                Válaszgenerálás folyamata
              </h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-slate-700">
                <li>
                  A felhasználói kérdést embeddinggé alakítjuk, és a vektortárban
                  megkeressük a legrelevánsabb jogi szövegrészleteket.
                </li>
                <li>
                  A találatokat re-ranker rendezi sorba, elsősorban jogi
                  relevancia és kontextus szerint.
                </li>
                <li>
                  A GPT-5 alapú modell csak ezeket a releváns részleteket kapja
                  meg háttérként, és ezek alapján fogalmaz meg összefoglaló,
                  magyarázó jellegű választ.
                </li>
                <li>
                  A válaszban törekszünk a <strong>források jelölésére</strong>,
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
            A rendszer alapját magyar <strong>jogszabályok, kapcsolódó
            jogi szövegek és magyarázó anyagok</strong> korpusza adja. Ezeket
            egységes formátumra hozzuk, tisztítjuk és strukturáljuk, majd
            szöveg-chunkokra bontjuk, amelyeket metaadatokkal (forrás,
            szakaszszám, fejezet, bekezdés stb.) látunk el.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A feldolgozott korpusz és a hozzá tartozó metaadatok lokális és
            felhőalapú környezetben kerülnek tárolásra. A JURA nem kér és nem
            igényel természetes személyek azonosítására alkalmas adatokat a
            működéséhez; a felhasználókat kifejezetten kérjük, hogy{" "}
            <strong>ne osszanak meg érzékeny vagy személyes adatokat</strong> a
            rendszerrel.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A rendszer használatáról anonimizált naplóadatok keletkezhetnek
            (pl. kérdések típusa, időbélyeg), amelyeket kizárólag{" "}
            <strong>kutatási és rendszerfejlesztési</strong> célból használunk
            fel.
          </p>
        </section>

        {/* MI alkalmazások szerepe */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Mesterséges intelligencia szerepe
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A projekt <strong>teljes mértékben MI-alapú</strong> megközelítésre
            épül: a jogi szövegek feldolgozását, chunkolását és a releváns
            szakaszok kiválasztását embedding modellek, re-rankerek és egy
            GPT-5 architektúrára épülő nagy nyelvi modell támogatja. A kód
            egy része is MI-asszisztált módon készült, azonban minden lépés
            emberi kontroll mellett kerül be a produkciós rendszerbe.
          </p>
          <p className="text-sm leading-relaxed text-slate-700">
            A cél nem az, hogy a modell „helyettesítse” a jogászt, hanem hogy{" "}
            <strong>jogi szövegértelmezési támogatást</strong> nyújtson:
            kontextust, hivatkozásokat és magyarázatokat adjon, amelyeket
            emberi szakértő tud értékelni és ellenőrizni.
          </p>
        </section>

        {/* Projektállapot és következő lépések */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Projektállapot és következő lépések
          </h2>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A projekt jelenleg egy <strong>működő, tesztelhető béta
            rendszerrel</strong> rendelkezik, amely a magyar jogszabályok egy
            kiválasztott részhalmazára ad kísérleti válaszokat. A korpusz
            strukturálása és indexelése elkészült; a Proof of Concept
            célkitűzései teljesíthetők, és további többletfejlesztések is
            reálisak.
          </p>
          <p className="mb-2 text-sm leading-relaxed text-slate-700">
            A hátralévő szakasz kulcsfeladatai:
          </p>
          <ul className="mb-2 list-disc pl-5 text-sm text-slate-700">
            <li>
              jogszabály-változások <strong>automatizált követése és
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
