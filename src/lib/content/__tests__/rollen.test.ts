import { describe, expect, it } from "vitest";
import { organisaties, rol, rolNaam, rolopdrachtVoorRol, rollenVoorOrganisatie } from "../index";

/**
 * Een facilitator zonder rol (`rol_id: null`) mag nergens een letterlijke "null" of een lege
 * plek opleveren in lijsten en het rapport — dit toetst dat de helpers daarop zijn voorbereid.
 */
describe("rol-helpers met een lege rol", () => {
  const org = organisaties[0].id;

  it("rol() en rolopdrachtVoorRol() geven undefined terug voor null, niet een crash", () => {
    expect(rol(org, null)).toBeUndefined();
    expect(rol(org, undefined)).toBeUndefined();
    expect(rolopdrachtVoorRol(org, null)).toBeUndefined();
  });

  it("rolNaam() geeft een leesbare tekst voor null en anders de rolnaam", () => {
    const rollen = rollenVoorOrganisatie(org);
    expect(rolNaam(org, null)).toBe("Begeleidt, geen rol");
    expect(rolNaam(org, rollen.rollen[0].id)).toBe(rollen.rollen[0].naam);
  });
});

/**
 * De lookups zijn sectorgebonden: ze nemen eerst de organisatie waarin je zit.
 *
 * Dat lijkt overbodig met één sector, en is het niet. Voor de hand liggende id's als `bestuurder`
 * en `besturing` kiest een tweede sector vanzelf ook, en een lookup zonder context zou dan
 * stilzwijgend de kaart van de verkeerde bedrijfstak teruggeven — een fout die pas halverwege een
 * sessie opvalt. Deze tests houden die eigenschap vast zolang er nog niets is om hem tegen af te
 * zetten.
 */
describe("lookups zijn gebonden aan de organisatie", () => {
  it("vindt een rol alleen binnen de sector van die organisatie", () => {
    const org = organisaties[0].id;
    const eigen = rollenVoorOrganisatie(org).rollen[0];

    expect(rol(org, eigen.id)).toEqual(eigen);
    // Een rol-id uit een andere bedrijfstak hoort niets op te leveren, geen toevallige match.
    expect(rol(org, "rol-uit-een-andere-bedrijfstak")).toBeUndefined();
  });

  it("weigert een onbekende organisatie in plaats van stil undefined te geven", () => {
    expect(() => rol("bestaat-niet", "bestuurder")).toThrow(/Onbekende organisatie/);
  });
});
