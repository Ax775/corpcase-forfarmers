import speelmodiJson from "@content/spel/speelmodi.json";

// Sectoren. Een sector bundelt alles wat aan een bedrijfstak vastzit en niet aan één organisatie:
// het domeinmodel, de waardedrivers, de uitdagingen, de rollen en de vocabulaire. Er is er nu één,
// maar de laag blijft staan: een tweede bedrijfstak is daarmee een map met JSON plus één regel
// hieronder, in plaats van een kopie van de codebase.

import diervoedingSector from "@content/sectoren/diervoeding/sector.json";
import diervoedingDomeinen from "@content/sectoren/diervoeding/domeinen.json";
import diervoedingUitdagingen from "@content/sectoren/diervoeding/uitdagingen.json";
import diervoedingDrivers from "@content/sectoren/diervoeding/drivers.json";
import diervoedingRollen from "@content/sectoren/diervoeding/rollen.json";
import diervoedingRolopdrachten from "@content/sectoren/diervoeding/rolopdrachten.json";
import diervoedingRealiteitschecks from "@content/sectoren/diervoeding/realiteitschecks.json";
import diervoedingUsecases from "@content/sectoren/diervoeding/usecases.json";

// Per organisatie horen drie bestanden bij elkaar: het profiel en de twee org-specifieke
// signaallenzen (jaarverslag, klanten). Nieuwe organisatie? Voeg de drie imports hieronder toe en
// één regel aan ORGANISATIE_BRONNEN — de onboardingwizard (/organisatie-toevoegen) genereert de
// bestanden zelf en toont precies die regels om te plakken.

import forfarmersJson from "@content/organisaties/forfarmers.json";
import forfarmersJaarverslagJson from "@content/signalen/forfarmers-jaarverslag.json";
import forfarmersKlantenJson from "@content/signalen/forfarmers-klanten.json";

import { leesFormule } from "@/lib/waarde/formule";
import type { Berekening, Berekeningen } from "@/lib/waarde/berekening";
import {
  bibliotheekSchema,
  domeinenBestandSchema,
  driversBestandSchema,
  jaarverslagBestandSchema,
  organisatieSchema,
  personaBestandSchema,
  realiteitschecksBestandSchema,
  rolopdrachtenBestandSchema,
  rollenBestandSchema,
  sectorSchema,
  speelmodiBestandSchema,
  uitdagingBestandSchema,
  type JaarverslagKaart,
  type PersonaKaart,
} from "./schemas";

/**
 * Eén plek waar de contentbestanden worden ingelezen en gevalideerd.
 *
 * De validatie draait bij het importeren, dus een fout in een contentbestand valt op bij de build
 * of bij `npm run content:check` — niet pas halverwege een sessie met een bestuurder aan tafel.
 *
 * Twee soorten toegang, met opzet:
 *
 * - **Collecties zijn sectorgebonden.** `rollenVoorSector`, `usecasesVoorSector` enzovoort. Een
 *   organisatie krijgt nooit de rollen van een andere bedrijfstak te zien.
 * - **Puntlookups zijn dat ook.** `usecase`, `domein`, `rol` en `rolNaam` nemen allemaal eerst de
 *   organisatie waarin je zit. Dat blijft zo met één sector: id's zijn uniek binnen een sector en
 *   niet daarbuiten — voor de hand liggende namen als `besturing` en `bestuurder` kiest een
 *   tweede sector vanzelf ook — en een lookup zonder context zou dan stilzwijgend de verkeerde
 *   kaart teruggeven.
 */

const SECTOR_BRONNEN = [
  {
    sector: diervoedingSector,
    domeinen: diervoedingDomeinen,
    uitdagingen: diervoedingUitdagingen,
    drivers: diervoedingDrivers,
    rollen: diervoedingRollen,
    rolopdrachten: diervoedingRolopdrachten,
    realiteitschecks: diervoedingRealiteitschecks,
    usecases: diervoedingUsecases,
  },
];

const ORGANISATIE_BRONNEN = [
  {
    organisatie: forfarmersJson,
    jaarverslag: forfarmersJaarverslagJson,
    personas: forfarmersKlantenJson,
  },
];

export type SectorBron = {
  sector: unknown;
  domeinen: unknown;
  uitdagingen: unknown;
  drivers: unknown;
  rollen: unknown;
  rolopdrachten: unknown;
  realiteitschecks: unknown;
  usecases: unknown;
};

