/**
 * Kleine expressie-evaluator voor de `formule` van een drivertype.
 *
 * Waarom dit bestaat: de formules stonden twee keer opgeschreven. Eén keer als tekst in
 * `drivers.json` — die de speler op zijn scherm ziet — en één keer als TypeScript in
 * `berekening.ts`. Die twee konden uit elkaar lopen, en de code zei dat zelf ook ("bewaakt dat die
 * twee niet uit elkaar lopen"). Zolang elke sector zijn eigen drivers meebracht, betekende dat
 * bovendien dat een nieuwe sector niet zonder TypeScript kon.
 *
 * Nu is de tekst in de content de enige bron. Wat de speler leest is letterlijk wat er gerekend
 * wordt.
 *
 * Bewust géén `eval` of `new Function`: contentbestanden zijn bedoeld om door een adviseur of de
 * klant zelf bewerkt te worden, en die mogen geen code kunnen injecteren. Dit is een eigen
 * tokenizer en recursive-descent parser over een minimale grammatica — getallen, veldnamen,
 * `+ - × ÷` en haakjes. Meer niet: geen functieaanroepen, geen eigenschappen, geen machtsverheffen.
 */

export type Knoop =
  | { soort: "getal"; waarde: number }
  | { soort: "veld"; naam: string }
  | { soort: "negatie"; op: Knoop }
  | { soort: "bewerking"; operator: Operator; links: Knoop; rechts: Knoop };

export type Operator = "+" | "-" | "×" | "÷";

type Token =
  | { soort: "getal"; waarde: number; pos: number }
  | { soort: "naam"; tekst: string; pos: number }
  | { soort: "operator"; operator: Operator; pos: number }
  | { soort: "haakje"; tekst: "(" | ")"; pos: number };

/** `*` en `/` worden geaccepteerd als synoniem, zodat een formule ook op een gewoon toetsenbord te typen is. */
const OPERATORTEKENS: Record<string, Operator> = {
  "+": "+",
  "-": "-",
  "×": "×",
  "*": "×",
  "÷": "÷",
  "/": "÷",
};

export class FormuleFout extends Error {
  constructor(melding: string, readonly formule: string, readonly positie: number) {
    super(`${melding} (positie ${positie} in "${formule}")`);
    this.name = "FormuleFout";
  }
}

function tokeniseer(formule: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formule.length) {
    const teken = formule[i];

    if (/\s/.test(teken)) {
      i += 1;
      continue;
    }

    if (teken === "(" || teken === ")") {
      tokens.push({ soort: "haakje", tekst: teken, pos: i });
      i += 1;
      continue;
    }

    const operator = OPERATORTEKENS[teken];
    if (operator) {
      tokens.push({ soort: "operator", operator, pos: i });
      i += 1;
      continue;
    }

    if (/[0-9]/.test(teken)) {
      const start = i;
      while (i < formule.length && /[0-9]/.test(formule[i])) i += 1;
      if (formule[i] === "." && /[0-9]/.test(formule[i + 1] ?? "")) {
        i += 1;
        while (i < formule.length && /[0-9]/.test(formule[i])) i += 1;
      }
      tokens.push({ soort: "getal", waarde: Number(formule.slice(start, i)), pos: start });
      continue;
    }

    if (/[a-z_]/i.test(teken)) {
      const start = i;
      while (i < formule.length && /[a-z0-9_]/i.test(formule[i])) i += 1;
      tokens.push({ soort: "naam", tekst: formule.slice(start, i), pos: start });
      continue;
    }

    throw new FormuleFout(`Onbekend teken "${teken}"`, formule, i);
  }

  return tokens;
}

/**
 * Grammatica, van laag naar hoog bindend:
 *
 *   som      := product (("+" | "-") product)*
 *   product  := unair (("×" | "÷") unair)*
 *   unair    := "-"? primair
 *   primair  := getal | veldnaam | "(" som ")"
 */
