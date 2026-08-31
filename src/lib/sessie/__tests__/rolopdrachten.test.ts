import { describe, expect, it } from "vitest";
import { beoordeelRolopdracht } from "../afgeleid";
import { organisaties, rolopdrachtenVoorOrganisatie, speelmodi } from "@/lib/content";
import type { SessieState } from "@/lib/supabase/types";

/**
 * Een sessie waarin niemand iets in het portfolio heeft gezet.
 *
 * Dat is geen theoretisch geval: het is de stand waarin elke sessie begint, en de stand waarin de
 * opbrengstfase belandt als een groep vastloopt. Juist dan moet de onthulling van de rolopdrachten
 * kloppen, want die is bedoeld als bevinding — niet als ruis.
 */
function legeSessie(): SessieState {
  const org = organisaties[0];
  return {
    sessie: {
      id: "test",
      titel: "Lege sessie",
      organisatie_id: org.id,
      speelmodus: speelmodi.modi[0].id,
      fase: "opbrengst",
      join_code: "ABCDEF",
      beheer_code: null,
      budget_geld: org.budget_defaults.geld_eur,
      budget_capaciteit: org.budget_defaults.verandercapaciteit_mensmaanden,
      uitgangspunten: {},
      onzekerheid_pct: 30,
      fase_deadline: null,
      aangemaakt_op: "2026-01-01T00:00:00Z",
      bijgewerkt_op: "2026-01-01T00:00:00Z",
      afgerond_op: null,
    },
    deelnemers: [],
    selecties: [],
    usecases: [],
    usecaseSignalen: [],
    waarderingen: [],
    bijdragen: [],
    allocaties: [],
    besluiten: [],
    roadmap: [],
  };
}

describe("rolopdrachten bij een leeg portfolio", () => {
  const controles = rolopdrachtenVoorOrganisatie(organisaties[0].id).opdrachten.map(
    (o) => o.controle,
  );

  it("beoordeelt geen enkele opdracht als gehaald", () => {
    for (const controle of controles) {
      const oordeel = beoordeelRolopdracht(legeSessie(), controle);
      expect(oordeel.gehaald, `${controle} zou niet gehaald mogen zijn`).toBe(false);
    }
  });

  /**
   * Dit was de fout: de controles van het type "elke use case moet X" vonden in een lege
   * verzameling geen overtreding en meldden "elke use case is in orde", terwijl het oordeel niet
   * gehaald was. Op het scherm stond dan een rood etiket boven een groene zin.
   */
  it("laat de toelichting niet beweren dat alles in orde is", () => {
    for (const controle of controles) {
      const oordeel = beoordeelRolopdracht(legeSessie(), controle);
      expect(oordeel.toelichting, `${controle} spreekt zijn eigen oordeel tegen`).not.toMatch(
        /^Elke use case/,
      );
    }
  });

  it("zegt in gewone taal waaróm het niet lukte", () => {
    const oordeel = beoordeelRolopdracht(legeSessie(), controles[0]);
    expect(oordeel.toelichting).toContain("niets in het portfolio");
  });
});