export type SectorProfiel = ReturnType<typeof bouwSectorRegister>[number];

type DriverBron = { drivertypes: { id: string; formule: string; velden: { id: string }[] }[] };

/**
 * Zet de formules uit `drivers.json` om naar iets uitvoerbaars.
 *
 * Hier ligt de reden dat een nieuwe sector geen TypeScript nodig heeft: de rekenregels komen uit
 * de content, niet uit een tabel in de code. Een formule die niet klopt, of die een veld gebruikt
 * dat het drivertype niet declareert, valt hier om — bij het inlezen, dus bij de build.
 */
function bouwBerekeningen(sectorId: string, drivers: DriverBron): Berekeningen {
  const berekeningen: Record<string, Berekening> = {};

  for (const drivertype of drivers.drivertypes) {
    const formule = leesFormule(drivertype.formule);
    const gedeclareerd = drivertype.velden.map((v) => v.id);

    const onbekend = formule.velden.filter((v) => !gedeclareerd.includes(v));
    if (onbekend.length > 0) {
      throw new Error(
        `Sector ${sectorId}, drivertype ${drivertype.id}: de formule gebruikt ${onbekend.join(", ")}, maar dat veld staat niet in "velden".`,
      );
    }

    const ongebruikt = gedeclareerd.filter((v) => !formule.velden.includes(v));
    if (ongebruikt.length > 0) {
      throw new Error(
        `Sector ${sectorId}, drivertype ${drivertype.id}: veld ${ongebruikt.join(", ")} wordt ingevuld door de speler maar komt niet voor in de formule.`,
      );
    }

    berekeningen[drivertype.id] = { velden: gedeclareerd, bereken: formule.evalueer };
  }

  return berekeningen;
}

/** Los van SECTOR_BRONNEN getest in __tests__/sectoren.test.ts, met fictieve bronnen. */
export function bouwSectorRegister(bronnen: SectorBron[]) {
  return bronnen.map((bron) => {
    const sector = sectorSchema.parse(bron.sector);
    const drivers = driversBestandSchema.parse(bron.drivers);
    const usecases = bibliotheekSchema.parse(bron.usecases);
    const domeinen = domeinenBestandSchema.parse(bron.domeinen);

    const drivertypeIds = drivers.drivertypes.map((d) => d.id);
    const domeinIds = domeinen.domeinen.map((d) => d.id);

    // Kruisverwijzingen binnen de sector. Een use case die naar een drivertype of domein van een
    // ándere sector wijst is een contentfout, geen lege matrix halverwege de sessie.
    for (const u of usecases.usecases) {
      if (!domeinIds.includes(u.domein)) {
        throw new Error(`Sector ${sector.id}, use case ${u.id}: onbekend domein "${u.domein}".`);
      }
      for (const d of u.drivers) {
        if (!drivertypeIds.includes(d.type)) {
          throw new Error(`Sector ${sector.id}, use case ${u.id}: onbekend drivertype "${d.type}".`);
        }
      }
    }

    const dimensieIds = drivers.kwalitatieve_dimensies.map((d) => d.id);
    if (!dimensieIds.includes(sector.kernwaarde_dimensie)) {
      throw new Error(
        `Sector ${sector.id}: kernwaarde_dimensie "${sector.kernwaarde_dimensie}" staat niet tussen de kwalitatieve dimensies (${dimensieIds.join(", ")}).`,
      );
    }

    return {
      sector,
      domeinen,
      uitdagingen: uitdagingBestandSchema.parse(bron.uitdagingen),
      drivers,
      rollen: rollenBestandSchema.parse(bron.rollen),
      rolopdrachten: rolopdrachtenBestandSchema.parse(bron.rolopdrachten),
      realiteitschecks: realiteitschecksBestandSchema.parse(bron.realiteitschecks),
      usecases,
      berekeningen: bouwBerekeningen(sector.id, drivers),
    };
  });
}

/** Los van ORGANISATIE_BRONNEN getest in __tests__/organisaties.test.ts, met fictieve bronnen. */
export function bouwOrganisatieRegister(
  bronnen: { organisatie: unknown; jaarverslag: unknown; personas: unknown }[],
) {
  return bronnen.map((bron) => ({
    organisatie: organisatieSchema.parse(bron.organisatie),
    jaarverslag: jaarverslagBestandSchema.parse(bron.jaarverslag),
    personas: personaBestandSchema.parse(bron.personas),
  }));
}

