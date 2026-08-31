import { describe, expect, it } from "vitest";
import { beoordeelRolopdracht } from "../afgeleid";
import { organisaties, rolopdrachtenVoorOrganisatie } from "@/lib/content";
import { sessieState } from "./sessiefixture";

/**
 * Een sessie waarin niemand iets in het portfolio heeft gezet.
 *
 * Dat is geen theoretisch geval: het is de stand waarin elke sessie begint, en de stand waarin de
 * opbrengstfase belandt als een groep vastloopt. Juist dan moet de onthulling van de rolopdrachten
 * kloppen, want die is bedoeld als bevinding — niet als ruis.
 */

describe("rolopdrachten bij een leeg portfolio", () => {
  const controles = rolopdrachtenVoorOrganisatie(organisaties[0].id).opdrachten.map(
    (o) => o.controle,
  );

  it("beoordeelt geen enkele opdracht als gehaald", () => {
    for (const controle of controles) {
      const oordeel = beoordeelRolopdracht(sessieState({ sessie: { fase: "opbrengst" } as never }), controle);
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
      const oordeel = beoordeelRolopdracht(sessieState({ sessie: { fase: "opbrengst" } as never }), controle);
      expect(oordeel.toelichting, `${controle} spreekt zijn eigen oordeel tegen`).not.toMatch(
        /^Elke use case/,
      );
    }
  });

  it("zegt in gewone taal waaróm het niet lukte", () => {
    const oordeel = beoordeelRolopdracht(sessieState({ sessie: { fase: "opbrengst" } as never }), controles[0]);
    expect(oordeel.toelichting).toContain("niets in het portfolio");
  });
});
