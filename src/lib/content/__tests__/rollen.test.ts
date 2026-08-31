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
 * Twee sectoren hebben allebei een rol `bestuurder`. Zonder de organisatie erbij zou een lookup
 * stilzwijgend de verkeerde kaart teruggeven — precies de fout waarvoor de lookups sectorgebonden
 * zijn gemaakt.
 */
describe("gelijknamige rollen in twee sectoren", () => {
  it("geeft per organisatie de rol van de eigen sector", () => {
    const namen = organisaties.map((o) => ({
      organisatie: o.id,
      lens: rol(o.id, "bestuurder")?.lens,
    }));

    const gevonden = namen.filter((n) => n.lens !== undefined);
    expect(gevonden.length).toBeGreaterThan(1);
    expect(new Set(gevonden.map((n) => n.lens)).size).toBe(gevonden.length);
  });
});
