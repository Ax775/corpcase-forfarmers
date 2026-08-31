import { describe, expect, it } from "vitest";
import { ROL_ICONEN } from "../icoon";
import { sectorProfiel, sectoren } from "@/lib/content";

/**
 * De iconen worden gesleuteld op `rol.id`. Loopt die sleutel uit de pas met de rollen in de
 * content, dan rendert `RolIcoon` stilletjes niets — geen foutmelding, alleen een lege plek in de
 * lobby en op het beheerscherm. Dat is precies wat er gebeurde toen er een sector bijkwam en de
 * iconenlijst achterbleef: van de acht rollen hadden er twee een icoon.
 */
describe("rolIconen", () => {
  it("elke rol in elke sector heeft een icoon", () => {
    for (const sector of sectoren) {
      for (const rol of sectorProfiel(sector.id).rollen.rollen) {
        expect(ROL_ICONEN[rol.id], `${sector.id}: geen icoon voor rol "${rol.id}"`).toBeDefined();
      }
    }
  });

  it("er staan geen iconen in de lijst die bij geen enkele rol horen", () => {
    const bestaandeRollen = new Set(
      sectoren.flatMap((s) => sectorProfiel(s.id).rollen.rollen.map((r) => r.id)),
    );
    for (const id of Object.keys(ROL_ICONEN)) {
      expect(bestaandeRollen.has(id), `icoon voor onbekende rol "${id}"`).toBe(true);
    }
  });
});
