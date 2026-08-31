/**
 * Valideert alle contentbestanden en controleert de kruisverwijzingen ertussen.
 *
 * De zod-schema's bewaken de vorm van elk bestand; dit script bewaakt de samenhang. Sinds de
 * content per sector is ingedeeld gebeurt dat twee keer: binnen een sector (verwijst een use case
 * naar een domein, persona of drivertype dat in díé sector bestaat) en over sectoren heen (heeft
 * elke organisatie een sector, en botsen er geen id's binnen één sector).
 *
 * De koppeling tussen drivertype en rekenmotor hoeft hier niet meer gecontroleerd te worden: de
 * formule in drivers.json ís de implementatie, en `bouwBerekeningen` in src/lib/content/index.ts
 * gooit bij het inlezen al als formule en velden niet overeenkomen.
 *
 * Draai met: npm run content:check
 */
import {
  allePersonaSignalen,
  organisaties,
  personasVoorOrganisatie,
  sectorProfiel,
  sectoren,
  speelmodi,
} from "../src/lib/content";

const fouten: string[] = [];
const waarschuwingen: string[] = [];

const alleUsecaseIds = new Set<string>();
let usecasesTotaal = 0;
let domeinenTotaal = 0;
let gedektTotaal = 0;
let signaalkaartenTotaal = 0;

for (const sector of sectoren) {
  const profiel = sectorProfiel(sector.id);
  const {
    domeinen: domeinenBestand,
    uitdagingen,
    drivers,
    rollen,
    rolopdrachten,
    realiteitschecks,
    usecases,
  } = profiel;

  const p = (melding: string) => `[${sector.id}] ${melding}`;

  const domeinIds = new Set(domeinenBestand.domeinen.map((d) => d.id));
  const uitdagingIds = new Set(uitdagingen.kaarten.map((k) => k.id));
  const rolIds = new Set(rollen.rollen.map((r) => r.id));
  const drivertypeIds = new Set(drivers.drivertypes.map((d) => d.id));

  // De organisaties die onder deze sector vallen, en dus de persona's die hier geldig zijn.
  const eigenOrganisaties = organisaties.filter((o) => o.sector === sector.id);
  if (eigenOrganisaties.length === 0) {
    waarschuwingen.push(p("geen enkele organisatie gebruikt deze sector"));
  }
  const personaIds = new Set(
    eigenOrganisaties.flatMap((o) => personasVoorOrganisatie(o.id).map((k) => k.id)),
  );

  // Use cases
  const gezienInSector = new Set<string>();
  for (const u of usecases.usecases) {
    if (gezienInSector.has(u.id)) fouten.push(p(`dubbel use case-id: ${u.id}`));
    gezienInSector.add(u.id);

    if (alleUsecaseIds.has(u.id)) {
      waarschuwingen.push(
        p(`use case-id "${u.id}" bestaat ook in een andere sector; verwarrend bij het lezen van een rapport`),
      );
    }
    alleUsecaseIds.add(u.id);

    if (!domeinIds.has(u.domein)) fouten.push(p(`${u.id}: onbekend domein "${u.domein}"`));

    for (const persona of u.personas) {
      if (!personaIds.has(persona)) fouten.push(p(`${u.id}: onbekende persona "${persona}"`));
    }
    for (const uitdaging of u.uitdagingen) {
      if (!uitdagingIds.has(uitdaging)) {
        fouten.push(p(`${u.id}: onbekende uitdaging "${uitdaging}"`));
      }
    }
    for (const thema of u.themas) {
      const bestaatErgens = eigenOrganisaties.some((o) =>
        o.strategische_themas.some((t) => t.id === thema),
      );
      if (!bestaatErgens) {
        fouten.push(p(`${u.id}: thema "${thema}" komt bij geen enkele organisatie in deze sector voor`));
      }
    }

    for (const d of u.drivers) {
      if (!drivertypeIds.has(d.type)) {
        fouten.push(p(`${u.id}: onbekend drivertype "${d.type}"`));
        continue;
      }
      const definitie = drivers.drivertypes.find((dt) => dt.id === d.type)!;
      for (const veld of definitie.velden) {
        if (typeof d.waarden[veld.id] !== "number") {
          fouten.push(p(`${u.id}: driver ${d.type} mist veld "${veld.id}"`));
        }
      }
    }

    for (const dimensie of drivers.kwalitatieve_dimensies) {
      if (typeof u.kwalitatief_indicatie[dimensie.id] !== "number") {
        fouten.push(p(`${u.id}: geen kwalitatieve indicatie voor "${dimensie.id}"`));
      }
    }
    for (const dimensie of drivers.haalbaarheidsdimensies) {
      if (typeof u.haalbaarheid_indicatie[dimensie.id] !== "number") {
        fouten.push(p(`${u.id}: geen haalbaarheidsindicatie voor "${dimensie.id}"`));
      }
    }

    if (u.drivers.length === 0) {
      waarschuwingen.push(p(`${u.id}: geen drivers, alleen kwalitatief te scoren`));
    }
  }

  // Rolopdrachten: precies één per rol
  for (const r of rollen.rollen) {
    const opdrachten = rolopdrachten.opdrachten.filter((o) => o.rol === r.id);
    if (opdrachten.length === 0) fouten.push(p(`rol "${r.id}" heeft geen rolopdracht`));
    if (opdrachten.length > 1) fouten.push(p(`rol "${r.id}" heeft meer dan één rolopdracht`));
    for (const d of r.kijkt_naar) {
      if (!domeinIds.has(d)) fouten.push(p(`rol "${r.id}" verwijst naar onbekend domein "${d}"`));
    }
  }
  for (const o of rolopdrachten.opdrachten) {
    if (!rolIds.has(o.rol)) {
      fouten.push(p(`rolopdracht "${o.id}" verwijst naar onbekende rol "${o.rol}"`));
    }
  }

  // Uitdagingen verwijzen naar bestaande domeinen
  for (const k of uitdagingen.kaarten) {
    for (const d of k.domeinen) {
      if (!domeinIds.has(d)) fouten.push(p(`uitdaging "${k.id}": onbekend domein "${d}"`));
    }
  }

  // Elke speelmodus moet genoeg realiteitschecks hebben in élke sector
  for (const m of speelmodi.modi) {
    if (m.aantal_realiteitschecks > realiteitschecks.checks.length) {
      fouten.push(
        p(
          `speelmodus "${m.id}" vraagt ${m.aantal_realiteitschecks} realiteitschecks, deze sector heeft er ${realiteitschecks.checks.length}`,
        ),
      );
    }
  }

  // Uitgangspunten waarnaar drivervelden verwijzen moeten bij élke organisatie in deze sector bestaan
  for (const org of eigenOrganisaties) {
    const beschikbaar = new Set([
      ...org.rekenkundige_uitgangspunten.map((u) => u.id),
      ...org.kengetallen.map((k) => k.id),
    ]);
    for (const dt of drivers.drivertypes) {
      for (const veld of dt.velden) {
        if (veld.uitgangspunt && !beschikbaar.has(veld.uitgangspunt)) {
          fouten.push(
            p(
              `${org.id}: driverveld ${dt.id}.${veld.id} verwijst naar onbekend uitgangspunt "${veld.uitgangspunt}"`,
            ),
          );
        }
      }
    }
  }

  // Dekking: welke domeinen hebben nog geen kaart in de bibliotheek?
  const gedekt = new Set(usecases.usecases.map((u) => u.domein));
  const ongedekt = domeinenBestand.domeinen.filter((d) => !gedekt.has(d.id));
  if (ongedekt.length > 0) {
    waarschuwingen.push(
      p(
        `geen bibliotheekkaart voor: ${ongedekt.map((d) => d.naam).join(", ")} (spelers kunnen hier alleen een eigen kaart maken)`,
      ),
    );
  }

  usecasesTotaal += usecases.usecases.length;
  domeinenTotaal += domeinenBestand.domeinen.length;
  gedektTotaal += gedekt.size;
  signaalkaartenTotaal += uitdagingen.kaarten.length;
}