const sectorRegister = bouwSectorRegister(SECTOR_BRONNEN);
const organisatieRegister = bouwOrganisatieRegister(ORGANISATIE_BRONNEN);

for (const entry of organisatieRegister) {
  if (!sectorRegister.some((s) => s.sector.id === entry.organisatie.sector)) {
    throw new Error(
      `Organisatie ${entry.organisatie.id} verwijst naar onbekende sector "${entry.organisatie.sector}".`,
    );
  }
}

export const sectoren = sectorRegister.map((s) => s.sector);
export const organisaties = organisatieRegister.map((e) => e.organisatie);
export const speelmodi = speelmodiBestandSchema.parse(speelmodiJson);

// Sectorgebonden toegang ----------------------------------------------------

export function sectorProfiel(sectorId: string): SectorProfiel {
  const gevonden = sectorRegister.find((s) => s.sector.id === sectorId);
  if (!gevonden) throw new Error(`Onbekende sector: ${sectorId}`);
  return gevonden;
}

export function organisatie(id: string) {
  const gevonden = organisaties.find((o) => o.id === id);
  if (!gevonden) throw new Error(`Onbekende organisatie: ${id}`);
  return gevonden;
}

/** Het sectorprofiel waar deze organisatie onder valt — de gebruikelijke ingang vanuit een sessie. */
export function profielVoorOrganisatie(organisatieId: string): SectorProfiel {
  return sectorProfiel(organisatie(organisatieId).sector);
}

export const domeinenVoorSector = (sectorId: string) => sectorProfiel(sectorId).domeinen;
export const uitdagingenVoorSector = (sectorId: string) => sectorProfiel(sectorId).uitdagingen;
export const waardemodelVoorSector = (sectorId: string) => sectorProfiel(sectorId).drivers;
export const rollenVoorSector = (sectorId: string) => sectorProfiel(sectorId).rollen;
export const rolopdrachtenVoorSector = (sectorId: string) => sectorProfiel(sectorId).rolopdrachten;
export const realiteitschecksVoorSector = (sectorId: string) =>
  sectorProfiel(sectorId).realiteitschecks;
export const usecasesVoorSector = (sectorId: string) => sectorProfiel(sectorId).usecases;
export const berekeningenVoorSector = (sectorId: string) => sectorProfiel(sectorId).berekeningen;
export const klantlens = (sectorId: string) => sectorProfiel(sectorId).sector.klantlens;

// Dezelfde collecties, maar aangeroepen met de organisatie. Dat is wat een scherm in een sessie
// bij de hand heeft; de sector volgt eruit.

const viaOrganisatie =
  <T,>(kies: (p: SectorProfiel) => T) =>
  (organisatieId: string): T =>
    kies(profielVoorOrganisatie(organisatieId));

export const domeinenVoorOrganisatie = viaOrganisatie((p) => p.domeinen);
export const uitdagingenVoorOrganisatie = viaOrganisatie((p) => p.uitdagingen);
export const waardemodelVoorOrganisatie = viaOrganisatie((p) => p.drivers);
export const rollenVoorOrganisatie = viaOrganisatie((p) => p.rollen);
export const rolopdrachtenVoorOrganisatie = viaOrganisatie((p) => p.rolopdrachten);
export const realiteitschecksVoorOrganisatie = viaOrganisatie((p) => p.realiteitschecks);
export const usecasesVoorOrganisatie = viaOrganisatie((p) => p.usecases);
export const klantlensVoorOrganisatie = viaOrganisatie((p) => p.sector.klantlens);
export const sectorVoorOrganisatie = viaOrganisatie((p) => p.sector);

// Puntlookups, altijd binnen de sector van de organisatie ---------------------

export function domein(organisatieId: string, id: string) {
  return profielVoorOrganisatie(organisatieId).domeinen.domeinen.find((d) => d.id === id);
}

export function usecase(organisatieId: string, id: string) {
  return profielVoorOrganisatie(organisatieId).usecases.usecases.find((u) => u.id === id);
}

