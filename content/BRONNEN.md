# Bronnen en verificatiestatus

Dit bestand verantwoordt waar de inhoud van de game vandaan komt en wat nog geverifieerd moet
worden. **Loop het door vóór de eerste sessie.** De game toont bij elk cijfer de bron, en markeert
expliciet wat een aanname is.

Elk kengetal draagt een `geverifieerd`-vlag. Die staat alleen op `true` als het cijfer in de
primaire bron is gezien — niet als het aannemelijk is, en niet als het uit een samenvatting komt.
`npm run content:check` telt hoeveel er nog open staat.

## Twee soorten cijfers, en het verschil telt

- **Kengetallen** komen uit een publieke bron en zijn te controleren. Die horen geverifieerd te zijn.
- **Rekenkundige uitgangspunten** (uurtarief, kosten per rit, afkeurpercentage) zijn bewust
  ingevulde aannames op plausibele ordegrootte. Die zijn niet te verifiëren maar wél te vervangen:
  de facilitator past ze per sessie aan op de werkelijke cijfers, en dán wordt de sessie scherp.
  Ze staan expliciet als aanname gemarkeerd en horen dat te blijven.

Ook alle voorgevulde driverwaarden in de use-casebibliotheek zijn aannames op ordegrootte. Ze
bestaan om het gesprek te starten — het invullen van de echte waarde ís de oefening.

---

# ForFarmers

Opgesteld op 31 augustus 2026. De cijfers over boekjaar 2025 komen uit het persbericht bij de
jaarcijfers, gepubliceerd door ForFarmers zelf op 19 februari 2026, en zijn daar rechtstreeks
afgelezen.

## Geverifieerd tegen de primaire bron

| Onderwerp | Waarde in de game | Bron |
|---|---|---|
| Totaal voervolume 2025 | 10,6 miljoen ton | persbericht jaarcijfers 2025 |
| Volumegroei | +18,0% totaal, autonoom +1,0% | idem |
| Brutowinst | € 611,2 miljoen (+17,9%) | idem |
| Onderliggende EBITDA | € 145,9 miljoen (+44,7%) | idem |
| Onderliggende EBIT | € 93,2 miljoen (+57,7%) | idem |
| Onderliggende nettowinst | € 61,9 miljoen (+52,5%) | idem |
| ROACE | 17,4% (ultimo 2024: 13,0%) | idem |
| Klanten | 28.500 | Strategie 2030 |
| Medewerkers | circa 3.000 | Bedrijfsprofiel |
| Strategische thema's | de vijf principes van Strategie 2030 | Onze strategie |
| Accentkleur | `#00337F` | CSS-variabele `--primary-color` op forfarmersgroup.eu, afgelezen 31-08-2026 |

## Nog te verifiëren

| Onderwerp | Waarde in de game | Actie |
|---|---|---|
| Productielocaties | 41 fabrieken | Controleren in het jaarverslag 2025 |
| Domeinmodel | 14 vakgebieden | Voor deze bedrijfstak bestaat geen publieke referentiearchitectuur. De indeling is opgesteld op basis van de vakgebieden die ForFarmers zelf noemt, en geordend naar de reis van de boer in plaats van naar de interne waardeketen. Beperkt tot de scope van deze sessie. Leg hem naast de eigen organisatie-indeling |
| Verdeling medewerkers per cluster | NL 35%, UK 29%, DU 19%, PL 17%, BE 5 fte | Uit een zoekresultaatsamenvatting van het jaarverslag, niet tegen het origineel gecontroleerd. Staat niet in de game, wel in deze briefing |

## Afgeleide cijfers — reken ze na voordat je ze gebruikt

Deze zijn zelf berekend uit geverifieerde cijfers. De rekensom klopt, maar het zijn
groepsgemiddelden die per segment en per land sterk afwijken.

| Onderwerp | Waarde | Afleiding |
|---|---|---|
| Brutomarge per ton | circa € 58 | € 611,2 mln brutowinst ÷ 10,6 mln ton |
| Gemiddeld volume per klant | circa 372 ton | 10,6 mln ton ÷ 28.500 klanten. Sterk scheef verdeeld: een integratiebedrijf neemt een veelvoud af van een gemengd gezinsbedrijf |

## Zuivere aannames

Deze staan in `content/organisaties/forfarmers.json` onder `rekenkundige_uitgangspunten` en zijn
door de facilitator per sessie aanpasbaar. Ze zijn gekozen op plausibele ordegrootte, niet op
ForFarmers-cijfers:

- Intern uurtarief all-in: € 65/uur
- Bulkritten per jaar: 380.000 (afgeleid van 10,6 mln ton bij circa 28 ton per vracht)
- Kosten per bulkrit: € 250
- Klantcontacten per jaar: 500.000
- Erfbezoeken per jaar: 150.000
- Investeringsruimte: € 4.000.000 en 72 mensmaanden verandercapaciteit per jaar

De klantpersona's in `content/signalen/forfarmers-klanten.json` zijn samengestelde typen, geen
bestaande klanten. Ze zijn gebaseerd op de segmenten waarin ForFarmers publiek zegt te werken
(melkvee, varkens, pluimvee, biologisch, grootschalige en integratiebedrijven). Vervang ze door de
echte klantsegmentatie en de sessie wordt meteen herkenbaarder.

## Geraadpleegde publieke bronnen

- Resultaten ForFarmers 2025: https://www.forfarmersgroup.eu/resultaten/resultaten-forfarmers-2025
- Onze strategie (Strategie 2030): https://www.forfarmersgroup.eu/onze-strategie
- Bedrijfsprofiel: https://www.forfarmersgroup.eu/bedrijfsprofiel
- Organisatie en vakgebieden: https://www.werkenbijforfarmers.nl/over-forfarmers/organisatie.aspx

---

# Eigen data toevoegen

De contentbestanden staan los van de code.

**De ForFarmers-cijfers aanpassen** — `content/organisaties/forfarmers.json` bevat de kengetallen
en de rekenkundige uitgangspunten. Vervang de aannames door de werkelijke cijfers en draai daarna
`npm run content:check`.

**Een tweede organisatie in dezelfde bedrijfstak** — bijvoorbeeld een cluster of een dochter met
eigen cijfers: gebruik de wizard op `/organisatie-toevoegen`, die de drie bestanden genereert plus
de regels om in `src/lib/content/index.ts` te plakken.

**Een andere bedrijfstak** — maak een map onder `content/sectoren/` met `sector.json`,
`domeinen.json`, `uitdagingen.json`, `drivers.json`, `rollen.json`, `rolopdrachten.json`,
`realiteitschecks.json` en `usecases.json`, en voeg hem toe aan `SECTOR_BRONNEN`. De rekenregels
komen uit de `formule` in `drivers.json` en worden letterlijk uitgerekend; er is geen TypeScript
voor nodig.
