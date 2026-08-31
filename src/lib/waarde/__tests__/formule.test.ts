import { describe, expect, it } from "vitest";
import { FormuleFout, leesFormule } from "../formule";

/**
 * De formules in drivers.json worden letterlijk uitgerekend. Deze tests bewaken twee dingen: dat
 * de rekenkunde klopt inclusief voorrangsregels, en dat een onleesbare formule luid omvalt in
 * plaats van stilletjes een verkeerd getal op te leveren.
 */

describe("leesFormule", () => {
  it("leest de velden in volgorde van verschijnen", () => {
    const f = leesFormule("a × (b ÷ 60) × c");
    expect(f.velden).toEqual(["a", "b", "c"]);
  });

  it("noemt een veld dat twee keer voorkomt maar één keer", () => {
    expect(leesFormule("a × b + a").velden).toEqual(["a", "b"]);
  });

  it("respecteert voorrang: keer en gedeeld door gaan vóór plus en min", () => {
    expect(leesFormule("a + b × c").evalueer({ a: 2, b: 3, c: 4 })).toBe(14);
    expect(leesFormule("(a + b) × c").evalueer({ a: 2, b: 3, c: 4 })).toBe(20);
  });

  it("accepteert ASCII-tekens als synoniem voor × en ÷", () => {
    const unicode = leesFormule("a × b ÷ c").evalueer({ a: 10, b: 6, c: 3 });
    const ascii = leesFormule("a * b / c").evalueer({ a: 10, b: 6, c: 3 });
    expect(ascii).toBe(unicode);
    expect(ascii).toBe(20);
  });

  it("rekent decimalen en een negatief teken door", () => {
    expect(leesFormule("a × 0.5").evalueer({ a: 9 })).toBe(4.5);
    expect(leesFormule("-a + b").evalueer({ a: 3, b: 10 })).toBe(7);
  });

  it("rekent de tijdsbesparingsformule uit zoals hij in de content staat", () => {
    // Dezelfde som als de oude TypeScript-implementatie: 10.000 × 0,1 uur × 0,25 × 60 = 15.000
    const f = leesFormule(
      "volume_per_jaar × (minuten_per_geval ÷ 60) × (reductie_pct ÷ 100) × uurtarief",
    );
    const uitkomst = f.evalueer({
      volume_per_jaar: 10000,
      minuten_per_geval: 6,
      reductie_pct: 25,
      uurtarief: 60,
    });
    expect(uitkomst).toBeCloseTo(15000);
  });
});

describe("leesFormule weigert wat het niet begrijpt", () => {
  it("gooit bij een niet-gesloten haakje", () => {
    expect(() => leesFormule("a × (b ÷ 60")).toThrow(FormuleFout);
  });

  it("gooit bij een onbekend teken", () => {
    expect(() => leesFormule("a ^ b")).toThrow(FormuleFout);
  });

  it("gooit bij een operator zonder rechterkant", () => {
    expect(() => leesFormule("a ×")).toThrow(FormuleFout);
  });

  it("laat geen functieaanroepen of eigenschappen toe", () => {
    // Contentbestanden worden door adviseurs bewerkt; daar hoort geen code in te kunnen sluipen.
    expect(() => leesFormule("constructor.constructor('return 1')()")).toThrow(FormuleFout);
    expect(() => leesFormule("a.b")).toThrow(FormuleFout);
  });

  it("meldt waar het misging", () => {
    try {
      leesFormule("a ^ b");
      throw new Error("had moeten gooien");
    } catch (fout) {
      expect(fout).toBeInstanceOf(FormuleFout);
      expect((fout as FormuleFout).positie).toBe(2);
      expect((fout as FormuleFout).message).toContain("a ^ b");
    }
  });
});