// Speelmodi zelf, sectoronafhankelijk
const horizonIds = new Set(speelmodi.horizonnen.map((h) => h.id));
for (const m of speelmodi.modi) {
  for (const h of m.roadmap_horizonnen) {
    if (!horizonIds.has(h)) fouten.push(`Speelmodus "${m.id}": onbekende horizon "${h}"`);
  }
  if (m.min_signalen_per_speler > m.max_signalen_per_speler) {
    fouten.push(`Speelmodus "${m.id}": min_signalen groter dan max_signalen`);
  }
}

// Verificatiestatus zichtbaar maken, per organisatie
const perOrganisatie = organisaties.map((o) => ({
  naam: o.naam,
  sector: o.sector,
  open: [...o.kengetallen, ...o.rekenkundige_uitgangspunten].filter((k) => !k.geverifieerd).length,
  totaal: o.kengetallen.length + o.rekenkundige_uitgangspunten.length,
}));

console.log(`Sectoren:             ${sectoren.length} (${sectoren.map((s) => s.id).join(", ")})`);
console.log(`Organisaties:         ${organisaties.length}`);
console.log(`Use cases:            ${usecasesTotaal}`);
console.log(`Domeinen:             ${domeinenTotaal} (${gedektTotaal} met bibliotheekkaart)`);
console.log(
  `Signaalkaarten:       ${signaalkaartenTotaal + allePersonaSignalen.length} + jaarverslag`,
);
console.log("");
for (const o of perOrganisatie) {
  console.log(
    `  ${o.naam.padEnd(14)} ${o.sector.padEnd(18)} ${o.open} van ${o.totaal} cijfers nog te verifiëren`,
  );
}

if (waarschuwingen.length > 0) {
  console.log("\nWaarschuwingen:");
  for (const w of waarschuwingen) console.log(`  - ${w}`);
}

if (fouten.length > 0) {
  console.error("\nFouten:");
  for (const f of fouten) console.error(`  - ${f}`);
  process.exit(1);
}

console.log("\nContent is consistent.");
