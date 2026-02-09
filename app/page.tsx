"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection } from "@/components/ui/hero-section";

const SITE_URL = "https://jura-chat.vercel.app";
const CANONICAL = SITE_URL;

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

      <main className="min-h-screen bg-background text-foreground overflow-x-hidden">

        {/* Top Navigation */}
        <header className="absolute top-0 right-0 p-6 z-50">
          <ThemeToggle />
        </header>

        {/* HERO SECTION */}
        <HeroSection />

        {/* FEATURES & INFO GRID */}
        <section className="py-20 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
              {/* What it helps with */}
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg">✅</span>
                  Milyen témákban segít?
                </h3>
                <ul className="space-y-4">
                  <ListItem icon="work">Munkajogi alaphelyzetek (felmondás, szerződés)</ListItem>
                  <ListItem icon="home">Lakásbérlet, használat, közüzemi viták</ListItem>
                  <ListItem icon="shop">Fogyasztóvédelem, online vásárlás, szavatosság</ListItem>
                  <ListItem icon="doc">Alapvető szerződéses jogi kérdések</ListItem>
                </ul>
              </div>

              {/* What it doesn't do */}
              <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="bg-rose-500/10 text-rose-600 p-2 rounded-lg">❌</span>
                  Miben nem tud segíteni?
                </h3>
                <ul className="space-y-4">
                  <ListItem icon="cross">Nem ad egyedi, személyre szabott jogi tanácsot</ListItem>
                  <ListItem icon="cross">Nem vállal jogi képviseletet bíróság vagy hatóság előtt</ListItem>
                  <ListItem icon="cross">Nem garantál naprakész, teljes körű joganyagismeretet</ListItem>
                  <ListItem icon="cross">Nem helyettesíti ügyvéd vagy más jogász ellenőrzését</ListItem>
                </ul>
              </div>
            </div>

            {/* Audience Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-6">Kinek készült a JURA?</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-10">
                Nem „automata ügyvéd", hanem egy <strong className="text-foreground">tanulást és kutatást támogató eszköz</strong>.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 text-left">
                <AudienceCard
                  emoji="🎓"
                  title="Joghallgatók"
                  desc="Vizsgafelkészüléshez és gyors áttekintéshez."
                />
                <AudienceCard
                  emoji="⚖️"
                  title="Gyakornokok"
                  desc="Releváns szakaszok és hivatkozások villámgyors megtalálásához."
                />
                <AudienceCard
                  emoji="👀"
                  title="Érdeklődők"
                  desc="Tájékozódásra, hogy értsd a jogi kereteket szakember felkeresése előtt."
                />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="max-w-4xl mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 p-6 text-center text-amber-900 dark:text-amber-200">
              <p className="font-semibold mb-2">⚠️ Fontos jogi nyilatkozat</p>
              <p className="text-sm opacity-90">
                A JURA Chat nem minősül jogi tanácsadásnak, és nem hoz létre ügyvéd–ügyfél viszonyt.
                Minden esetben kérd ki szakember véleményét!
              </p>
            </div>

            {/* Footer */}
            <footer className="mt-20 pt-8 text-center text-xs text-muted-foreground border-t border-border">
              <p>
                &copy; {new Date().getFullYear()} JURA – Kísérleti jogi
                AI-asszisztens. Minden jog fenntartva.
              </p>
            </footer>

          </div>
        </section>

      </main>
    </>
  );
}

function ListItem({ children, icon }: { children: React.ReactNode; icon: "work" | "home" | "shop" | "doc" | "cross" }) {
  return (
    <li className="flex items-start gap-3 text-muted-foreground">
      <div className="mt-0.5 shrink-0">
        {icon === "cross" ? (
          <div className="h-5 w-5 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </div>
        ) : (
          <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
        )}
      </div>
      <span>{children}</span>
    </li>
  );
}

function AudienceCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-background rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl mb-3">{emoji}</div>
      <h4 className="font-bold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
