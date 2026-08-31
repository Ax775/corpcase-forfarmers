# Corpcase → sectorlaag + ForFarmers

**Doel:** de DUWO-tool doorontwikkelen tot een sectoronafhankelijke motor met ForFarmers als
tweede sectorprofiel, op geverifieerde publieke bronnen. Bestemming: echte pitch/sessie.

**Uitgangspunt:** commit `5cd7119` is de onveranderde oplevering van de collega. Alles daarna is
onze doorontwikkeling. Baseline was groen: 114 tests, contentvalidatie schoon.

## Waarom een sectorlaag

De app was al multi-organisatie, maar mono-sector. Zonder deze laag zou ForFarmers een
find-and-replace-kopie worden die uit elkaar groeit met het origineel. Met deze laag is de derde
klant een kwestie van JSON schrijven.

Sectorgebonden en dus te verplaatsen naar content:
- `content/cora/domeinen.json` — CORA geldt alleen voor woningcorporaties
- drivertypes `leegstandsreductie` / `dervingsreductie` — bestaan niet bij mengvoer
- `lens: "huurder"`, `huurderswaarde`, "Huurdersblik", volkshuisvestelijke waarde
- uitdagingen, rollen, rolopdrachten, realiteitschecks, de 45 use cases

## Fase A — sectorlaag (DUWO blijft de regressietest)

- [x] A1 `content/sectoren/<id>/` met sector.json, domeinen, uitdagingen, drivers, rollen,
      rolopdrachten, realiteitschecks, usecases. DUWO-content verhuist ongewijzigd naar
      `sectoren/woningcorporatie/`.
- [x] A2 `sector.json` draagt de vocabulaire: klantlens (enkelvoud/meervoud/blik-label),
      naam van het domeinmodel + bron, id van de kernwaarde-dimensie.
- [x] A3 Rekenmotor: `formule` in drivers.json wordt uitvoerbaar via een kleine, veilige
      expressie-evaluator. Daarmee vervalt `BEREKENINGEN` in `berekening.ts` en daarmee ook het
      drift-risico tussen code en content dat de code zelf al benoemt.
      **Eis:** de vijf bestaande drivers geven bit-identieke uitkomsten; bestaande tests moeten
      ongewijzigd slagen.
- [x] A4 Schema's: `organisatie.sector`, `steden` → `werkgebied`, `lens: "huurder"` → `"klant"`,
      drivertype-id's van vaste enum naar kruisvalidatie tegen het sectorprofiel.
- [x] A5 `dekking()` en `teamscore()` in `afgeleid.ts` halen domeinen uit de sector van de
      organisatie in plaats van uit de CORA-import. Labels uit sector.json.
- [x] A6 Rolopdracht-controle `minimaal_twee_hoge_huurderswaarde` → generiek op de
      kernwaarde-dimensie van de sector.
- [x] A7 `valideer-content.ts` valideert per sector en kruislings (elke usecase.domein bestaat in
      zijn eigen sector, elke driver.type ook).
- [x] A8 Onboardingwizard `/organisatie-toevoegen` kent de sectorkeuze.
- [x] **Poort:** `npm test`, `content:check`, `lint`, `typecheck`, `build` groen, DUWO-sessie
      speelt identiek.

## Fase B — ForFarmers-sectorprofiel en organisatie

- [x] B1 Domeinmodel: de acht ForFarmers-vakgebieden, uitgebouwd tot sturend/primair/ondersteunend.
- [x] B2 Waardedrivers voor diervoeding: grondstof-/formuleringsmarge, transport- en routekosten,
      afkeur/recall, volumebehoud en klantretentie, naast tijdsbesparing en vermeden kosten.
- [x] B3 Klantpersona's: melkveehouder, varkenshouder, pluimveehouder, biologisch/Reudink,
      grootschalig integratiebedrijf.
- [x] B4 Uitdagingen: grondstofvolatiliteit, stikstof/derogatie, dierziekten, CSRD/Scope 3,
      krimpende NL-veestapel, ketenintegratie, decentrale IT over vier clusters.
- [x] B5 Rollen + geheime rolopdrachten + realiteitschecks passend bij een beursgenoteerde
      voerproducent (analistenvraag, grondstofschok, vogelgriep, recall).
- [x] B6 Use-casebibliotheek van vergelijkbare diepte als de DUWO-set (~40), elk met drivers,
      kosten, benodigde data en aandachtspunten.
- [x] B7 `content/organisaties/forfarmers.json`: kengetallen 2025, Strategie 2030 als strategische
      thema's, accent `#00337F`, budget-uitgangspunten.

## Fase C — verantwoording en oplevering

- [x] C1 `BRONNEN.md` per sector; `geverifieerd: true` alleen waar het cijfer in de primaire bron
      is gezien. Rekenkundige aannames blijven expliciet aanname.
- [~] C2 `.env.example` is ontkoppeld van het project van de collega. Het aanmaken van een
      eigen Supabase-project staat open: dat vraagt een account. Zonder die variabelen draait de
      app in de offline modus, dus hij is wel speelbaar.
- [x] C3 Stale `npm run seed` opruimen: staat in package.json, README en BRONNEN.md, maar
      `scripts/seed.ts` bestaat niet en `schema.sql` legt uit dat een seed-stap juist niet nodig is.
- [x] C4 README en FACILITATOR.md bijwerken naar twee sectoren.
- [x] C5 E2E-sessie in ForFarmers-modus + verse schermafdrukken.

## Niet-doelen

