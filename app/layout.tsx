// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// --- Metadata: cím, leírás, favicon ---
export const metadata: Metadata = {
  title: "JURA – kísérleti jogi AI-asszisztens",
  description:
    "A JURA egy kísérleti mesterséges intelligencia alapú jogi információs eszköz. Segít jogszabályok és jogi szövegek értelmezésében, de nem helyettesíti az ügyvédi tanácsadást.",
  icons: {
    icon: "/favicon.png", // A favicon.png-t a /public/ mappába tedd
  },
  openGraph: {
    title: "JURA – kísérleti jogi AI-asszisztens",
    description:
      "A JURA segít eligazodni a magyar jogban – jogszabályok, kúriai döntések és jogintézmények gyors áttekintése egyetlen AI-asszisztensben.",
    url: "https://jura.hu",
    siteName: "JURA",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "JURA – kísérleti jogi AI-asszisztens",
    description:
      "Magyar jogi AI-asszisztens – segít a jogszabályok és jogesetek megértésében.",
  },
};

// --- Root layout komponens ---
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
