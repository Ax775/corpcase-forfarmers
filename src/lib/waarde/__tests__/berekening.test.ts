import { describe, expect, it } from "vitest";
import {
  bandbreedte,
  bepaalKwadrant,
  bepaalPositie,
  berekenBudgetStand,
  berekenBusinessCase,
  berekenDriver,
  gemiddeldeScore,
  STANDAARD_BANDBREEDTE_PCT,
} from "../berekening";
import { berekeningenVoorSector, waardemodelVoorSector } from "@/lib/content";

/**
 * De rekenregels komen uit het sectorprofiel: de `formule` in drivers.json wordt uitgerekend, niet
 * nagebouwd in TypeScript. Elke verwachte uitkomst hieronder is met de hand nagerekend, zodat deze
 * tests de formules toetsen en niet alleen zichzelf.
 */
const SECTOR = "diervoeding";
const rekenregels = berekeningenVoorSector(SECTOR);
const waardeModel = waardemodelVoorSector(SECTOR);

describe("berekenDriver", () => {
  it("rekent een tijdsbesparing door", () => {
    // 10.000 keer per jaar, 6 minuten, 25% reductie, 60 euro per uur
    // = 10000 * 0,1 uur * 0,25 * 60 = 15.000 euro
    const uitkomst = berekenDriver({
      type: "tijdsbesparing",
      waarden: { volume_per_jaar: 10000, minuten_per_geval: 6, reductie_pct: 25, uurtarief: 60 },
    }, rekenregels);
    expect(uitkomst.status).toBe("berekend");
    if (uitkomst.status === "berekend") expect(uitkomst.jaarlijkse_baat).toBeCloseTo(15000);
  });

  it("rekent formuleringsmarge door — de grootste knop bij miljoenen tonnen", () => {
    // 10,6 mln ton * 40% van het volume * € 0,60 per ton = € 2.544.000
    const uitkomst = berekenDriver({
      type: "formuleringsmarge",
      waarden: { volume_ton: 10600000, aandeel_volume_pct: 40, besparing_per_ton: 0.6 },
    }, rekenregels);
    expect(uitkomst.status).toBe("berekend");
    if (uitkomst.status === "berekend") expect(uitkomst.jaarlijkse_baat).toBeCloseTo(2544000);
  });

  it("rekent transportbesparing door", () => {
    // 380.000 ritten * € 250 * 6% = € 5.700.000
    const uitkomst = berekenDriver({
      type: "transportbesparing",
      waarden: { ritten_per_jaar: 380000, kosten_per_rit: 250, reductie_pct: 6 },
    }, rekenregels);
    expect(uitkomst.status).toBe("berekend");
    if (uitkomst.status === "berekend") expect(uitkomst.jaarlijkse_baat).toBeCloseTo(5700000);
  });

  it("rekent afkeurreductie door, met vier velden en twee percentages", () => {
    // 10,6 mln ton * 0,5% afkeur * € 180 per ton * 15% voorkomen = € 1.431.000
    const uitkomst = berekenDriver({
      type: "afkeur_reductie",
      waarden: { productie_ton: 10600000, afkeur_pct: 0.5, kosten_per_ton: 180, reductie_pct: 15 },
    }, rekenregels);
    expect(uitkomst.status).toBe("berekend");
    if (uitkomst.status === "berekend") expect(uitkomst.jaarlijkse_baat).toBeCloseTo(1431000);
  });

  it("rekent volumebehoud door op marge, niet op omzet", () => {
    // 900 klanten * 372 ton * € 58 marge * 12% behoud = € 2.330.208
    const uitkomst = berekenDriver({
      type: "volumebehoud",
      waarden: {
        klanten_met_verloopsignaal: 900,
        volume_per_klant_ton: 372,
        marge_per_ton: 58,
        behoud_pct: 12,
      },
    }, rekenregels);
    expect(uitkomst.status).toBe("berekend");
    if (uitkomst.status === "berekend") expect(uitkomst.jaarlijkse_baat).toBeCloseTo(2330208);
  });

  it("meldt een ontbrekend veld in plaats van er nul van te maken", () => {
    const uitkomst = berekenDriver({
      type: "tijdsbesparing",
      waarden: { volume_per_jaar: 10000, minuten_per_geval: 6, reductie_pct: null, uurtarief: 60 },
    }, rekenregels);
    expect(uitkomst.status).toBe("onbekend");
    if (uitkomst.status === "onbekend") expect(uitkomst.ontbrekende_velden).toEqual(["reductie_pct"]);
  });

  it("behandelt NaN en Infinity als ontbrekend", () => {
    const uitkomst = berekenDriver({
      type: "extra_opbrengst",
      waarden: { extra_volume_ton: Number.NaN, marge_per_ton: Number.POSITIVE_INFINITY },
    }, rekenregels);
    expect(uitkomst.status).toBe("onbekend");
    if (uitkomst.status === "onbekend") {
      expect(uitkomst.ontbrekende_velden).toEqual(["extra_volume_ton", "marge_per_ton"]);
    }
  });
});

