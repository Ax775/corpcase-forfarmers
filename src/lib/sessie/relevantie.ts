import type { SignaalKaart } from "@/lib/content";
import type { Rol } from "@/lib/content/schemas";

/**
 * Welke signaalkaarten deze speler als eerste te zien krijgt.
 *
 * Iedereen kreeg dezelfde kaarten in dezelfde volgorde, terwijl de rol die je speelt nu juist
 * bepaalt met welke bril je kijkt. De volgorde beweegt daarom mee: met je rol, en met wat je
 * collega's al hebben aangevinkt.
 *
 * Twee dingen die deze weging bewust níét doet:
 *
 * - **Verbergen.** Elke kaart blijft bereikbaar, alleen de volgorde verandert. Een spel dat
 *   perspectieven weglaat omdat ze "niet bij je rol passen", doet precies het tegenovergestelde
 *   van wat het beoogt.
 * - **Zwijgen over zichzelf.** Elke kaart die omhoog is gezet, draagt de reden. Adaptiviteit die
 *   je niet kunt zien is niet te onderscheiden van willekeur, en aan een bestuurstafel is dat het
 *   verschil tussen een instrument en een truc.
 */

export type Relevantie = {
  score: number;
  /** Waaróm deze kaart omhoog staat — bedoeld om te tonen, niet om te loggen. */
  reden: string | null;
};

/** Wat een rol in zijn eigen vakgebieden herkent, weegt het zwaarst. */
const GEWICHT_DOMEIN = 3;
/** De signaallens waar deze rol volgens de content als eerste naar kijkt. */
const GEWICHT_LENS = 2;
/** Wat een collega al herkende, is de moeite van het bekijken waard. */
const GEWICHT_COLLEGA = 1;

export function relevantie(args: {
  signaal: SignaalKaart;
  rol?: Rol;
  /** Heeft een andere deelnemer deze kaart al aangevinkt? */
  doorCollega?: boolean;
}): Relevantie {
  const { signaal, rol, doorCollega = false } = args;

  const raaktMijnVakgebied =
    !!rol && !!signaal.domeinen?.some((d) => rol.kijkt_naar.includes(d));
  const mijnLens = !!rol && rol.lensvoorkeur === signaal.lens;

  const score =
    (raaktMijnVakgebied ? GEWICHT_DOMEIN : 0) +
    (mijnLens ? GEWICHT_LENS : 0) +
    (doorCollega ? GEWICHT_COLLEGA : 0);

  // De zwaarstwegende reden wint; twee bijschriften onder één kaart is ruis.
  const reden = raaktMijnVakgebied
    ? "past bij jouw vakgebied"
    : mijnLens
      ? "jouw invalshoek"
      : doorCollega
        ? "een collega herkent dit"
        : null;

  return { score, reden };
}

/**
 * Sorteert kaarten op relevantie, met de oorspronkelijke volgorde als tiebreak.
 *
 * Stabiel sorteren is hier geen detail: zonder dat springen kaarten met een gelijke score van plek
 * bij elke render, en dan raakt een speler kwijt waar hij was.
 */
export function opRelevantie(
  kaarten: SignaalKaart[],
  bepaal: (signaal: SignaalKaart) => Relevantie,
): { signaal: SignaalKaart; relevantie: Relevantie }[] {
  return kaarten
    .map((signaal, index) => ({ signaal, relevantie: bepaal(signaal), index }))
    .sort((a, b) => b.relevantie.score - a.relevantie.score || a.index - b.index)
    .map(({ signaal, relevantie }) => ({ signaal, relevantie }));
}