- Geen herontwerp van de vormgeving; de gelaagde compositie en de contrastregels blijven staan.
- Geen wijziging aan het databaseschema of het RLS-model.
- Niet de repo van de collega aanpassen; dit is een fork.

## Geverifieerde bronnen (2026-08-31)

| Gegeven | Waarde | Bron |
|---|---|---|
| Voervolume 2025 | 10,6 mln ton, +18,0% (autonoom +1,0%) | persbericht 19-02-2026, forfarmersgroup.eu |
| Mengvoervolume | +6,9% (autonoom +0,7%) | idem |
| Brutowinst | € 611,2 mln, +17,9% | idem |
| Onderliggende EBITDA | € 145,9 mln, +44,7% | idem |
| Onderliggende EBIT | € 93,2 mln, +57,7% | idem |
| Onderliggende nettowinst | € 61,9 mln, +52,5% | idem |
| Operationele kasstroom | € 148,3 mln (2024: € 70,2 mln) | idem |
| ROACE | 17,4% (2024: 13,0%) | idem |
| Dividendvoorstel | € 0,30 per aandeel (2024: € 0,20) | idem |
| CEO | Pieter Wolleswinkel | idem |
| Klanten | 28.500 | Strategie 2030, forfarmersgroup.eu |
| Medewerkers | circa 3.000 | Bedrijfsprofiel, forfarmersgroup.eu |
| Productielocaties | 41 | jaarverslag 2025 |
| Verdeling medewerkers | NL 35%, UK 29%, DU 19%, PL 17%, BE 5 fte | jaarverslag 2025 |
| Huisstijl | `#00337F` navy, `#99BA16` limegroen | CSS-variabelen forfarmersgroup.eu |
| Strategie 2030 | dicht bij de boer · onderscheidend in producten & markten · goed voer tegen scherpe prijzen · duurzame oplossingen · (virtuele) ketenintegratie | forfarmersgroup.eu/onze-strategie |
| Waarden | Passionate, Responsible, Open-minded, United, Delivering | idem |
| Recente stappen | Van Triest CirQlar, JV team agrar (DU), JV KPS Food Group (PL), reorganisatie UK afgerond, Beukelaar Diervoeders | persbericht 19-02-2026 |

---

## Review

Alle items uit fase A, B en C zijn af. Eindstand: `content:check`, `typecheck`, `lint`, 130 unittests
en 5 e2e-tests groen, `build` slaagt.

### Wat er anders is gelopen dan gepland

**De lookups moesten sectorgebonden, niet alleen de collecties.** Het plan ging ervan uit dat
content-id's uniek zouden zijn over de hele bibliotheek, zodat `usecase(id)` en `rol(id)` konden
blijven zoals ze waren. Dat bleek niet houdbaar: beide sectoren hebben een domein `besturing` en
een rol `bestuurder`. Een lookup zonder context zou stilzwijgend de kaart van de verkeerde sector
teruggeven — precies het soort fout dat pas halverwege een sessie opvalt. Alle puntlookups nemen nu
eerst de organisatie. Dat kostte een pass door ongeveer tien aanroepplekken, maar de e2e-test
bewijst dat de DUWO-sessie er ongewijzigd doorheen speelt.

**Twee schermen moesten inhoudelijk mee.** De startpagina nam `organisaties[0]`; met twee
organisaties werd dat een keuze. De deelnamepagina liet een rol kiezen vóórdat bekend was welke
sessie het is — met sectorgebonden rollen kan dat niet, dus die zoekt de sessie nu op zodra de code
compleet is. Dat is meteen betere feedback voor de deelnemer.

### Wat er onderweg is gevonden en gerepareerd

- **Geneste labels braken de toegankelijkheid van elke keuzerondjesgroep.** `Veld` rendert een
  `<label>` om zijn inhoud heen; de opties zaten daar als tweede `<label>` in. Daardoor kreeg elk
  keuzerondje de naam van het hele veld, en las een schermlezer bij elke optie "Hoeveel tijd heb
  je?" voor in plaats van "Kort" of "Halve dag". Bestond al vóór deze wijziging, viel op doordat
  Playwright de ForFarmers-optie niet kon vinden. `Veld` heeft nu een `groep`-variant met
  `role="group"`.
- **`npm run seed` bestond niet.** Stond in package.json, README en BRONNEN.md, terwijl
  `scripts/seed.ts` ontbrak en `schema.sql` juist uitlegt dat een seed-stap onnodig is. Verwijderd.
- **`.env.example` bevatte het Supabase-project van de collega.** Vervangen door een placeholder.
- **De Playwright-config wees naar een Chromium in `/opt/pw-browsers`.** Dat pad hoort bij de
  bouwomgeving van de eerste versie; op een andere werkplek faalde de hele e2e-suite erop. Nu
  voorwaardelijk, met terugval op de eigen browser van Playwright.
- **Een niet-eindige uitkomst werd als bedrag getoond.** Een deling door nul in een driverformule
  leverde `Infinity` op, dat gewoon door de business case liep. Nu `onbekend`, in lijn met de
  bestaande regel dat een ontbrekende invoer nooit stilzwijgend nul wordt.

### Wat de volgende sessie nodig heeft

- Een eigen Supabase-project (schema staat klaar in `supabase/schema.sql`) en deploy.
- De negen nog niet geverifieerde ForFarmers-cijfers nalopen, met name de 41 productielocaties en
  het domeinmodel naast de echte organisatie-indeling.
- De rekenkundige uitgangspunten vervangen door de werkelijke cijfers van ForFarmers. Dat is de
  grootste sprong in scherpte die met de minste moeite te maken is.