describe("bandbreedte", () => {
  it("houdt laag onder verwacht onder hoog", () => {
    const band = bandbreedte(100000);
    expect(band.laag).toBeLessThan(band.verwacht);
    expect(band.verwacht).toBeLessThan(band.hoog);
    expect(band.laag).toBeCloseTo(100000 * (1 - STANDAARD_BANDBREEDTE_PCT / 100));
    expect(band.hoog).toBeCloseTo(100000 * (1 + STANDAARD_BANDBREEDTE_PCT / 100));
  });

  it("levert bij nul onzekerheid drie gelijke waarden", () => {
    const band = bandbreedte(50000, 0);
    expect(band.laag).toBe(band.verwacht);
    expect(band.hoog).toBe(band.verwacht);
  });
});

describe("berekenBusinessCase", () => {
  const kosten = { eenmalig: 100000, jaarlijks: 20000, capaciteit: 4 };

  it("telt meerdere drivers op en trekt de jaarlijkse kosten eraf", () => {
    const bc = berekenBusinessCase(
      [
        {
          type: "tijdsbesparing",
          waarden: { volume_per_jaar: 10000, minuten_per_geval: 6, reductie_pct: 25, uurtarief: 60 },
        },
        { type: "extra_opbrengst", waarden: { extra_volume_ton: 200, marge_per_ton: 50 } },
      ],
      kosten,
      rekenregels,
    );
    expect(bc.volledig).toBe(true);
    // 15.000 uit tijdsbesparing + 10.000 uit extra volume = 25.000 bruto, min 20.000 vaste kosten
    expect(bc.bruto_baat?.verwacht).toBeCloseTo(25000);
    expect(bc.netto_baat?.verwacht).toBeCloseTo(5000);
    expect(bc.netto_baat!.laag).toBeLessThan(bc.netto_baat!.verwacht);
    expect(bc.netto_baat!.verwacht).toBeLessThan(bc.netto_baat!.hoog);
  });

  it("markeert de case als onvolledig maar rekent de bruikbare drivers wel door", () => {
    const bc = berekenBusinessCase(
      [
        {
          type: "tijdsbesparing",
          waarden: { volume_per_jaar: 10000, minuten_per_geval: 6, reductie_pct: 25, uurtarief: 60 },
        },
        { type: "extra_opbrengst", waarden: { extra_volume_ton: 200 } },
      ],
      kosten,
      rekenregels,
    );
    expect(bc.volledig).toBe(false);
    expect(bc.ontbrekende_velden).toContain("extra_opbrengst.marge_per_ton");
    expect(bc.bruto_baat?.verwacht).toBeCloseTo(15000);
  });

  it("geeft geen bedrag terug als geen enkele driver compleet is", () => {
    const bc = berekenBusinessCase([{ type: "tijdsbesparing", waarden: {} }], kosten, rekenregels);
    expect(bc.bruto_baat).toBeNull();
    expect(bc.netto_baat).toBeNull();
    expect(bc.terugverdientijd_maanden).toBeNull();
  });

  it("berekent geen terugverdientijd bij een negatieve netto baat", () => {
    const bc = berekenBusinessCase(
      [{ type: "extra_opbrengst", waarden: { extra_volume_ton: 100, marge_per_ton: 50 } }],
      kosten,
      rekenregels,
    );
    expect(bc.netto_baat!.verwacht).toBeLessThan(0);
    expect(bc.terugverdientijd_maanden).toBeNull();
  });

  it("rekent de terugverdientijd in maanden", () => {
    const bc = berekenBusinessCase(
      [{ type: "extra_opbrengst", waarden: { extra_volume_ton: 2400, marge_per_ton: 50 } }],
      { eenmalig: 100000, jaarlijks: 20000, capaciteit: 2 },
      rekenregels,
    );
    // bruto 120.000, netto 100.000, eenmalig 100.000 => 12 maanden
    expect(bc.terugverdientijd_maanden).toBeCloseTo(12);
  });
});

