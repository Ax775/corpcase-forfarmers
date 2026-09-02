import { describe, expect, it } from "vitest";
import { kiesRealiteitschecks } from "../realiteitschecks";
import { organisaties, realiteitschecksVoorOrganisatie, usecasesVoorOrganisatie } from "@/lib/content";
import { sessieState } from "./sessiefixture";
import type { SessieState, SessieUsecaseRij } from "@/lib/supabase/types";

const org = organisaties[0].id;
const alle = realiteitschecksVoorOrganisatie(org).checks;

/** Een use case in het portfolio, in een gegeven domein, eventueel uit de bibliotheek. */
function inPortfolio(id: string, domein: string, bibliotheekId: string | null = null): SessieUsecaseRij {
  return {
    id,
    sessie_id: "test",
    bibliotheek_id: bibliotheekId,
    titel: id,
    probleem: "p",
    oplossingsrichting: "o",
    domein,
    benodigde_data: ["x"],
    aandachtspunten: [],
    eigenaar_id: null,
    status: "portfolio",
    aangemaakt_op: "2026-01-01T00:00:00Z",
    bijgewerkt_op: "2026-01-01T00:00:00Z",
  };
}

const ids = (lijst: ReturnType<typeof kiesRealiteitschecks>) => lijst.map((g) => g.check.id);

describe("kiesRealiteitschecks", () => {
  it("geeft precies het gevraagde aantal, ook zonder portfolio", () => {
    expect(kiesRealiteitschecks(sessieState(), 3)).toHaveLength(3);
    expect(kiesRealiteitschecks(sessieState(), 0)).toHaveLength(0);
  });

  it("trekt de check die het portfolio raakt, met de reden erbij", () => {
    const state = sessieState({
      sessie: { fase: "prioritering" } as never,
      usecases: [inPortfolio("u1", "on-farm-data")],
    });
    const [eerste] = kiesRealiteitschecks(state, 1);
    expect(eerste.check.scherp_bij?.domeinen).toContain("on-farm-data");
    expect(eerste.reden).toMatch(/portfolio raakt/);
  });

  it("trekt de budgetcheck zodra de investeringsruimte bijna vergeven is", () => {
    const state = sessieState({
      sessie: { fase: "prioritering" } as never,
      usecases: [inPortfolio("u1", "klantcontact")],
      allocaties: [
        {
          usecase_id: "u1",
          sessie_id: "test",
          geld_eur: organisaties[0].budget_defaults.geld_eur * 0.9,
          capaciteit_mensmaanden: 1,
          bijgewerkt_op: "2026-01-01T00:00:00Z",
        },
      ],
    });
    const gekozen = kiesRealiteitschecks(state, 2);
    expect(ids(gekozen)).toContain("vrc-budget");
    expect(gekozen.find((g) => g.check.id === "vrc-budget")?.reden).toMatch(/investeringsruimte/);
  });

  it("herkent bewezen toepassingen uit de bibliotheek", () => {
    const bewezen = usecasesVoorOrganisatie(org).usecases.find((u) => u.volwassenheid === "bewezen")!;
    const state = sessieState({
      sessie: { fase: "prioritering" } as never,
      usecases: [inPortfolio("u1", bewezen.domein, bewezen.id)],
    });
    expect(ids(kiesRealiteitschecks(state, alle.length))).toContain("vrc-concurrent");
  });

  /**
   * Dit is de regel die het eerlijk houdt: een besluit dat al genomen is, verdwijnt niet als het
   * portfolio daarna verandert.
   */
  it("houdt een check met een besluit vast, ook als hij anders zou afvallen", () => {
    const basis: Partial<SessieState> = {
      sessie: { fase: "prioritering" } as never,
      usecases: [inPortfolio("u1", "on-farm-data")],
    };
    const zonder = ids(kiesRealiteitschecks(sessieState(basis), 1));
    const afvaller = alle.find((c) => !zonder.includes(c.id) && !c.scherp_bij)!;

    const met = kiesRealiteitschecks(
      sessieState({
        ...basis,
        besluiten: [
          {
            id: "b1",
            sessie_id: "test",
            check_id: afvaller.id,
            besluit: "handhaven",
            motivatie: "",
            aangemaakt_op: "2026-01-01T00:00:00Z",
          },
        ],
      }),
      1,
    );
    expect(ids(met)).toEqual([afvaller.id]);
  });

  it("is deterministisch: dezelfde stand geeft iedereen dezelfde set", () => {
    const state = sessieState({
      sessie: { fase: "prioritering" } as never,
      usecases: [inPortfolio("u1", "bedrijfsadvies"), inPortfolio("u2", "klantcontact")],
    });
    expect(ids(kiesRealiteitschecks(state, 3))).toEqual(ids(kiesRealiteitschecks(state, 3)));
  });
});
