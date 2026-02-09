"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection } from "@/components/ui/hero-section";
import Features from "@/components/ui/features";

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

      <main className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden selection:bg-blue-500/30">

        {/* Top Navigation */}
        <header className="absolute top-0 right-0 p-6 z-50">
          <ThemeToggle />
        </header>

        {/* HERO SECTION - Vibrant & Animated */}
        <HeroSection />

        {/* FEATURES GRID - Glassmorphism Cards */}
        <div id="features">
          <Features />
        </div>

        {/* Footer */}
        <footer className="py-12 px-6 text-center text-xs text-gray-600 border-t border-gray-900 bg-gray-950">
          <p>
            &copy; {new Date().getFullYear()} JURA – Kísérleti jogi
            AI-asszisztens. Minden jog fenntartva.
          </p>
        </footer>

      </main>
    </>
  );
}
