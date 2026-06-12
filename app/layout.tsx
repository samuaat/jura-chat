// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { MaintenanceBanner } from "@/components/maintenance-banner";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://jura-chat.vercel.app";
const CANONICAL = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "JURA – kísérleti jogi AI-asszisztens",
  description:
    "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz. Segít jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "JURA – kísérleti jogi AI-asszisztens",
    description:
      "Magyar jogi AI-asszisztens – segít a jogszabályok és jogesetek megértésében.",
    siteName: "JURA",
    locale: "hu_HU",
  },
  twitter: {
    card: "summary_large_image",
    title: "JURA – kísérleti jogi AI-asszisztens",
    description:
      "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz. Segít jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
  },
};

function getGlobalJsonLd() {
  const websiteId = `${CANONICAL}/#website`;
  const appId = `${CANONICAL}/#jura`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${CANONICAL}/`,
        name: "JURA – kísérleti jogi AI-asszisztens",
        inLanguage: "hu-HU",
        description:
          "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz, amely segít a magyar jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${CANONICAL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: "JURA – kísérleti jogi AI-asszisztens",
        applicationCategory: "LegalService",
        operatingSystem: "Web",
        isAccessibleForFree: true,
        url: `${CANONICAL}/chat`,
        inLanguage: "hu-HU",
        description:
          "Magyar jogi információs eszköz, amely a jogszabályok és jogi szövegek közötti eligazodást segíti, de nem helyettesíti az ügyvédi tanácsadást.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "HUF",
        },
      },
    ],
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const globalJsonLd = getGlobalJsonLd();

  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(globalJsonLd),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
        >
          <MaintenanceBanner />
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
