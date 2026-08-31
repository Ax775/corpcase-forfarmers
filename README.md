# Corpcase — ForFarmers

Serious business game waarmee bestuur en management van ForFarmers door de ogen van het eigen
jaarverslag, de eigen veehouders en de eigen uitdagingen tot AI- en datause-cases komen — en die
vervolgens waarderen, prioriteren en op een roadmap zetten.

## De scope

Twee dingen, en bewust niet meer: **For the Future of Farming** en de **voorkant van de
dienstverlening**. Dus het advies op het erf, het klantcontact, de levering, de klantbeleving en de
duurzaamheids- en ketenagenda. De operationele keten — grondstofinkoop, formulering, fabriek en
laboratorium — valt erbuiten. Dat is niet vergeten maar weggelaten: een sessie die alles omvat,
gaat over niets.

De game doorloopt vijf fases: **verkennen → identificatie → waardebepaling → prioritering →
roadmap**, en eindigt in een deelbaar rapport. Meerdere spelers spelen samen: één teamscore, geen
ranglijst tussen collega's.

**Een sessie begeleiden:** zie [`docs/FACILITATOR.md`](docs/FACILITATOR.md).
**Vormgeving en huisstijl:** zie [`docs/ONTWERP.md`](docs/ONTWERP.md).

## Opzet

| Map | Inhoud |
|---|---|
| `content/sectoren/diervoeding/` | Alles wat aan de bedrijfstak vastzit: het vakgebiedenmodel (geordend naar de reis van de boer), de waardedrivers, de uitdagingen, de rollen, de rolopdrachten, de realiteitschecks en de use-casebibliotheek. |
| `content/organisaties/`, `content/signalen/` | Wat aan ForFarmers zelf vastzit: het profiel met kengetallen, en de twee eigen signaallenzen (jaarverslag, klanten). |
| `src/lib/content/` | Zod-schema's en de loader die de content valideert bij het inlezen. |
| `src/lib/waarde/` | De rekenmotor voor business cases, scorekaarten, matrix en budget. |
| `src/app/` | De Next.js-applicatie: spelerview (telefoon), facilitator, beamerview, rapport. |

## Waarom de content in twee lagen zit

Er is één sector en één organisatie, en toch staan ze los van elkaar. Dat is met opzet.

Wat aan de **bedrijfstak** vastzit — dat de marge in centen per ton zit, dat een klant een
veehouder heet, welke vakgebieden er zijn — geldt voor elke voerproducent. Wat aan **ForFarmers**
vastzit — 10,6 miljoen ton, 28.500 klanten, Strategie 2030 — geldt alleen voor hen. Door die twee
te scheiden is een tweede organisatie in dezelfde bedrijfstak een formulier (de wizard op
`/organisatie-toevoegen` genereert de drie bestanden), en een heel andere bedrijfstak een map met
acht JSON-bestanden plus één regel in `SECTOR_BRONNEN`. Er komt geen TypeScript aan te pas, ook
niet voor de rekenregels.

`sector.json` draagt daarbij de woorden die per bedrijfstak verschillen — de klantlens heet hier
"Veehouder" — zodat de interface geen sectortaal hardcodeert.

## Content aanpassen

De contentbestanden staan bewust los van de code, zodat eigen use cases of bedrijfsdata er zo in
kunnen. Na een wijziging:

```bash
npm run content:check   # valideert vorm én kruisverwijzingen
```

Zie [`content/BRONNEN.md`](content/BRONNEN.md) voor de herkomst van elk cijfer en wat nog
geverifieerd moet worden. Elk kengetal draagt zijn eigen bron en een `geverifieerd`-vlag; de game
toont die en presenteert nooit een aanname als feit.

## Drie ontwerpregels in de rekenmotor

1. **Een ontbrekende invoer wordt nooit stilzwijgend nul.** De uitkomst is dan `onbekend`, met de
   namen van de velden die missen. Een business case die stil 0 euro toont is gevaarlijker dan geen
   business case. Datzelfde geldt voor een uitkomst die geen getal is: een deling door nul levert
   `onbekend` op, geen bedrag.
2. **Elke uitkomst is een bandbreedte** (laag / verwacht / hoog). Eén hard getal suggereert een
   precisie die er niet is en kost geloofwaardigheid aan de bestuurstafel.
3. **De formule die de speler leest, is de formule die gerekend wordt.** De `formule` in
   `drivers.json` wordt uitgevoerd, niet nagebouwd in TypeScript. Dat maakt drift tussen tekst en
   berekening onmogelijk. De evaluator is een eigen parser en géén `eval`: contentbestanden worden
   door adviseurs bewerkt, en daar hoort geen code in te kunnen sluipen.

## Twee opslagmodi

| Modus | Wanneer | Wat je krijgt |
|---|---|---|
| **Supabase** (standaard) | Normaal gebruik | Meerdere apparaten, sessie blijft bewaard. Toegang wordt in de database afgedwongen met RLS op basis van een deelnemertoken en de beheercode; er zijn geen accounts en geen geheime sleutel nodig. |
| **Offline** (`NEXT_PUBLIC_OPSLAG=lokaal`) | Tests, en als terugvaloptie op locatie | De sessie leeft in het geheugen van de Next.js-server. Dezelfde toegangsregels, maar weg bij een herstart en alleen bruikbaar als iedereen dezelfde server gebruikt. |

Het schema staat in [`supabase/schema.sql`](supabase/schema.sql) en richt een leeg project in één
keer in. De inhoudelijke bibliotheek staat níét in de database — die leeft in `content/` en wordt
met de applicatie meegebouwd, dus er is geen seed-stap.

## Ontwikkelen

```bash
npm install
npm run dev            # http://localhost:3000
npm run content:check  # contentvalidatie
npm test               # unittests op de rekenmotor en de content
npm run lint
npm run typecheck
npm run build
npm run e2e            # drie browsers spelen samen een sessie, in de offline modus
```

De integratietest tegen het echte Supabase-project slaat zichzelf over wanneer dat project vanuit
de omgeving niet bereikbaar is; een netwerkbeperking is geen defect in de applicatie.
