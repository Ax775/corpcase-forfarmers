import { describe, expect, it } from "vitest";
import { maakSessie } from "../lokale-kern";
import { organisaties, speelmodi } from "@/lib/content";

/**
 * Een facilitator kan bij het starten kiezen om alleen te begeleiden, zonder zelf een rol te
 * spelen (`facilitatorRolId: null`). Dat moet een deelnemer zonder rol en zonder privé-opdracht
 * opleveren — niet een gecrashte insert of een letterlijke "null" ergens in de UI.
 */
describe("maakSessie zonder facilitatorrol", () => {
  it("maakt een facilitator zonder rol_id en zonder rolopdracht aan", () => {
    const toegang = maakSessie({
      titel: "Testsessie",
      organisatieId: organisaties[0].id,
      speelmodusId: speelmodi.modi[0].id,
      facilitatorNaam: "Testfacilitator",
      facilitatorRolId: null,
    });

    expect(toegang.deelnemer.rol_id).toBeNull();
    expect(toegang.deelnemer.rolopdracht_id).toBeNull();
    expect(toegang.deelnemer.is_facilitator).toBe(true);
  });

  it("blijft een rol en rolopdracht toekennen als de facilitator wél meespeelt", () => {
    const toegang = maakSessie({
      titel: "Testsessie",
      organisatieId: organisaties[0].id,
      speelmodusId: speelmodi.modi[0].id,
      facilitatorNaam: "Testfacilitator",
      facilitatorRolId: "bestuurder",
    });

    expect(toegang.deelnemer.rol_id).toBe("bestuurder");
  });
});

describe("uitgangspunten per sessie", () => {
  it("neemt de standaard van de organisatie als er niets is overschreven", () => {
    const org = organisaties[0];
    const toegang = maakSessie({
      titel: "Standaard",
      organisatieId: org.id,
      speelmodusId: speelmodi.modi[0].id,
      facilitatorNaam: "Test",
      facilitatorRolId: null,
    });
    const eerste = org.rekenkundige_uitgangspunten[0];
    expect(toegang.sessie.uitgangspunten[eerste.id]).toBe(eerste.waarde);
  });

  /**
   * De aannames uit de content moeten per sessie te vervangen zijn door de echte cijfers van de
   * organisatie — zonder deploy. Wat niet is overschreven, blijft de standaard.
   */
  it("laat de facilitator een uitgangspunt voor deze sessie overschrijven", () => {
    const org = organisaties[0];
    const [eerste, tweede] = org.rekenkundige_uitgangspunten;
    const toegang = maakSessie({
      titel: "Eigen cijfers",
      organisatieId: org.id,
      speelmodusId: speelmodi.modi[0].id,
      facilitatorNaam: "Test",
      facilitatorRolId: null,
      uitgangspunten: { [eerste.id]: eerste.waarde + 17 },
    });
    expect(toegang.sessie.uitgangspunten[eerste.id]).toBe(eerste.waarde + 17);
    expect(toegang.sessie.uitgangspunten[tweede.id]).toBe(tweede.waarde);
  });
});