describe("budget", () => {
  const budget = { geld_eur: 1000000, verandercapaciteit_mensmaanden: 24 };

  it("houdt besteed en resterend bij", () => {
    const stand = berekenBudgetStand(budget, [
      { usecase_id: "a", geld_eur: 300000, capaciteit_mensmaanden: 6 },
      { usecase_id: "b", geld_eur: 200000, capaciteit_mensmaanden: 4 },
    ]);
    expect(stand.besteed.geld_eur).toBe(500000);
    expect(stand.resterend.verandercapaciteit_mensmaanden).toBe(14);
    expect(stand.overschreden).toEqual({ geld: false, capaciteit: false });
  });

  it("signaleert geld en capaciteit onafhankelijk van elkaar", () => {
    const stand = berekenBudgetStand(budget, [
      { usecase_id: "a", geld_eur: 100000, capaciteit_mensmaanden: 30 },
    ]);
    expect(stand.overschreden.geld).toBe(false);
    expect(stand.overschreden.capaciteit).toBe(true);
    expect(stand.resterend.verandercapaciteit_mensmaanden).toBeLessThan(0);
  });
});

describe("positie en kwadrant", () => {
  it("plaatst een use case zonder euro's toch op de matrix via kwalitatieve waarde", () => {
    const positie = bepaalPositie({
      businessCase: null,
      hoogsteNettoBaatInSessie: null,
      kwalitatief: { klantwaarde: 5, duurzaamheid: 5, compliance: 4 },
      haalbaarheid: { databeschikbaarheid: 4, technische_complexiteit: 4 },
    });
    expect(positie).not.toBeNull();
    expect(positie!.waarde).toBeGreaterThan(3);
    expect(bepaalKwadrant(positie!)).toBe("quick-wins");
  });

  it("geeft null als er niets is ingevuld", () => {
    expect(bepaalPositie({ kwalitatief: {}, haalbaarheid: {} })).toBeNull();
  });

  it("onderscheidt de vier kwadranten", () => {
    expect(bepaalKwadrant({ waarde: 4, haalbaarheid: 4 })).toBe("quick-wins");
    expect(bepaalKwadrant({ waarde: 4, haalbaarheid: 2 })).toBe("strategisch");
    expect(bepaalKwadrant({ waarde: 2, haalbaarheid: 4 })).toBe("vulwerk");
    expect(bepaalKwadrant({ waarde: 2, haalbaarheid: 2 })).toBe("vermijden");
  });
});

describe("gemiddeldeScore", () => {
  it("negeert lege waarden in plaats van ze als nul te tellen", () => {
    expect(gemiddeldeScore({ a: 4, b: null, c: undefined, d: 2 })).toBe(3);
  });

  it("geeft null bij een leeg object", () => {
    expect(gemiddeldeScore({})).toBeNull();
  });
});

describe("de formule in de content is de implementatie", () => {
  it("elk drivertype levert een rekenregel op met precies zijn eigen velden", () => {
    for (const dt of waardeModel.drivertypes) {
      const berekening = rekenregels[dt.id];
      expect(berekening, `geen rekenregel voor ${dt.id}`).toBeDefined();
      expect(dt.velden.map((v) => v.id).sort()).toEqual([...berekening.velden].sort());
    }
  });

  it("er ontstaan geen rekenregels die de content niet kent", () => {
    const contentIds = waardeModel.drivertypes.map((d) => d.id).sort();
    expect(Object.keys(rekenregels).sort()).toEqual(contentIds);
  });

  it("de drivertypes zijn die van deze sector, niet een vaste lijst in de code", () => {
    const ids = Object.keys(rekenregels);
    expect(ids).toContain("formuleringsmarge");
    expect(ids).toContain("transportbesparing");
    // Zou een tweede sector erbij komen, dan brengt die zijn eigen lijst mee.
    expect(ids.sort()).toEqual(waardeModel.drivertypes.map((d) => d.id).sort());
  });
});
