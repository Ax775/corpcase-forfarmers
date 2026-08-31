import {
  aanwezig,
  alleBeelden,
  budgetStand,
  dekking,
  eigenFase,
  portfolio,
} from "./afgeleid";
import { klantlensVoorOrganisatie, profielVoorOrganisatie, speelmodus } from "@/lib/content";
import { telwoord } from "@/lib/tekst/meervoud";
import type { SessieState } from "@/lib/supabase/types";

/**
 * Wat de facilitator nú zou moeten doen, afgeleid uit de stand van de sessie.
 *
 * Het beheerscherm liet al zien wát er hapert, maar niet wat je eraan doet. Dat verschil is het
 * hele punt: een facilitator die voor het eerst met dit instrument werkt, ziet "3 van de 6
 * klanttypen komen nergens terug" en weet niet of dat erg is. Elke interventie hieronder heeft
 * daarom twee delen: het **signaal** (wat de app feitelijk ziet, zonder oordeel) en de
 * **interventie** (één concrete zin die je aan tafel kunt uitspreken).
 *
 * Drie ontwerpregels:
 *
 * 1. **Alleen waarnemingen, geen gissingen.** Elke regel hieronder steunt op iets dat in de
 *    sessiestate staat. Niets wordt afgeleid uit hoe het "waarschijnlijk" gaat.
 * 2. **Stil zijn is de norm.** Een lijst die altijd vol staat, wordt niet gelezen. Elke regel
 *    heeft een drempel waaronder hij zwijgt, en de meeste gelden maar in één of twee fases.
 * 3. **De facilitator beslist.** Een interventie is een suggestie met een reden erbij, nooit een
 *    opdracht. Vandaar dat het signaal er altijd bij staat: wie het er niet mee eens is, ziet
 *    meteen waarop het gebaseerd was.
 */

export type Urgentie = "hoog" | "midden" | "laag";

export type Interventie = {
  id: string;
  urgentie: Urgentie;
  /** Wat de app feitelijk waarneemt. Geen oordeel. */
  signaal: string;
  /** Eén concrete handeling of vraag voor aan tafel. */
  interventie: string;
};

const RANG: Record<Urgentie, number> = { hoog: 0, midden: 1, laag: 2 };

/** Hoeveel minuten je over de tijd bent; null als er geen deadline loopt of hij nog niet om is. */
function minutenOverTijd(state: SessieState, nu: number): number | null {
  if (!state.sessie.fase_deadline) return null;
  const verschil = nu - new Date(state.sessie.fase_deadline).getTime();
  if (!Number.isFinite(verschil) || verschil <= 0) return null;
  return Math.floor(verschil / 60000);
}

