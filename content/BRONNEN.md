# Bronnen en verificatiestatus

Dit bestand verantwoordt waar de inhoud van de game vandaan komt en wat nog geverifieerd moet
worden. **Loop de sectie van je organisatie door vóór de eerste sessie.** De game toont bij elk
cijfer de bron, en markeert expliciet wat een aanname is.

Elk kengetal draagt een `geverifieerd`-vlag. Die staat alleen op `true` als het cijfer in de
primaire bron is gezien — niet als het aannemelijk is, en niet als het uit een samenvatting komt.
`npm run content:check` telt per organisatie hoeveel er nog open staat.

## Twee soorten cijfers, en het verschil telt

- **Kengetallen** komen uit een publieke bron en zijn te controleren. Die horen geverifieerd te zijn.
- **Rekenkundige uitgangspunten** (uurtarief, kosten per rit, afkeurpercentage) zijn bewust
  ingevulde aannames op plausibele ordegrootte. Die zijn niet te verifiëren maar wél te vervangen:
  de facilitator past ze per sessie aan op de werkelijke cijfers, en dán wordt de sessie scherp.
  Ze staan expliciet als aanname gemarkeerd en horen dat te blijven.

Ook alle voorgevulde driverwaarden in de use-casebibliotheken zijn aannames op ordegrootte. Ze
bestaan om het gesprek te starten — het invullen van de echte waarde ís de oefening.

---

# ForFarmers (sector diervoeding)

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
| Domeinmodel | 18 vakgebieden | Anders dan CORA bij corporaties bestaat er voor deze sector geen publieke referentiearchitectuur. De indeling is opgesteld op basis van de acht vakgebieden die ForFarmers zelf noemt, aangevuld tot een volledige keten. Leg hem naast de eigen organisatie-indeling |
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
- Afkeur en herbewerking: 0,5% van het volume
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

# DUWO (sector woningcorporatie)

Deze sectie is ongewijzigd overgenomen uit de eerste oplevering. Er is sindsdien niets opnieuw
gecontroleerd; alle zestien cijfers staan nog op `geverifieerd: false`.

## Waarom veel items op `geverifieerd: false` staan

De omgeving waarin de eerste versie is gebouwd had een egress-proxy die directe toegang blokkeerde
tot `coraveraonline.nl`, `cora.wikixl.nl`, `aedes.nl`, `duwo.nl` en de DUWO-jaarverslag-PDF.
Zoekresultaten waren wel beschikbaar. De cijfers hieronder komen daarom uit
zoekresultaatsamenvattingen van publieke bronnen en zijn niet tegen het originele document
gecontroleerd. Ze zijn bruikbaar als startpunt voor het gesprek, niet als verantwoordingscijfer.

## Te verifiëren vóór gebruik

| Onderwerp | Waarde in de game | Bron | Actie |
|---|---|---|---|
| Aantal eenheden DUWO | ruim 33.000 | DUWO jaarverslag 2024 / duwo.nl | Controleer in het jaarverslag |
| Verhuizingen per jaar | circa 18.000 | duwo.nl nieuwsbericht | Controleer; bepaalt de grootste driver in het model |
| Studenten in werkgebied | 126.000 (was 127.500) | DUWO jaarverslag 2024 | Controleer |
| Tekort in werkgebied | 3.600 eenheden | DUWO jaarverslag 2024 | Controleer |
| Behoefte 2029 | 50.000 eenheden | duwo.nl | Controleer |
| Woonbeleving | 7,2 gemiddeld, elke locatie ≥ 7,1 | Woonbelevingsonderzoek 2024 | Controleer |
| Groeiambitie Den Haag | 5.000 eenheden | DUWO jaarverslag 2024 | Controleer |
| CORA-hoofdbedrijfsfuncties | 18 domeinen | CORA 5 bedrijfsfunctiemodel | Controleer exacte benamingen tegen coraveraonline.nl |
| Accentkleur DUWO | `#E8524A` (koraal) | voorlopig gekozen | Vervang door de huisstijlkleur van DUWO. Eén hex volstaat, de rest wordt afgeleid |
| VERA-objectnamen | gebruikt als "benodigde data" per use case | VERA-standaard, Aedes Datastandaarden | Controleer of de gehanteerde termen aansluiten |

## Zuivere aannames

Deze staan in `content/organisaties/duwo.json` onder `rekenkundige_uitgangspunten`:

- Intern uurtarief all-in: € 65/uur
- Gemiddelde maandhuur per eenheid: € 450 → € 15 gederfde opbrengst per leegstandsdag
- Leegstandsdagen per mutatie: 10
- Reparatieverzoeken per jaar: 25.000
- Klantcontacten per jaar: 120.000
- Inkoopfacturen per jaar: 40.000
- Jaarlijkse huurderving door achterstand en oninbaarheid: € 1.500.000
- Investeringsruimte: € 1.500.000 en 36 mensmaanden verandercapaciteit per jaar

## Geraadpleegde publieke bronnen

- CORA — Woningcorporatie Referentiearchitectuur: https://www.coraveraonline.nl/index.php/Bedrijfsfuncties
- VERA-standaard, Aedes Datastandaarden: https://aedes.nl/datastandaarden/vera-standaard
- Aedes-benchmark 2025: https://aedes.nl/aedes-benchmark/aedes-benchmark-2025-belangrijkste-resultaten
- DUWO jaarverslag 2024: https://view.publitas.com/cfreport/duwo-jaarverslag-2024
- DUWO — behoefte 50.000 eenheden in 2029: https://www.duwo.nl/over-duwo/duwo-nieuws/het-laatste-nieuws/nieuwsbericht/in-2029-behoefte-van-50000-eenheden-in-werkgebied-duwo
- DUWO Woonbelevingsonderzoek 2024: https://www.duwo.nl/over-duwo/duwo-nieuws/het-laatste-nieuws/nieuwsbericht/woonbelevingsonderzoek-2024-bewoners-geven-duwo-gemiddeld-een-72

---

# Eigen data toevoegen

De contentbestanden staan los van de code.

**Een organisatie binnen een bestaande sector** — vervang of vul aan in `content/organisaties/` en
`content/signalen/`, of gebruik de wizard op `/organisatie-toevoegen` die de drie bestanden voor je
genereert. Draai daarna `npm run content:check`.

**Een nieuwe sector** — maak een map onder `content/sectoren/` met `sector.json`, `domeinen.json`,
`uitdagingen.json`, `drivers.json`, `rollen.json`, `rolopdrachten.json`, `realiteitschecks.json` en
`usecases.json`, en voeg hem toe aan `SECTOR_BRONNEN` in `src/lib/content/index.ts`. De rekenregels
komen uit de `formule` in `drivers.json` en worden letterlijk uitgerekend; er is geen TypeScript
voor nodig.
