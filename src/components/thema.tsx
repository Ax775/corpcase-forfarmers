"use client";

import type { ReactNode } from "react";
import {
  leidPaletAf,
  leidTweedePaletAf,
  paletAlsVariabelen,
  tweedePaletAlsVariabelen,
} from "@/lib/thema/kleur";

/**
 * Zet de huisstijlkleuren van een organisatie als CSS-variabelen op een wrapper.
 *
 * De Tailwind-utilities lezen die variabelen al (bg-accent wordt var(--color-accent)), dus elk
 * bestaand component beweegt mee zonder aanpassing. De varianten voor knoppen, kleine tekst en
 * donkere panelen worden hier afgeleid met een gemeten contrasttoets, zodat een huisstijlkleur
 * nooit een onleesbare interface kan opleveren.
 *
 * Een tweede huisstijlkleur is optioneel en neemt de waardekleur over. Die gaat dus niet als
 * tweede accent meedoen: het ontwerp leunt erop dat er één accent is en dat groen "waarde"
 * betekent. Zie docs/ONTWERP.md.
 */
export function Thema({
  accent,
  accentSecundair,
  children,
  className = "",
}: {
  accent: string | undefined;
  accentSecundair?: string;
  children: ReactNode;
  className?: string;
}) {
  // Zonder kleur blijft het standaardpalet uit globals.css staan.
  if (!accent) return <div className={className}>{children}</div>;

  let variabelen: Record<string, string>;
  try {
    variabelen = paletAlsVariabelen(leidPaletAf(accent));
    if (accentSecundair) {
      variabelen = { ...variabelen, ...tweedePaletAlsVariabelen(leidTweedePaletAf(accentSecundair)) };
    }
  } catch {
    // Een onleesbare kleurcode in de content mag geen wit scherm opleveren.
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className} style={variabelen as React.CSSProperties}>
      {children}
    </div>
  );
}