export function rol(organisatieId: string, rolId: string | null | undefined) {
  if (!rolId) return undefined;
  return profielVoorOrganisatie(organisatieId).rollen.rollen.find((r) => r.id === rolId);
}

export function rolopdrachtVoorRol(organisatieId: string, rolId: string | null | undefined) {
  if (!rolId) return undefined;
  return profielVoorOrganisatie(organisatieId).rolopdrachten.opdrachten.find(
    (o) => o.rol === rolId,
  );
}

export function speelmodus(id: string) {
  const gevonden = speelmodi.modi.find((m) => m.id === id);
  if (!gevonden) throw new Error(`Onbekende speelmodus: ${id}`);
  return gevonden;
}

/**
 * Weergavetekst voor een deelnemersrol, met een leesbare tekst voor een facilitator die alleen
 * begeleidt en dus geen `rol_id` heeft — anders staat er `null` of niets in lijsten en het rapport.
 */
export function rolNaam(organisatieId: string, rolId: string | null): string {
  if (!rolId) return "Begeleidt, geen rol";
  return rol(organisatieId, rolId)?.naam ?? rolId;
}

/**
 * Alle klantpersona's van alle organisaties samen — voor kruiscontroles in
 * `scripts/valideer-content.ts` (verwijst elke usecase.personas naar een bestaand persona-id?)
 * en voor de wizard, die de bestaande persona-concepten toont als startpunt: een nieuwe
 * organisatie die een concept-id hergebruikt houdt de koppeling met de bibliotheek in stand.
 */
export const allePersonaSignalen: PersonaKaart[] = organisatieRegister.flatMap(
  (e) => e.personas.kaarten,
);

/** De klantpersona's van precies deze organisatie, voor dekking() en de teamscore. */
export function personasVoorOrganisatie(organisatieId: string): PersonaKaart[] {
  return organisatieRegister.find((e) => e.organisatie.id === organisatieId)?.personas.kaarten ?? [];
}

function jaarverslagVoorOrganisatie(organisatieId: string): JaarverslagKaart[] {
  return (
    organisatieRegister.find((e) => e.organisatie.id === organisatieId)?.jaarverslag.kaarten ?? []
  );
}

/** Alle signaalkaarten van de vier lenzen, in één lijst met hun lens erbij. */
export type SignaalKaart = {
  id: string;
  lens: "jaarverslag" | "klant" | "uitdaging" | "domein";
  titel: string;
  tekst: string;
  thema?: string;
  domeinen?: string[];
  bron?: string;
  geverifieerd?: boolean;
  detail?: { profiel?: string; reis?: string; frustraties?: string[] };
};

export function alleSignalen(organisatieId: string): SignaalKaart[] {
  const profiel = profielVoorOrganisatie(organisatieId);
  const kaarten: SignaalKaart[] = [];

  for (const k of jaarverslagVoorOrganisatie(organisatieId)) {
    kaarten.push({
      id: k.id,
      lens: "jaarverslag",
      titel: k.titel,
      tekst: k.signaal,
      thema: k.thema,
      bron: k.bron,
      geverifieerd: k.geverifieerd,
    });
  }

  for (const k of personasVoorOrganisatie(organisatieId)) {
    kaarten.push({
      id: k.id,
      lens: "klant",
      titel: k.titel,
      tekst: k.signaal,
      thema: k.thema,
      detail: { profiel: k.profiel, reis: k.reis, frustraties: k.frustraties },
    });
  }

  for (const k of profiel.uitdagingen.kaarten) {
    kaarten.push({
      id: k.id,
      lens: "uitdaging",
      titel: k.titel,
      tekst: k.signaal,
      domeinen: k.domeinen,
    });
  }

  for (const d of profiel.domeinen.domeinen) {
    kaarten.push({
      id: `dom-${d.id}`,
      lens: "domein",
      titel: d.naam,
      tekst: d.omschrijving,
      domeinen: [d.id],
    });
  }

  return kaarten;
}

/** Use cases die bij een signaal passen, zodat de stap van signaal naar use case klein blijft. */
export function usecasesBijSignaal(organisatieId: string, signaalId: string) {
  return profielVoorOrganisatie(organisatieId).usecases.usecases.filter(
    (u) =>
      u.personas.includes(signaalId) ||
      u.uitdagingen.includes(signaalId) ||
      (signaalId.startsWith("dom-") && u.domein === signaalId.slice(4)),
  );
}
