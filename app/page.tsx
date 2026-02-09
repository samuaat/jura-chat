// app/page.tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreamingText } from "@/components/streaming-text";

const SITE_URL = "https://jura-chat.vercel.app";
const CANONICAL = SITE_URL;

export const metadata = {
  title: "JURA – kísérleti jogi AI-asszisztens",
  description:
    "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz. Segít jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
};

const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${CANONICAL}/#home`,
  url: `${CANONICAL}/`,
  name: "JURA – kísérleti jogi AI-asszisztens",
  inLanguage: "hu-HU",
  isPartOf: {
    "@id": `${CANONICAL}/#website`,
  },
  about: {
    "@id": `${CANONICAL}/#jura`,
  },
  description:
    "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz, amely segít a magyar jogszabályok és jogi szövegek jobb megértésében, de nem helyettesíti az ügyvédi tanácsadást.",
} as const;

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_JSON_LD) }}
      />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-10 sm:pb-16 sm:pt-14 lg:gap-12 lg:pb-20 lg:pt-16">

          {/* Theme toggle - top right */}
          <div className="flex justify-end">
            <ThemeToggle />
          </div>

          {/* HERO */}
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)] lg:items-center">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 inline-flex items-center rounded-full bg-neutral-900/5 dark:bg-neutral-100/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                Kísérleti jogi AI-projekt
              </div>
              <h1 className="mb-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                JURA – kísérleti jogi AI-asszisztens
              </h1>
              <p className="mb-5 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] text-left sm:text-lg">
                A JURA Chat egy mesterséges intelligencián alapuló{" "}
                <strong className="text-[var(--foreground)]">jogi információs eszköz</strong>, amely magyar
                jogszabályok és jogi szövegek kiválasztott köre alapján segít a
                szakaszok, jogintézmények és jogesetek jobb megértésében. Célja,
                hogy gyorsabbá tegye a <strong className="text-[var(--foreground)]">tájékozódást</strong> – nem pedig
                az, hogy kiváltsa az ügyvédi tanácsadást.
              </p>

              {/* Hero cards */}
              <div className="mb-7 grid w-full gap-4 text-left text-sm text-[var(--muted-foreground)] sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Milyen témákban segít?
                  </p>
                  <ul className="mt-2 grid gap-2 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      <span>munkajogi alaphelyzetek (felmondás, munkaszerződés)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      <span>lakásbérlet, használat, közüzemi viták</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      <span>fogyasztóvédelem, online vásárlás, szavatosság</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      <span>alapvető szerződéses jogi kérdések</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-rose-100 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-900/20 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-500 dark:text-rose-400">
                    Miben nem tud segíteni?
                  </p>
                  <ul className="mt-2 grid gap-2 text-sm text-[var(--foreground)]">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </span>
                      <span>nem ad egyedi, személyre szabott jogi tanácsot</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </span>
                      <span>nem vállal jogi képviseletet bíróság vagy hatóság előtt</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </span>
                      <span>nem garantál naprakész, teljes körű joganyagismeretet</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </span>
                      <span>nem helyettesíti ügyvéd vagy más jogász ellenőrzését</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/chat"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-8 py-3 text-base font-semibold text-[var(--primary-foreground)] shadow-md transition hover:-translate-y-0.5 hover:opacity-90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  Belépés a chatbe
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-sm font-medium text-[var(--muted-foreground)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
                >
                  Hogyan működik?
                </Link>
              </div>
            </div>

            {/* Chat preview card */}
            <div className="hidden sm:block rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span className="font-medium">JURA Chat előnézet</span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Béta
                </span>
              </div>
              <div className="space-y-3 rounded-xl bg-neutral-100 dark:bg-[#131314] p-3 text-[11px] text-[var(--foreground)] border border-[var(--border)]">
                <div className="flex gap-2">
                  <div className="mt-1 h-6 w-6 flex-none rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <div>
                    <p className="text-[11px] text-[var(--foreground)] font-medium">
                      Miben tud segíteni a JURA a mai ügyemben?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="mt-1 h-6 w-6 flex-none rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-[8px]">J</div>
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--foreground)]">
                      <StreamingText
                        text="A JURA kísérleti jogi AI-asszisztens, amely segít a releváns szakaszok és jogintézmények gyors megtalálásában."
                        speed={30}
                        startDelay={500}
                      />
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      <StreamingText
                        text="Fontos: a válaszok nem minősülnek jogi tanácsadásnak, és nem helyettesítik ügyvéd véleményét."
                        speed={20}
                        startDelay={3000}
                      />
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[10px] text-[var(--muted-foreground)]">
                  Kísérleti rendszer – a megjelenített információkat mindig
                  ellenőrizd hiteles jogforrásból.
                </div>
              </div>
            </div>
          </section>

          {/* Legal disclaimer box */}
          <section className="flex justify-center">
            <div className="max-w-3xl rounded-xl border border-amber-300/80 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-5 py-4 text-sm text-amber-900 dark:text-amber-200 shadow-sm">
              <p className="mb-1 font-semibold tracking-tight">
                Fontos jogi nyilatkozat
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

          {/* Audience section */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm lg:p-6">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">
              Kinek ajánlott a JURA?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--muted-foreground)]">
              A JURA nem „automata ügyvéd", hanem egy{" "}
              <strong className="text-[var(--foreground)]">jogi információs és tanulást támogató eszköz</strong>. Olyan
              felhasználóknak készült, akik gyorsan szeretnének képet kapni egy
              jogi problémáról, majd ezt követően felelős döntést hozni – szükség
              esetén jogász bevonásával.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <AudienceCard
                label="Joghallgatók"
                description="Vizsgafelkészüléshez, szemináriumi anyagokhoz, jogesetek első átnézéséhez használható kiegészítő eszközként."
              />
              <AudienceCard
                label="Ügyvédbojtárok / gyakornokok"
                description="Segít gyorsan átfutni releváns szakaszokat, jogintézményeket és kúriai hivatkozásokat – de nem helyettesíti a tételes ellenőrzést."
              />
              <AudienceCard
                label="Laikus érdeklődők"
                description="Alapvető tájékozódásra alkalmas, hogy jobban értsd a helyzeted jogi kereteit, mielőtt szakemberhez fordulsz."
              />
            </div>
          </section>

          {/* Feature cards */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl border border-cyan-200 dark:border-cyan-800/50 bg-gradient-to-br from-cyan-50 to-white dark:from-cyan-900/20 dark:to-neutral-800 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500" />
              <h2 className="mb-4 mt-1 text-lg font-semibold tracking-tight">
                Mire használható?
              </h2>
              <div className="space-y-4">
                <Feature icon="✅" title="Érthetőbbé teszi a jogi szövegeket" text="Segít rövid, közérthető összefoglalót készíteni jogi szakaszokról és fogalmakról." />
                <Feature icon="✅" title="Releváns szakaszokat keres" text="Gyorsan megtalálja a joganyagból a témához leginkább kapcsolódó szakaszokat." />
                <Feature icon="✅" title="Oktatási célú használat" text="Joghallgatók és érdeklődők számára alkalmas tanulási és kutatási segédletként." />
                <Feature icon="✅" title="Mintaszöveg-vázlatok" text="Képes ötletszintű levél- vagy kérelemvázlatokat javasolni, de nem generál joghatályos dokumentumot." />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-white to-rose-50 dark:from-[var(--card)] dark:to-rose-900/20 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-300 via-amber-300 to-rose-400" />
              <h2 className="mb-4 mt-1 text-lg font-semibold tracking-tight">
                Mire nem használható?
              </h2>
              <div className="space-y-4">
                <Feature icon="⛔" title="Nem helyettesít ügyvédi tanácsadást" text="Nem ad személyre szabott jogi véleményt vagy konkrét ügyben végső döntéstámogatást." />
                <Feature icon="⛔" title="Nem használható peres ügyek önálló vitelére" text="Nem alkalmas arra, hogy jogi képviselet nélkül peres vagy hatósági eljárás teljes előkészítésére támaszkodj rá." />
                <Feature icon="⛔" title="Nem garantálja az aktualitást" text="A modell nem mindig veszi figyelembe a legfrissebb jogszabály-módosításokat és bírói gyakorlatot." />
                <Feature icon="⛔" title="Nem hiteles forrás" text="A válaszok nem minősülnek hivatalos jogszabály-közlésnek vagy kommentárnak, mindig ellenőrizd hiteles forrásból." />
              </div>
            </div>
          </section>

          {/* How it works */}
          <section
            id="how-it-works"
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm lg:p-6"
          >
            <h2 className="mb-3 text-xl font-semibold tracking-tight">
              Hogyan működik a JURA?
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--muted-foreground)]">
              A JURA célja, hogy lerövidítse az első tájékozódási kört: segít
              megtalálni a témádhoz kapcsolódó szakaszokat és összefüggéseket,
              majd vázlatos, érthető magyarázatot ad. A folyamat leegyszerűsítve:
            </p>

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <Step number={1} title="Leírod a helyzetet" text="Röviden összefoglalod a tényállást és a célodat (pl. felmondás jogszerűsége, online vásárlási probléma, bérleti vita)." />
              <Step number={2} title="A rendszer keres a joganyagban" text="A háttérben releváns jogszabályhelyeket és – ahol elérhető – kúriai döntéseket keres az adott problémához kapcsolódóan." />
              <Step number={3} title="Vázlatos, hivatkozásokkal ellátott válasz" text="A JURA összefoglalja a talált joganyagot, és segít megérteni a lehetséges irányokat – de a döntés előtt mindig kérj jogi szakmai ellenőrzést." />
            </div>

            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
              Technikai szempontból a JURA{" "}
              <strong className="text-[var(--foreground)]">retrieval-augmented generation (RAG)</strong> megközelítést
              használ: a kérdésedet numerikus vektorrá alakítja, egy jogi
              vektortárban keres releváns részleteket, majd egy nagy nyelvi
              modell ezek alapján fogalmazza meg a választ. Ettől függetlenül{" "}
              <strong className="text-[var(--foreground)]">tévedhet vagy pontatlan lehet</strong>, ezért a hivatkozott
              jogszabályokat és döntéseket mindig hiteles forrásból ellenőrizd.
            </p>
          </section>

          {/* Footer */}
          <section className="border-t border-[var(--border)] pt-6 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
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
                className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
              >
                Jogi nyilatkozat
              </Link>
              <span className="mx-2 text-[var(--muted-foreground)]">·</span>
              <Link
                href="/projekt"
                className="underline-offset-4 hover:text-[var(--foreground)] hover:underline"
              >
                Projekt / modellkártya
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

function Feature(props: { icon: string; title: string; text: string }) {
  const { icon, title, text } = props;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--background)] shadow-sm">
        <span aria-hidden className="text-base">
          {icon}
        </span>
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{text}</p>
      </div>
    </div>
  );
}

function AudienceCard(props: { label: string; description: string }) {
  const { label, description } = props;
  return (
    <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm shadow-sm">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{description}</p>
    </div>
  );
}

function Step(props: { number: number; title: string; text: string }) {
  const { number, title, text } = props;
  return (
    <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)]">
        {number}
      </div>
      <p className="mb-1 text-sm font-semibold">{title}</p>
      <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{text}</p>
    </div>
  );
}
