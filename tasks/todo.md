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

- [ ] A1 `content/sectoren/<id>/` met sector.json, domeinen, uitdagingen, drivers, rollen,
      rolopdrachten, realiteitschecks, usecases. DUWO-content verhuist ongewijzigd naar
      `sectoren/woningcorporatie/`.
- [ ] A2 `sector.json` draagt de vocabulaire: klantlens (enkelvoud/meervoud/blik-label),
      naam van het domeinmodel + bron, id van de kernwaarde-dimensie.
- [ ] A3 Rekenmotor: `formule` in drivers.json wordt uitvoerbaar via een kleine, veilige
      expressie-evaluator. Daarmee vervalt `BEREKENINGEN` in `berekening.ts` en daarmee ook het
      drift-risico tussen code en content dat de code zelf al benoemt.
      **Eis:** de vijf bestaande drivers geven bit-identieke uitkomsten; bestaande tests moeten
      ongewijzigd slagen.
- [ ] A4 Schema's: `organisatie.sector`, `steden` → `werkgebied`, `lens: "huurder"` → `"klant"`,
      drivertype-id's van vaste enum naar kruisvalidatie tegen het sectorprofiel.
- [ ] A5 `dekking()` en `teamscore()` in `afgeleid.ts` halen domeinen uit de sector van de
      organisatie in plaats van uit de CORA-import. Labels uit sector.json.
- [ ] A6 Rolopdracht-controle `minimaal_twee_hoge_huurderswaarde` → generiek op de
      kernwaarde-dimensie van de sector.
- [ ] A7 `valideer-content.ts` valideert per sector en kruislings (elke usecase.domein bestaat in
      zijn eigen sector, elke driver.type ook).
- [ ] A8 Onboardingwizard `/organisatie-toevoegen` kent de sectorkeuze.
- [ ] **Poort:** `npm test`, `content:check`, `lint`, `typecheck`, `build` groen, DUWO-sessie
      speelt identiek.

## Fase B — ForFarmers-sectorprofiel en organisatie

- [ ] B1 Domeinmodel: de acht ForFarmers-vakgebieden, uitgebouwd tot sturend/primair/ondersteunend.
- [ ] B2 Waardedrivers voor diervoeding: grondstof-/formuleringsmarge, transport- en routekosten,
      afkeur/recall, volumebehoud en klantretentie, naast tijdsbesparing en vermeden kosten.
- [ ] B3 Klantpersona's: melkveehouder, varkenshouder, pluimveehouder, biologisch/Reudink,
      grootschalig integratiebedrijf.
- [ ] B4 Uitdagingen: grondstofvolatiliteit, stikstof/derogatie, dierziekten, CSRD/Scope 3,
      krimpende NL-veestapel, ketenintegratie, decentrale IT over vier clusters.
- [ ] B5 Rollen + geheime rolopdrachten + realiteitschecks passend bij een beursgenoteerde
      voerproducent (analistenvraag, grondstofschok, vogelgriep, recall).
- [ ] B6 Use-casebibliotheek van vergelijkbare diepte als de DUWO-set (~40), elk met drivers,
      kosten, benodigde data en aandachtspunten.
- [ ] B7 `content/organisaties/forfarmers.json`: kengetallen 2025, Strategie 2030 als strategische
      thema's, accent `#00337F`, budget-uitgangspunten.

## Fase C — verantwoording en oplevering

- [ ] C1 `BRONNEN.md` per sector; `geverifieerd: true` alleen waar het cijfer in de primaire bron
      is gezien. Rekenkundige aannames blijven expliciet aanname.
- [ ] C2 Eigen Supabase-project; `.env.example` ontkoppelen van dat van de collega.
- [ ] C3 Stale `npm run seed` opruimen: staat in package.json, README en BRONNEN.md, maar
      `scripts/seed.ts` bestaat niet en `schema.sql` legt uit dat een seed-stap juist niet nodig is.
- [ ] C4 README en FACILITATOR.md bijwerken naar twee sectoren.
- [ ] C5 E2E-sessie in ForFarmers-modus + verse schermafdrukken.

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
