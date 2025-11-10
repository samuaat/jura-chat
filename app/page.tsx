// app/page.tsx
import Link from "next/link";

export const metadata = {
  title: "JURA – kísérleti jogi AI-asszisztens",
  description:
    "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz. Segít jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:gap-12 lg:pb-20 lg:pt-16">
        {/* HERO BLOKK – középre igazított cím + gomb, balra zárt bekezdés */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)] lg:items-center">
          {/* Szöveg + gombok */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
              Kísérleti jogi AI-projekt
            </div>
            <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              JURA – kísérleti jogi AI-asszisztens
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-700 text-left sm:text-lg">
              A JURA Chat egy mesterséges intelligencián alapuló{" "}
              <strong>jogi információs eszköz</strong>, amely magyar jogszabályok
              és jogi szövegek kiválasztott köre alapján segít a szakaszok,
              jogintézmények és jogesetek jobb megértésében. Célja, hogy
              gyorsabbá tegye a <strong>tájékozódást</strong> – nem pedig az,
              hogy kiváltsa az ügyvédi tanácsadást.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100"
              >
                <span className="mr-2" aria-hidden>
                  🚀
                </span>
                Belépés a chatbe
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
              >
                Hogyan működik?
              </Link>
            </div>
          </div>

          {/* JURA Chat előnézet – „kép” kártya */}
          <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">JURA Chat előnézet</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Béta
              </span>
            </div>
            <div className="space-y-3 rounded-xl bg-slate-950 p-3 text-[11px] text-slate-100">
              <div className="flex gap-2">
                <div className="mt-1 h-6 w-6 flex-none rounded-full bg-slate-700/80" />
                <div>
                  <p className="text-[11px] text-slate-300">
                    Miben tud segíteni a JURA a mai ügyemben?
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="mt-1 h-6 w-6 flex-none rounded-full bg-cyan-500/80" />
                <div className="space-y-1">
                  <p className="font-medium text-slate-50">
                    A JURA kísérleti jogi AI-asszisztens, amely segít a
                    releváns szakaszok és jogintézmények gyors
                    megtalálásában.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Fontos: a válaszok nem minősülnek jogi tanácsadásnak, és
                    nem helyettesítik ügyvéd véleményét.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/70 px-3 py-2 text-[10px] text-slate-300">
                ⓘ Kísérleti rendszer – a megjelenített információkat mindig
                ellenőrizd hiteles jogforrásból.
              </div>
            </div>
          </div>
        </section>

        {/* Figyelmeztető box */}
        <section className="flex justify-center">
          <div className="max-w-3xl rounded-xl border border-amber-300/80 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm">
            <p className="mb-1 font-semibold tracking-tight">
              ⚖️ Fontos jogi nyilatkozat
            </p>
            <p className="leading-relaxed">
              A JURA Chat <strong>nem minősül jogi tanácsadásnak</strong>, és{" "}
              <strong>nem hoz létre ügyvéd–ügyfél viszonyt</strong>. A válaszok
              pontossága, teljessége és naprakészsége nem garantált. Konkrét
              ügyben minden esetben kérd ki ügyvéd vagy más jogi szakember
              véleményét, és a rendszerből kapott információkat ennek
              megfelelően ellenőrizd.
            </p>
          </div>
        </section>

        {/* KÁRTYÁK – ikonos, kreatívabb design */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Használható */}
          <div className="relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500" />
            <h2 className="mb-4 mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Mire használható?
            </h2>

            <div className="space-y-4">
              <Feature
                icon="✅"
                title="Érthetőbbé teszi a jogi szövegeket"
                text="Segít rövid, közérthető összefoglalót készíteni jogi szakaszokról és fogalmakról."
              />
              <Feature
                icon="✅"
                title="Releváns szakaszokat keres"
                text="Gyorsan megtalálja a joganyagból a témához leginkább kapcsolódó szakaszokat."
              />
              <Feature
                icon="✅"
                title="Oktatási célú használat"
                text="Joghallgatók és érdeklődők számára alkalmas tanulási és kutatási segédletként."
              />
              <Feature
                icon="✅"
                title="Mintaszöveg-vázlatok"
                text="Képes ötletszintű levél vagy kérelem mintákat javasolni, de nem generál joghatályos dokumentumot."
              />
            </div>
          </div>

          {/* Nem használható */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-rose-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-300 via-amber-300 to-rose-400" />
            <h2 className="mb-4 mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Mire nem használható?
            </h2>

            <div className="space-y-4">
              <Feature
                icon="⛔"
                title="Nem helyettesít ügyvédi tanácsadást"
                text="Nem ad személyre szabott jogi véleményt vagy konkrét ügyben döntéstámogatást."
              />
              <Feature
                icon="⛔"
                title="Nem használható peres ügyekhez"
                text="Nem alkalmazható hatósági vagy bírósági eljárás előkészítésére jogi képviselet nélkül."
              />
              <Feature
                icon="⛔"
                title="Nem garantálja az aktualitást"
                text="A modell nem mindig veszi figyelembe a legfrissebb jogszabályi módosításokat."
              />
              <Feature
                icon="⛔"
                title="Nem hiteles forrás"
                text="A válaszok nem minősülnek hivatalos jogszabály-közlésnek vagy kommentárnak."
              />
            </div>
          </div>
        </section>

        {/* Hogyan működik */}
        <section
          id="how-it-works"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6"
        >
          <h2 className="mb-3 text-xl font-semibold tracking-tight">
            Hogyan működik a rendszer?
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">
            A JURA Chat úgynevezett{" "}
            <strong>retrieval-augmented generation (RAG)</strong> megközelítést
            használ. Ez röviden azt jelenti, hogy:
          </p>
          <ol className="mb-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            <li>
              A kérdésedet a rendszer numerikus vektorrá alakítja (embedding),
              és egy jogi szövegekből felépített{" "}
              <strong>vektortárban keres</strong> releváns részleteket.
            </li>
            <li>
              Ezeket a releváns szövegrészleteket egy{" "}
              <strong>nagy nyelvi modell</strong> (LLM) kapja meg háttérként.
            </li>
            <li>
              A modell a talált joganyag alapján fogalmazza meg a választ, de
              ettől függetlenül <strong>tévedhet vagy pontatlan lehet</strong>.
            </li>
          </ol>
          <p className="text-sm leading-relaxed text-slate-700">
            A rendszer jelenleg <strong>kísérleti fázisban</strong> működik,
            oktatási és kutatási céllal. A válaszok nem helyettesítik a
            hivatásos jogász által végzett ellenőrzést, és minden esetben
            javasolt a hivatkozott jogszabályok hiteles forrásból történő
            megtekintése.
          </p>
        </section>

        {/* Footer – középre igazítva, jogi nyilatkozat linkkel */}
        <section className="border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-500">
          <p className="mb-1">
            © {new Date().getFullYear()} JURA – Kísérleti jogi AI-asszisztens
          </p>
          <p className="mb-1">
            A szolgáltatás használata a felelősségkizáró nyilatkozat
            elfogadását jelenti.
          </p>
          <p>
            <Link
              href="/jogi-nyilatkozat"
              className="underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Jogi nyilatkozat megtekintése →
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

/**
 * Egyszerű Feature komponens – emoji alapú ikonokkal.
 */
function Feature(props: { icon: string; title: string; text: string }) {
  const { icon, title, text } = props;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/80 shadow-sm">
        <span aria-hidden className="text-base">
          {icon}
        </span>
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-700">{text}</p>
      </div>
    </div>
  );
}
