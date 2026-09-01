import { describe, expect, it } from "vitest";
import {
  AA_NORMAAL,
  contrast,
  HOUTSKOOL,
  hexNaarRgb,
  hslNaarRgb,
  leidPaletAf,
  leidTweedePaletAf,
  luminantie,
  PAPIER,
  rgbNaarHex,
  rgbNaarHsl,
  WIT,
} from "../kleur";
import { organisaties } from "@/lib/content";

/**
 * Deze tests bestaan om één ding te voorkomen: dat iemand een huisstijlkleur in een
 * contentbestand zet en daarmee stilletjes een onleesbare interface oplevert.
 */

const AA = 4.5;
/** De norm voor grote tekst: vanaf 24 px gewoon, of 18,66 px vet. */
const AA_GROOT = 3;

describe("kleurconversie", () => {
  it("gaat heen en weer tussen hex en hsl zonder de kleur te verliezen", () => {
    for (const hex of ["#E8524A", "#1F4E6B", "#FFD400", "#2B2926", "#FFFFFF", "#000000"]) {
      const terug = rgbNaarHex(hslNaarRgb(rgbNaarHsl(hexNaarRgb(hex))));
      // Afronding naar hele bytes mag één stap schelen per kanaal.
      const origineel = hexNaarRgb(hex);
      const heen = hexNaarRgb(terug);
      expect(Math.abs(heen.r - origineel.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(heen.g - origineel.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(heen.b - origineel.b)).toBeLessThanOrEqual(1);
    }
  });

  it("accepteert een korte notatie en normaliseert naar hoofdletters", () => {
    expect(rgbNaarHex(hexNaarRgb("#e55"))).toBe("#EE5555");
  });

  it("weigert een ongeldige kleurcode in plaats van er iets van te maken", () => {
    expect(() => hexNaarRgb("koraal")).toThrow(/geldige kleurcode/i);
    expect(() => hexNaarRgb("#12345")).toThrow(/geldige kleurcode/i);
  });
});

describe("contrast", () => {
  it("komt uit op de bekende uitersten", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(contrast("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("maakt niet uit in welke volgorde je de kleuren geeft", () => {
    expect(contrast("#E8524A", PAPIER)).toBeCloseTo(contrast(PAPIER, "#E8524A"), 5);
  });

  it("bevestigt de waarden waarop het palet is gekozen", () => {
    // Deze twee getallen zijn de reden dat knoppen niet het felle koraal gebruiken.
    expect(contrast(WIT, "#E8524A")).toBeLessThan(AA);
    expect(contrast(WIT, "#D14038")).toBeGreaterThanOrEqual(AA);
  });
});

describe("leidPaletAf", () => {
  /**
   * Vier heel verschillende vertrekpunten: het standaard koraal, een donkerblauw, een fel geel
   * (het lastigste geval, want daar is wit erop kansloos) en een lichtgroen.
   */
  const proefkleuren = ["#E8524A", "#1F4E6B", "#FFD400", "#7ED957", "#2B2926", "#FFFFFF"];

  it.each(proefkleuren)("levert voor %s een volledig leesbaar palet", (accent) => {
    const palet = leidPaletAf(accent);

    expect(contrast(WIT, palet.accentSterk)).toBeGreaterThanOrEqual(AA);
    expect(contrast(palet.accentDiep, PAPIER)).toBeGreaterThanOrEqual(AA);
    expect(contrast(palet.accentOpDonker, HOUTSKOOL)).toBeGreaterThanOrEqual(AA);
  });

  it("laat een kleur die al voldoet ongemoeid", () => {
    // Dit donkerblauw haalt op wit ruim de norm en hoeft dus niet verdonkerd te worden.
    const palet = leidPaletAf("#1F4E6B");
    expect(palet.accentSterk).toBe("#1F4E6B");
  });

  it("verdonkert geel fors, want anders is witte knoptekst onleesbaar", () => {
    const palet = leidPaletAf("#FFD400");
    expect(luminantie(palet.accentSterk)).toBeLessThan(luminantie("#FFD400"));
    expect(contrast(WIT, palet.accentSterk)).toBeGreaterThanOrEqual(AA);
  });

  it("maakt op een donker paneel juist lichter in plaats van donkerder", () => {
    const palet = leidPaletAf("#1F4E6B");
    expect(luminantie(palet.accentOpDonker)).toBeGreaterThan(luminantie("#1F4E6B"));
  });

  it("houdt de afgeleide tinten herkenbaar als dezelfde kleur", () => {
    const palet = leidPaletAf("#E8524A");
    const tint = (hex: string) => rgbNaarHsl(hexNaarRgb(hex)).h;
    // De tint blijft binnen een paar graden; alleen de lichtheid verschuift.
    expect(Math.abs(tint(palet.accentSterk) - tint("#E8524A"))).toBeLessThan(0.02);
    expect(Math.abs(tint(palet.accentDiep) - tint("#E8524A"))).toBeLessThan(0.02);
  });
});

describe("elke organisatie in content/", () => {
  it.each(organisaties.map((o) => [o.naam, o.thema.accent] as const))(
    "%s levert een leesbaar palet op",
    (_naam, accent) => {
      const palet = leidPaletAf(accent);
      expect(contrast(WIT, palet.accentSterk)).toBeGreaterThanOrEqual(AA);
      expect(contrast(palet.accentDiep, PAPIER)).toBeGreaterThanOrEqual(AA);
      expect(contrast(palet.accentOpDonker, HOUTSKOOL)).toBeGreaterThanOrEqual(AA);
    },
  );
});

describe("de zachte tint draagt tekst", () => {
  /**
   * De zachte tint wordt per organisatie afgeleid, dus dit moet per organisatie getoetst worden
   * en niet op één vaste waarde. Op die tint valt tekst wanneer een cirkel achter een tekstblok
   * ligt; inkt-licht haalt er net niet genoeg, vandaar dat daar inkt-zacht wordt gebruikt.
   */
  it.each(organisaties.map((o) => [o.naam, o.thema.accent] as const))(
    "%s: inkt en inkt-zacht blijven leesbaar op de afgeleide tint",
    (_naam, accent) => {
      const { accentZacht } = leidPaletAf(accent);
      expect(contrast("#22201E", accentZacht)).toBeGreaterThanOrEqual(AA);
      expect(contrast("#55504A", accentZacht)).toBeGreaterThanOrEqual(AA);
    },
  );

  /**
   * Het cijfer. `Cijfer toon="accent"` zet een variant van het accent op papier, en die moet de
   * norm voor grote tekst halen (3,0) omdat het kleinste formaat 30 px is. Zakt dat formaat ooit,
   * dan valt deze test niet om; dan moet `Cijfer` naar accent-diep.
   *
   * Dit toetste eerder de rauwe accentkleur, met de redenering dat die het bij koraal net haalde
   * (3,43). Dat hield geen stand: het limegroen van ForFarmers haalt 2,09, en toen deze test
   * daarop omviel bleek dat het cijfer een eigen, bewaakte variant nodig had. Vandaar dat hier nu
   * `accentGroot` staat en niet het accent zelf — de test toetst wat er werkelijk op het scherm
   * komt.
   */
  it.each(organisaties.map((o) => [o.naam, o.thema.accent] as const))(
    "%s: het accentcijfer haalt de norm voor grote tekst op papier",
    (_naam, accent) => {
      expect(contrast(leidPaletAf(accent).accentGroot, PAPIER)).toBeGreaterThanOrEqual(AA_GROOT);
    },
  );

  /**
   * En de variant blijft zo dicht mogelijk bij de merkkleur: waar het accent de norm al haalt,
   * verandert er niets. Anders zou een donkere huisstijl onnodig verder verdiept worden.
   */
  it("laat een accent dat de norm al haalt ongemoeid", () => {
    const donker = "#00337F";
    expect(leidPaletAf(donker).accentGroot).toBe(donker);
  });

  it("het volle accent verdraagt juist géén tekst, en daarom bestaat de tint", () => {
    // Deze verwachting legt de ontwerpregel vast: geen kleine tekst op het volle koraal.
    expect(contrast(WIT, "#E8524A")).toBeLessThan(AA);
    expect(contrast("#22201E", "#E8524A")).toBeLessThan(AA);
  });
});

describe("de vaste neutralen", () => {
  it("halen allemaal de norm op de papieren ondergrond", () => {
    const neutralen = { inkt: "#22201E", "inkt-zacht": "#55504A", "inkt-licht": "#726A61" };
    for (const [naam, hex] of Object.entries(neutralen)) {
      expect(contrast(hex, PAPIER), `${naam} op papier`).toBeGreaterThanOrEqual(AA);
    }
  });

  it("laten witte tekst op het houtskoolpaneel ruim toe", () => {
    expect(contrast(WIT, HOUTSKOOL)).toBeGreaterThanOrEqual(AA);
  });

  it("houden het label op het houtskoolpaneel leesbaar", () => {
    // Deze stond op #8E877E en haalde 4,09; te licht voor de labels die het paneel draagt.
    expect(contrast("#9E968C", HOUTSKOOL)).toBeGreaterThanOrEqual(AA);
  });

  it("houden de semantische kleuren leesbaar", () => {
    for (const hex of ["#1C6B52", "#8A5A13", "#93332F"]) {
      expect(contrast(hex, PAPIER)).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe("tweede huisstijlkleur", () => {
  /**
   * De tweede kleur neemt de waardekleur over en staat dus als kleine tekst op papier. Juist een
   * felle merkkleur haalt daar niets: ForFarmers' limegroen komt op crème niet eens in de buurt.
   * Deze test bewaakt dat de afleiding hem verdiept in plaats van hem te laten staan.
   */
  it("verdiept een felle tweede kleur tot kleine tekst op papier leesbaar is", () => {
    const rauw = "#99BA16";
    expect(contrast(rauw, PAPIER)).toBeLessThan(AA_NORMAAL);

    const palet = leidTweedePaletAf(rauw);
    expect(contrast(palet.waarde, PAPIER)).toBeGreaterThanOrEqual(AA_NORMAAL);
    expect(palet.tweede).toBe(rauw);
  });

  it("houdt de tint herkenbaar bij het verdiepen", () => {
    const palet = leidTweedePaletAf("#99BA16");
    const rauweTint = rgbNaarHsl(hexNaarRgb("#99BA16")).h;
    const diepeTint = rgbNaarHsl(hexNaarRgb(palet.waarde)).h;
    // Zelfde tint op afrondingsverschillen na: het moet nog steeds hún groen zijn.
    expect(Math.abs(rauweTint - diepeTint)).toBeLessThan(0.02);
  });

  it("levert een zachte tint die donkere tekst draagt", () => {
    const palet = leidTweedePaletAf("#99BA16");
    expect(contrast("#22201E", palet.waardeZacht)).toBeGreaterThanOrEqual(AA_NORMAAL);
  });

  it("doet dat ook voor de organisaties die een tweede kleur in content hebben", () => {
    for (const org of organisaties) {
      const tweede = org.thema.accent_secundair;
      if (!tweede) continue;
      const palet = leidTweedePaletAf(tweede);
      expect(
        contrast(palet.waarde, PAPIER),
        `${org.id}: waardekleur onleesbaar op papier`,
      ).toBeGreaterThanOrEqual(AA_NORMAAL);
    }
  });
});
