import { budgetStand, portfolio } from "./afgeleid";
import { profielVoorOrganisatie, usecase as bibliotheekKaart } from "@/lib/content";
import type { Realiteitscheck } from "@/lib/content/schemas";
import type { SessieState } from "@/lib/supabase/types";

/**
 * Welke realiteitschecks dit team te zien krijgt.
 *
 * Ze werden pseudo-willekeurig gekozen op de sessie-id. Dat is eerlijk maar doof: een team dat
 * drie on-farm-datacases in het portfolio zet, kreeg net zo vaak "het budget wordt gehalveerd"
 * als "de boeren willen hun data niet delen". De tweede is voor dát team de check die ertoe doet.
 *
 * Nu zegt elke check zelf wanneer hij het hardst binnenkomt (`scherp_bij` in de content), en
 * kiest de selectie wat het portfolio raakt. Twee regels houden het eerlijk:
 *
 * - **Eenmaal besloten blijft staan.** Een check waar al een besluit over is vastgelegd verdwijnt
 *   niet meer, ook niet als het portfolio verandert. Anders schuift de grond onder een gesprek dat
 *   al gevoerd is.
 * - **Deterministisch.** Bij een gelijke stand krijgt iedereen aan tafel dezelfde set, want de
 *   uitkomst volgt uit de state en nergens anders uit. Gelijke scores worden gebroken op zwaarte
 *   en dan op id.
 */

export type GekozenCheck = {
  check: Realiteitscheck;
  /** Waarom deze check getrokken is; null als hij op zwaarte is aangevuld. */
  reden: string | null;
};

function beoordeel(
  check: Realiteitscheck,
  raakteDomeinen: Set<string>,
  domeinNaam: (id: string) => string,
  budgetPct: number,
  volwassenheden: Set<string>,
): { score: number; reden: string | null } {
  const s = check.scherp_bij;
  if (!s) return { score: 0, reden: null };

  const geraakt = (s.domeinen ?? []).filter((d) => raakteDomeinen.has(d));
  const budgetRaak = s.budget_boven_pct !== undefined && budgetPct >= s.budget_boven_pct;
  const volwassenheidRaak = s.volwassenheid !== undefined && volwassenheden.has(s.volwassenheid);

  const score = geraakt.length * 2 + (budgetRaak ? 3 : 0) + (volwassenheidRaak ? 1 : 0);
  if (score === 0) return { score: 0, reden: null };

  const reden = budgetRaak
    ? `${Math.round(budgetPct)}% van de investeringsruimte is al vergeven.`
    : geraakt.length > 0
      ? `Het portfolio raakt ${geraakt.map(domeinNaam).join(" en ")}.`
      : `Er zitten ${s.volwassenheid === "bewezen" ? "bewezen" : s.volwassenheid + "e"} toepassingen in het portfolio — die kan een ander ook.`;

  return { score, reden };
}

export function kiesRealiteitschecks(state: SessieState, aantal: number): GekozenCheck[] {
  const profiel = profielVoorOrganisatie(state.sessie.organisatie_id);
  const alle = profiel.realiteitschecks.checks;
  if (aantal <= 0 || alle.length === 0) return [];

  const inPortfolio = portfolio(state);
  const raakteDomeinen = new Set(inPortfolio.map((b) => b.usecase.domein));
  const volwassenheden = new Set(
    inPortfolio.flatMap((b) => {
      const kaart = b.usecase.bibliotheek_id
        ? bibliotheekKaart(state.sessie.organisatie_id, b.usecase.bibliotheek_id)
        : undefined;
      return kaart ? [kaart.volwassenheid] : [];
    }),
  );
  const stand = budgetStand(state);
  const budgetPct =
    state.sessie.budget_geld > 0 ? (stand.besteed.geld_eur / state.sessie.budget_geld) * 100 : 0;
  const domeinNaam = (id: string) =>
    profiel.domeinen.domeinen.find((d) => d.id === id)?.naam.toLowerCase() ?? id;

  const besloten = new Set(state.besluiten.map((b) => b.check_id));

  const beoordeeld = alle
    .map((check, index) => ({
      check,
      index,
      besloten: besloten.has(check.id),
      ...beoordeel(check, raakteDomeinen, domeinNaam, budgetPct, volwassenheden),
    }))
    .sort(
      (a, b) =>
        Number(b.besloten) - Number(a.besloten) ||
        b.score - a.score ||
        b.check.zwaarte - a.check.zwaarte ||
        a.check.id.localeCompare(b.check.id),
    );

  // Besloten checks tellen mee in het aantal, maar vallen er nooit buiten.
  const vast = beoordeeld.filter((b) => b.besloten);
  const rest = beoordeeld.filter((b) => !b.besloten).slice(0, Math.max(0, aantal - vast.length));

  return [...vast, ...rest].map(({ check, reden }) => ({ check, reden }));
}
