import { describe, expect, it } from "vitest";
import { meervoud, telwoord } from "../meervoud";

/**
 * Klein, maar het ging op vier plekken mis op precies dezelfde manier: "1 signalen",
 * "1 maanden", "1 use cases". Deze tests houden die ene plek eerlijk.
 */
describe("telwoord", () => {
  it("gebruikt enkelvoud bij precies één", () => {
    expect(telwoord(1, "signaal", "signalen")).toBe("1 signaal");
    expect(telwoord(1, "use case", "use cases")).toBe("1 use case");
  });

  it("gebruikt meervoud bij nul en bij meer dan één", () => {
    expect(telwoord(0, "signaal", "signalen")).toBe("0 signalen");
    expect(telwoord(3, "signaal", "signalen")).toBe("3 signalen");
  });
});

describe("meervoud", () => {
  it("geeft alleen het zelfstandig naamwoord terug", () => {
    expect(meervoud(1, "deelnemer", "deelnemers")).toBe("deelnemer");
    expect(meervoud(2, "deelnemer", "deelnemers")).toBe("deelnemers");
  });
});