function ontleed(formule: string, tokens: Token[]): Knoop {
  let index = 0;

  const huidig = () => tokens[index];
  const eindePositie = () => formule.length;

  function som(): Knoop {
    let links = product();
    for (;;) {
      const token = huidig();
      if (token?.soort !== "operator" || (token.operator !== "+" && token.operator !== "-")) {
        return links;
      }
      index += 1;
      links = { soort: "bewerking", operator: token.operator, links, rechts: product() };
    }
  }

  function product(): Knoop {
    let links = unair();
    for (;;) {
      const token = huidig();
      if (token?.soort !== "operator" || (token.operator !== "×" && token.operator !== "÷")) {
        return links;
      }
      index += 1;
      links = { soort: "bewerking", operator: token.operator, links, rechts: unair() };
    }
  }

  function unair(): Knoop {
    const token = huidig();
    if (token?.soort === "operator" && token.operator === "-") {
      index += 1;
      return { soort: "negatie", op: unair() };
    }
    return primair();
  }

  function primair(): Knoop {
    const token = huidig();
    if (!token) throw new FormuleFout("Formule eindigt onverwacht", formule, eindePositie());

    if (token.soort === "getal") {
      index += 1;
      return { soort: "getal", waarde: token.waarde };
    }

    if (token.soort === "naam") {
      index += 1;
      return { soort: "veld", naam: token.tekst };
    }

    if (token.soort === "haakje" && token.tekst === "(") {
      index += 1;
      const binnen = som();
      const sluit = huidig();
      if (sluit?.soort !== "haakje" || sluit.tekst !== ")") {
        throw new FormuleFout("Haakje niet gesloten", formule, token.pos);
      }
      index += 1;
      return binnen;
    }

    throw new FormuleFout("Hier werd een getal, veldnaam of haakje verwacht", formule, token.pos);
  }

  const boom = som();
  const rest = huidig();
  if (rest) throw new FormuleFout("Onverwacht vervolg na de formule", formule, rest.pos);
  return boom;
}

function veldenIn(knoop: Knoop, gevonden: string[] = []): string[] {
  switch (knoop.soort) {
    case "veld":
      if (!gevonden.includes(knoop.naam)) gevonden.push(knoop.naam);
      return gevonden;
    case "negatie":
      return veldenIn(knoop.op, gevonden);
    case "bewerking":
      veldenIn(knoop.links, gevonden);
      return veldenIn(knoop.rechts, gevonden);
    default:
      return gevonden;
  }
}

function rekenUit(knoop: Knoop, waarden: Record<string, number>): number {
  switch (knoop.soort) {
    case "getal":
      return knoop.waarde;
    case "veld":
      return waarden[knoop.naam];
    case "negatie":
      return -rekenUit(knoop.op, waarden);
    case "bewerking": {
      const links = rekenUit(knoop.links, waarden);
      const rechts = rekenUit(knoop.rechts, waarden);
      switch (knoop.operator) {
        case "+":
          return links + rechts;
        case "-":
          return links - rechts;
        case "×":
          return links * rechts;
        case "÷":
          return links / rechts;
      }
    }
  }
}

export type Formule = {
  /** De veldnamen die in de formule voorkomen, op volgorde van eerste verschijning. */
  velden: string[];
  /** Rekent uit met de meegegeven waarden. Alle velden moeten aanwezig en eindig zijn. */
  evalueer: (waarden: Record<string, number>) => number;
};

/**
 * Vertaalt een formuletekst naar iets uitvoerbaars. Gooit bij een onleesbare formule, zodat een
 * fout opvalt bij `npm run content:check` of bij de build — niet halverwege een sessie.
 */
export function leesFormule(formule: string): Formule {
  const boom = ontleed(formule, tokeniseer(formule));
  return {
    velden: veldenIn(boom),
    evalueer: (waarden) => rekenUit(boom, waarden),
  };
}
