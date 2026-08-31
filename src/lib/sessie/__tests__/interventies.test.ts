import { describe, expect, it } from "vitest";
import { interventies } from "../interventies";
import { deelnemer, sessieState } from "./sessiefixture";

const ids = (state: Parameters<typeof interventies>[0], nu?: number) =>
  interventies(state, nu).map((i) => i.id);

describe("interventies", () => {
  /**
   * De belangrijkste eigenschap van deze lijst is dat hij meestal leeg is. Een paneel dat altijd
   * vol staat wordt niet gelezen, en dan is de ene keer dat het ertoe doet ook verloren.
   */
  it("zwijgt bij een verse sessie in de lobby", () => {
    expect(interventies(sessieState())).toEqual([]);
  });

  it("meldt een leeg portfolio pas in de opbrengstfase", () => {
    expect(ids(sessieState({ sessie: { fase: "prioritering" } as never }))).not.toContain(
      "leeg-portfolio",
    );
    expect(ids(sessieState({ sessie: { fase: "opbrengst" } as never }))).toContain(
      "leeg-portfolio",
    );
  });

  describe("de groep loopt uiteen", () => {
    it("zwijgt bij één afdwaler, want dat is meestal iemand die vooruitkijkt", () => {
      const state = sessieState({
        sessie: { fase: "verkennen" } as never,
        deelnemers: [
          deelnemer("Marieke", { eigen_fase: "identificatie" }),
          deelnemer("Peter"),
          deelnemer("Guido"),
        ],
      });
      expect(ids(state)).not.toContain("groep-uiteen");
    });

    it("meldt het vanaf twee, en noemt wie", () => {
      const state = sessieState({
        sessie: { fase: "verkennen" } as never,
        deelnemers: [
          deelnemer("Marieke", { eigen_fase: "identificatie" }),
          deelnemer("Peter", { eigen_fase: "waardebepaling" }),
          deelnemer("Guido"),
        ],
      });
      const gevonden = interventies(state).find((i) => i.id === "groep-uiteen");
      expect(gevonden?.urgentie).toBe("hoog");
      expect(gevonden?.signaal).toContain("Marieke");
      expect(gevonden?.signaal).toContain("Peter");
    });
  });

  describe("tijd", () => {
    const nu = new Date("2026-03-01T12:00:00Z").getTime();
    const metDeadline = (minutenGeleden: number) =>
      sessieState({
        sessie: {
          fase: "verkennen",
          fase_deadline: new Date(nu - minutenGeleden * 60000).toISOString(),
        } as never,
      });

    it("zwijgt bij een paar minuten uitloop", () => {
      expect(ids(metDeadline(2), nu)).not.toContain("over-tijd");
    });

    it("meldt uitloop, en wordt dringender naarmate het langer duurt", () => {
      expect(interventies(metDeadline(5), nu).find((i) => i.id === "over-tijd")?.urgentie).toBe(
        "midden",
      );
      expect(interventies(metDeadline(20), nu).find((i) => i.id === "over-tijd")?.urgentie).toBe(
        "hoog",
      );
    });

    it("zwijgt zolang de deadline nog niet om is", () => {
      const state = sessieState({
        sessie: {
          fase: "verkennen",
          fase_deadline: new Date(nu + 10 * 60000).toISOString(),
        } as never,
      });
      expect(ids(state, nu)).not.toContain("over-tijd");
    });
  });

  it("zet het dringendste bovenaan", () => {
    const state = sessieState({
      sessie: { fase: "opbrengst" } as never,
      bijdragen: [
        {
          id: "b1",
          sessie_id: "test",
          usecase_id: null,
          deelnemer_id: "d-marieke",
          soort: "hulpvraag",
          tekst: "Hoeveel meldingen zijn dit per jaar?",
          beantwoordt_id: null,
          opgelost: false,
          aangemaakt_op: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const lijst = interventies(state);
    expect(lijst.length).toBeGreaterThan(1);
    expect(lijst[0].urgentie).toBe("hoog");
  });

  it("geeft bij elke interventie zowel het signaal als de handeling", () => {
    const state = sessieState({ sessie: { fase: "opbrengst" } as never });
    for (const i of interventies(state)) {
      expect(i.signaal.length, `${i.id} mist een signaal`).toBeGreaterThan(10);
      expect(i.interventie.length, `${i.id} mist een handeling`).toBeGreaterThan(10);
    }
  });
});
