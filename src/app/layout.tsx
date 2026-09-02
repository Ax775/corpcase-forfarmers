import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Lexend } from "next/font/google";
import "./globals.css";

/**
 * Lexend, het lettertype dat ForFarmers zelf gebruikt — op hun site in de gewichten 300 tot 600.
 *
 * Het staat op Google Fonts, dus het kan mee via `next/font/google`: dat haalt het bij de build op
 * en serveert het vanaf het eigen domein. Er gaat dus geen bezoekersdata naar Google — voor een
 * organisatie die in deze game zelf over privacy bij klantdata praat, is dat geen detail.
 *
 * Eén familie voor alles, waar het ontwerp eerder een schreefloze en een display-serif naast
 * elkaar zette. Het onderscheid tussen kop en lopende tekst komt nu uit gewicht en letterafstand
 * in plaats van uit een tweede familie; zie `.display` en `.cijfer` in globals.css.
 */
// Geen `weight`-lijst: dan komt de variabele versie mee, één bestand voor alle gewichten in
// plaats van vijf losse. Op een telefoon in een vergaderzaal met matige wifi telt dat.
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Corpcase",
  description:
    "Serious business game voor use-case identificatie, waardebepaling, prioritering en roadmap in de diervoedersector.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2b2926",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={`h-full ${lexend.variable}`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