export function interventies(state: SessieState, nu = Date.now()): Interventie[] {
  const fase = state.sessie.fase;
  const beelden = alleBeelden(state);
  const inPortfolio = portfolio(state);
  const gedekt = dekking(state);
  const profiel = profielVoorOrganisatie(state.sessie.organisatie_id);
  const lens = klantlensVoorOrganisatie(state.sessie.organisatie_id);
  const modus = speelmodus(state.sessie.speelmodus);
  const gevonden: Interventie[] = [];

  const zeg = (i: Interventie) => gevonden.push(i);

  // --- Tijd -----------------------------------------------------------------
  // De speelmodi zetten per fase een timer, en die deadline werd tot nu toe wel bijgehouden maar
  // nergens getoond. Uitlopen is juist het signaal waar een facilitator het meest aan heeft.
  const overTijd = minutenOverTijd(state, nu);
  if (overTijd !== null && overTijd >= 3) {
    zeg({
      id: "over-tijd",
      urgentie: overTijd >= 10 ? "hoog" : "midden",
      signaal: `Deze fase loopt ${telwoord(overTijd, "minuut", "minuten")} uit op de geplande tijd.`,
      interventie:
        "Benoem het hardop en maak een keuze: doorgaan en later inkorten, of nu afronden met wat er ligt.",
    });
  }

  // --- De groep loopt uiteen -----------------------------------------------
  const elders = state.deelnemers.filter((d) => eigenFase(d, state) !== fase);
  if (elders.length >= 2) {
    zeg({
      id: "groep-uiteen",
      urgentie: "hoog",
      signaal: `${telwoord(elders.length, "deelnemer kijkt", "deelnemers kijken")} naar een andere fase dan de groep: ${elders
        .map((d) => d.naam)
        .join(", ")}.`,
      interventie: "Roep ze terug bij de groep voordat je de volgende fase opent.",
    });
  }

  const weg = state.deelnemers.length - aanwezig(state, nu).length;
  if (weg >= 2 && state.deelnemers.length >= 3) {
    zeg({
      id: "stil",
      urgentie: "midden",
      signaal: `${telwoord(weg, "deelnemer is", "deelnemers zijn")} al een paar minuten stil.`,
      interventie: "Vraag iemand bij naam om zijn kaart toe te lichten; dat haalt de groep terug.",
    });
  }

  // --- Eén persoon draagt de sessie ----------------------------------------
  if (state.deelnemers.length >= 3 && state.usecases.length >= 3) {
    const perEigenaar = new Map<string, number>();
    for (const u of state.usecases) {
      if (!u.eigenaar_id) continue;
      perEigenaar.set(u.eigenaar_id, (perEigenaar.get(u.eigenaar_id) ?? 0) + 1);
    }
    const grootste = [...perEigenaar.entries()].sort((a, b) => b[1] - a[1])[0];
    if (grootste && grootste[1] / state.usecases.length > 0.6) {
      const naam = state.deelnemers.find((d) => d.id === grootste[0])?.naam ?? "één deelnemer";
      zeg({
        id: "eenling",
        urgentie: "midden",
        signaal: `${grootste[1]} van de ${state.usecases.length} use cases komen van ${naam}.`,
        interventie:
          "Vraag de anderen expliciet om een kaart. Een sessie die op één persoon leunt, levert zijn portfolio op, niet dat van het team.",
      });
    }
  }

  // --- Openstaande hulpvragen ----------------------------------------------
  const open = state.bijdragen.filter((b) => b.soort === "hulpvraag" && !b.opgelost);
  if (open.length > 0) {
    zeg({
      id: "hulpvragen",
      urgentie: open.length >= 3 ? "midden" : "laag",
      signaal: `${telwoord(open.length, "hulpvraag staat", "hulpvragen staan")} nog open.`,
      interventie:
        "Lees er één hardop voor. Meestal weet iemand aan tafel het antwoord binnen dertig seconden.",
    });
  }

  // --- Breedte van het gesprek ---------------------------------------------
  if (fase === "identificatie" || fase === "waardebepaling") {
    const totaal = profiel.domeinen.domeinen.length;
    if (gedekt.domeinenGedekt.length > 0 && gedekt.domeinenGedekt.length <= Math.ceil(totaal / 4)) {
      const gemist = gedekt.domeinenOngedekt
        .map((id) => profiel.domeinen.domeinen.find((d) => d.id === id)?.naam)
        .filter(Boolean)
        .slice(0, 3);
      zeg({
        id: "smal-gesprek",
        urgentie: "midden",
        signaal: `Het gesprek raakt ${gedekt.domeinenGedekt.length} van de ${totaal} ${profiel.sector.domeinmodel.naam}.`,
        interventie: `Laat de domein-lens openslaan en vraag wat er zou spelen bij ${gemist.join(", ")}.`,
      });
    }

    if (gedekt.personasGemist.length > 0 && gedekt.personasGeraakt.length > 0) {
      zeg({
        id: "klanttypen-gemist",
        urgentie: "laag",
        signaal: `${gedekt.personasGemist.length} van de ${
          gedekt.personasGemist.length + gedekt.personasGeraakt.length
        } ${lens.meervoud} komen nergens terug.`,
        interventie: `Vraag wie er namens ${
          lens.enkelvoud.toLowerCase() === "veehouder" ? "die boer" : "die klant"
        } aan tafel zit.`,
      });
    }
  }

  // --- Doorrekenen ----------------------------------------------------------
  if (fase === "waardebepaling") {
    const doorgerekend = beelden.filter((b) => b.businessCase?.volledig).length;
    if (doorgerekend < modus.businesscase_verplicht_aantal) {
      const tekort = modus.businesscase_verplicht_aantal - doorgerekend;
      zeg({
        id: "niet-doorgerekend",
        urgentie: doorgerekend === 0 ? "hoog" : "midden",
        signaal: `${doorgerekend} van de ${modus.businesscase_verplicht_aantal} verplichte doorrekeningen ${
          doorgerekend === 1 ? "is" : "zijn"
        } compleet.`,
        interventie:
          doorgerekend === 0
            ? "Kies samen één use case en reken hem hardop door. Zodra er een bedrag met een bandbreedte staat, komt het gesprek over aannames vanzelf."
            : `Wijs ${telwoord(tekort, "use case", "use cases")} aan en verdeel ze over de tafel.`,
      });
    }

    const onvolledig = beelden.filter((b) => b.businessCase && !b.businessCase.volledig);
    if (onvolledig.length >= 2) {
      zeg({
        id: "half-ingevuld",
        urgentie: "laag",
        signaal: `${telwoord(onvolledig.length, "doorrekening mist", "doorrekeningen missen")} nog velden.`,
        interventie:
          "Laat zien dat een ontbrekend veld geen nul oplevert maar 'onbekend'. Dat is precies het gesprek dat je wilt.",
      });
    }
  }

  // --- Prioritering ---------------------------------------------------------
  if (fase === "prioritering" || fase === "roadmap") {
    const stand = budgetStand(state);
    if (stand.overschreden.geld || stand.overschreden.capaciteit) {
      zeg({
        id: "budget-over",
        urgentie: "hoog",
        signaal: `De investeringsruimte is overschreden${
          stand.overschreden.capaciteit ? " en de verandercapaciteit ook" : ""
        }.`,
        interventie:
          "Corrigeer het niet zelf. Vraag wat er dan afvalt — daar zit het gesprek dat je wilde voeren.",
      });
    }
  }

  if (fase === "prioritering" && modus.aantal_realiteitschecks > 0 && state.besluiten.length === 0) {
    zeg({
      id: "geen-realiteitscheck",
      urgentie: "midden",
      signaal: "Er is nog geen realiteitscheck besloten.",
      interventie:
        "Trek er één en dwing een besluit af: aanpassen of onderbouwd handhaven. Niet beslissen is de enige verkeerde uitkomst.",
    });
  }

  // --- Roadmap --------------------------------------------------------------
  if (fase === "roadmap" && inPortfolio.length > 0) {
    const opRoadmap = new Set(state.roadmap.map((r) => r.usecase_id));
    const zonder = inPortfolio.filter((b) => !opRoadmap.has(b.usecase.id));
    if (zonder.length > 0) {
      zeg({
        id: "roadmap-onvolledig",
        urgentie: state.roadmap.length === 0 ? "hoog" : "midden",
        signaal: `${telwoord(zonder.length, "use case uit het portfolio staat", "use cases uit het portfolio staan")} nog niet op de roadmap.`,
        interventie:
          "Vraag per use case wanneer hij zou starten. Wat nergens past, hoort misschien niet in het portfolio.",
      });
    }

    if (state.roadmap.length > 0 && !state.roadmap.some((r) => r.horizon === "nu")) {
      zeg({
        id: "niets-nu",
        urgentie: "midden",
        signaal: "Er staat niets in de eerste horizon.",
        interventie:
          "Vraag wat er binnen zes maanden echt kan landen. Een roadmap die pas over een jaar begint, begint meestal niet.",
      });
    }
  }

  // --- Opbrengst ------------------------------------------------------------
  if (fase === "opbrengst" && inPortfolio.length === 0) {
    zeg({
      id: "leeg-portfolio",
      urgentie: "hoog",
      signaal: "Er staat niets in het portfolio.",
      interventie:
        "Ga terug naar de prioritering. Zonder portfolio heeft de onthulling van de rolopdrachten geen inhoud.",
    });
  }

  return gevonden.sort((a, b) => RANG[a.urgentie] - RANG[b.urgentie]);
}
