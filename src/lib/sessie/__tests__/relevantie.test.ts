import { describe, expect, it } from "vitest";
import { opRelevantie, relevantie } from "../relevantie";
import { alleSignalen, organisaties, rollenVoorOrganisatie } from "@/lib/content";
import type { SignaalKaart } from "@/lib/content";

const org = organisaties[0].id;
const rollen = rollenVoorOrganisatie(org).rollen;
const signalen = alleSignalen(org);
const rol = (id: string) => rollen.find((r) => r.id === id)!;

describe("relevantie", () => {
  it("weegt een kaart uit je eigen vakgebied zwaarder dan je lensvoorkeur", () => {
    const eenRol = rol("informatiemanager");
    const uitVakgebied: SignaalKaart = {
      id: "x",
      lens: "domein",
      titel: "t",
      tekst: "t",
      domeinen: [eenRol.kijkt_naar[0]],
    };
    const uitLens: SignaalKaart = { id: "y", lens: eenRol.lensvoorkeur!, titel: "t", tekst: "t" };

    expect(relevantie({ signaal: uitVakgebied, rol: eenRol }).score).toBeGreaterThan(
      relevantie({ signaal: uitLens, rol: eenRol }).score,
    );
  });

  it("noemt altijd de zwaarstwegende reden, en maar één", () => {
    const eenRol = rol("bestuurder");
    const beide: SignaalKaart = {
      id: "x",
      lens: eenRol.lensvoorkeur!,
      titel: "t",
      tekst: "t",
      domeinen: [eenRol.kijkt_naar[0]],
    };
    expect(relevantie({ signaal: beide, rol: eenRol }).reden).toBe("past bij jouw vakgebied");
  });

  it("geeft geen reden als er niets bijzonders aan de kaart is", () => {
    const kaal: SignaalKaart = { id: "x", lens: "domein", titel: "t", tekst: "t" };
    expect(relevantie({ signaal: kaal, rol: rol("cfo") }).reden).toBeNull();
  });

  it("telt mee wat een collega al herkende", () => {
    const kaal: SignaalKaart = { id: "x", lens: "domein", titel: "t", tekst: "t" };
    expect(relevantie({ signaal: kaal, doorCollega: true }).reden).toBe(
      "een collega herkent dit",
    );
  });

  /**
   * Zonder rol — een facilitator die alleen begeleidt — mag de volgorde niet omvallen.
   */
  it("werkt zonder rol", () => {
    expect(relevantie({ signaal: signalen[0] }).score).toBe(0);
  });
});

describe("opRelevantie", () => {
  it("verliest geen enkele kaart en verbergt niets", () => {
    const gesorteerd = opRelevantie(signalen, (s) => relevantie({ signaal: s, rol: rol("cfo") }));
    expect(gesorteerd).toHaveLength(signalen.length);
    expect(new Set(gesorteerd.map((g) => g.signaal.id))).toEqual(
      new Set(signalen.map((s) => s.id)),
    );
  });

  it("houdt de oorspronkelijke volgorde aan bij een gelijke score", () => {
    const zonderVoorkeur = opRelevantie(signalen, () => ({ score: 0, reden: null }));
    expect(zonderVoorkeur.map((g) => g.signaal.id)).toEqual(signalen.map((s) => s.id));
  });

  /**
   * Elke rol hoort iets anders bovenaan te krijgen; anders is de weging er wel, maar merkt
   * niemand hem.
   */
  it("levert per rol een andere bovenste kaart op", () => {
    const bovenste = new Set(
      rollen.map(
        (r) => opRelevantie(signalen, (s) => relevantie({ signaal: s, rol: r }))[0].signaal.id,
      ),
    );
    expect(bovenste.size).toBeGreaterThan(1);
  });
});
