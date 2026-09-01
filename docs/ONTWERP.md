# Vormgeving

De game is een instrument dat een dagdeel op tafel ligt bij een bestuur of MT. Het moet er dus
uitzien als iets waar je tijd aan wijdt, niet als een intern formulier. De vormtaal is redactioneel:
warm papier, één accentkleur, koppen die door gewicht en letterafstand van de lopende tekst
verschillen, en spaarzaam een houtskoolpaneel op de plek waar de beslissing valt.

## Eén kleur per organisatie, de rest afgeleid

Een organisatieprofiel levert **één** hex in `content/organisaties/<naam>.json`:

```json
"thema": { "accent": "#99BA16", "accent_secundair": "#00337F", "bron": "…", "geverifieerd": true }
```

`src/lib/thema/kleur.ts` leidt daaruit vijf varianten af, elk gemeten tegen de ondergrond waarop
hij daadwerkelijk komt te staan:

| Variant | Waarvoor | Eis |
|---|---|---|
| `accent` | vlakken zonder tekst: cirkels, matrixpunten, balken | geen |
| `accent-groot` | grote cijfers op papier | ≥ 3,0 op papier (norm voor grote tekst) |
| `accent-sterk` | knopvullingen met witte tekst | ≥ 4,5 met wit erop |
| `accent-diep` | kleine tekst in de accentkleur op papier | ≥ 4,5 op papier |
| `accent-op-donker` | tekst op een houtskoolpaneel | ≥ 4,5 op houtskool |

De afleiding verschuift de lichtheid net zolang tot de **gemeten** verhouding de drempel haalt,
in plaats van een vast percentage te verdonkeren. Dat verschil telt: een vast percentage werkt
toevallig bij één vertrekpunt, maar zou bij een geel of lichtgroen logo alsnog onleesbare knoptekst
opleveren, en bij een diep marineblauw zou tekst op een houtskoolpaneel juist te donker blijven.
Het limegroen van ForFarmers is precies zo'n lastig vertrekpunt: als knopvulling wordt het
`#657A0E`, als kleine tekst `#586C0D`, en op het houtskoolpaneel mag het onveranderd blijven. Er wordt bovendien hoger gemikt dan het minimum, omdat precies op 4,5 landen broos is
en kleine tekst op het minimum nog steeds onprettig leest.

`src/lib/thema/__tests__/kleur.test.ts` toetst dit voor elke organisatie in `content/` én voor een
aantal lastige vertrekpunten (fel geel, lichtgroen, wit, zwart). Zet iemand een huisstijlkleur in
een JSON die niet werkt, dan valt de test om in plaats van dat de interface stilletjes onleesbaar
wordt.

## Wat waar mag

- **Serif** is voor display: koppen, grote cijfers, de sessietitel. Nooit voor lopende tekst,
  labels of invoervelden.
- **Het felle accent** is voor grote vormen. Kleine tekst in de accentkleur gebruikt `accent-diep`.
- **De sessiecode staat bewust in een monospace**, niet in de displaystijl. Die code wordt
  overgetypt, en een letter die op een cijfer lijkt kost dan een mislukte poging. Het
  code-alfabet zelf sluit al verwarrende tekens uit (geen I/1, geen O/0).
- **Groen betekent waarde, niet accent.** Een negatieve netto baat wordt daarom in de risicokleur
  getoond; anders leest een verliesgevende use case als winst.

  Precies daarom mag een organisatie optioneel een **tweede** huisstijlkleur aanleveren
  (`accent_secundair`): die doet niet mee als tweede accent, maar neemt de waardekleur over. Een
  tweede kleur die wél als accent mee zou doen, haalt de functie uit het eerste accent: dan is
  niets meer bijzonder. Wie geen tweede kleur opgeeft, houdt het standaardgroen.

  Bij ForFarmers zijn dat de twee kleuren uit hun logo, en die dwingen een keuze af: met hun
  limegroen als accent kan groen niet tegelijk "waarde" betekenen, want dan valt niets meer op.
  Het navy `#00337F` neemt die rol daarom over. Het semantische paar blijft intact — navy voor een
  positieve netto baat, de risicokleur voor een negatieve — alleen is de positieve kant niet langer
  groen. Dat is de prijs van een groene huisstijl, en hij is bewust betaald.
- **Eén houtskoolpaneel per scherm**, op de plek waar de beslissing valt: het uitkomstblok bij de
  waardebepaling, de investeringsruimte bij de prioritering, de grote getallen bij de opbrengst,
  en de matrix op de beamer. Geen invoervelden op donker.
- **Decoratie is aria-hidden en verdwijnt bij het printen.** Het rapport blijft licht, want het
  gaat mee naar een RvC-vergadering op papier.

## De gelaagde compositie

Van de drie mockups is *Gelaagd* gekozen. De stapeling leidt: een houtskoolpaneel valt over een
lichte kaart en loopt tegen de schermrand aan, cirkels liggen erachter en worden door de kaartranden
afgesneden, en de hoofdhandeling is een pijl met een klein label in plaats van een knopvlak.

Die stapeling brengt drie regels mee. Ze zijn geen smaak: ze komen alle drie uit een fout die
tijdens het bouwen is gemeten of gezien, en ze staan hier omdat het er goed uitzag toen het fout
was.

### 1. Het volle accent verdraagt geen tekst

Het limegroen `#99BA16` uit het ForFarmers-logo haalt op papier 2,09 en op wit nog minder. De
accentcirkel mag dus alleen in een zone waar geen tekst komt. Waar tekst overheen kan lopen is het
de zachte tint, die inkt en inkt-zacht ruim draagt.

Alleen vlakken zonder tekst gebruiken het volle accent: matrixpunten, voortgangsbalken, de
accentcirkel zelf.

**Ook het grote cijfer niet meer.** Dat was eerder de enige uitzondering: `Cijfer toon="accent"`
zette het volle accent op papier, met de redenering dat het kleinste formaat 30 px is en daarboven
de norm voor grote tekst (3,0) geldt. Bij het koraal van de eerste versie klopte dat op het randje
(3,43). Bij dit groen zakt het naar 2,09, en toen de kleurtest daarop omviel bleek de redenering te
broos: hij hing aan één kleur. Er is nu een aparte variant `accent-groot`, die net zolang verdiept
tot de norm gehaald wordt en verder niets doet — bij een donkere huisstijl is hij gelijk aan het
accent zelf. Voor ForFarmers levert dat `#7A9512` op, contrast 3,20.

Kleine tekst in de accentkleur is `accent-diep` (5,51).

Deze regel is met het oog niet te controleren — een vol, helder accent *ziet er gewoon goed uit* —
en dat is te merken: bij de eerste versie zat het onder drie geselecteerde filterchipjes en onder
zes bijschriften van 12 en 14 px. Beide kanten worden daarom getoetst in
`src/lib/thema/__tests__/vormgevingsregels.test.ts`, dat de bronbestanden scant op `bg-accent` met
een tekstkleur ernaast, en op `text-accent` zonder een groot lettergrootte-token in dezelfde
klassenlijst.

### 2. Op de zachte tint is `inkt-licht` niet genoeg

Die haalt daar 4,43. Alles wat over een tintvlak kan vallen is `inkt-zacht` (6,65). Dat geldt ook
voor het label onder een cijfer, want een cijferblok valt regelmatig over een cirkel; `Cijfer` zet
dat label daarom zelf al op `inkt-zacht`. Op de beamer is om dezelfde reden alle secundaire tekst
`inkt-zacht`: dat scherm wordt van vier meter afstand gelezen.

### 3. Een overlappende kaart moet inhoud ontzien

In de eerste opzet bedekte het uitkomstpaneel de invoervelden waarin je net stond te typen. De
onderliggende kaart moet ruimte reserveren, en dat mag niet van oplettendheid afhangen: `Kaart`
heeft daarvoor de prop `onderruimte`.

### Twee dingen over de cirkel

De cirkel wordt vanuit de hoek verschoven met een deel van zijn **eigen breedte**, met `translate`
en niet met een procentuele `top`. Een percentage resolveert tegen de hoogte van de container, en
op een lang fasescherm schoof de cirkel daardoor honderden pixels buiten beeld — onzichtbaar, en
niet te zien in de code.

Daarnaast heeft `Cirkel` een `vanBoven`, die de bovenkant van het afsnijvlak verlaagt. Daarmee
blijft de cirkel onder de haarlijnkop of onder de teamscore, in plaats van eronder door te lopen.

## Lettertypen

**Lexend**, het lettertype dat ForFarmers zelf gebruikt — op hun site in de gewichten 300 tot 600.
Via `next/font/google`, dat het bij de build binnenhaalt en vanaf het eigen domein serveert; er
gaat dus geen bezoekersdata naar Google. Voor een organisatie die in deze game zelf over privacy
bij klantdata praat, is dat geen detail.

Eén familie voor alles, waar hier eerder een display-serif tegenover een schreefloze stond. Dat
onderscheid draagt nu het gewicht: `.display` en `.cijfer` staan op 300 met strakkere
letterafstand, de lopende tekst op 400. Bij een geometrische schreefloze als Lexend geeft een licht
gewicht op groot formaat de rust die de serif eerder bracht — een kop in hetzelfde gewicht als de
tekst eronder zou juist druk worden.

De regelhoogte van `.cijfer` staat op 0,9 en niet lager. Bij 0,85 was de regelbox korter dan de
cijfers zelf, en liep een toelichting eronder dwars door het getal heen; de onderruimte in `em`
vangt de rest op.

## Iconen

De iconen komen uit Google's Material Symbols (Apache 2.0), maar niet als lettertype: de subset
weegt al snel enkele megabytes voor een handvol glyphs, en `next/font/google` kent het bovendien
niet als gewoon lettertype. In plaats daarvan staan de padgegevens van een klein, met de hand
gekozen setje losse in `src/components/icoon.tsx` — dezelfde constructie als de handgetekende pijl
in `PijlActie` en de halftoon in `decoratie.tsx`. Geen extra verzoek naar Google, geen megabytes
voor een paar honderd bytes aan SVG-paden.

Terughoudend toegepast: een icoon staat er alleen waar het een handeling of status verduidelijkt
die de tekst zelf niet snel genoeg overbrengt — waarschuwen dat je voorloopt op de groep, tonen of
verbergen van de privé-rolopdracht, kopiëren van de uitnodiging, opnieuw meevolgen met de groep.
Geen icoon naast een label dat zichzelf al uitlegt; dat zou de redactionele, tekstgedreven toon
van de rest verstoren.

## Raakvlakken

De globale regel dat elke knop minstens 44 pixels hoog is, maakte van de matrixpunten strepen. Die
punten zijn daarom een transparante knop van 44 bij 44 met een kleine ronde stip erin: het
raakvlak blijft bruikbaar op een telefoon, en de stip blijft een stip.

## Animatie

Drie plekken, met opzet niet meer: een lift en een duik op elk klikbaar element (hover/press,
globaal in `globals.css`), kengetallen die zichtbaar optellen naar hun nieuwe waarde in plaats van
te verspringen (`useTelOp`, in `Cijfer` en de teamscore in `Sessiebalk`), en een heel langzame
ademhaling op de decoratieve cirkels. Verspreid over de hele app in plaats van op één uitgelicht
moment — dat past bij een instrument dat een dagdeel meegaat, niet bij een demo.

**`transform`, nooit de losse eigenschappen `translate`/`scale`/`rotate`.** Tailwind 4 vertaalt
zijn eigen positionerings-utility's (`translate-x-1/3` voor de cirkels, `-translate-x-1/2` voor de
matrixpunten) naar díe losse eigenschappen, niet naar `transform`. Was de hover-lift of de
ademhaling ook met `translate`/`scale` geschreven, dan overschreef hij zonder waarschuwing de
eigen positionering van precies die elementen — de matrixpunten waren van hun plek geschoven bij
elke hover. `transform` raakt geen van beide en telt er zuiver bovenop. Geverifieerd door de
gebouwde CSS na te lezen (`.translate-x-1\/3{translate:var(--tw-translate-x) ...}`) én door een
matrixpunt voor en na een hover op de pixel te vergelijken.

**`useTelOp` telt alleen echte getallen op.** `Cijfer` accepteert ook al opgemaakte tekst (een
bandbreedte als "€ 91.500 – € 208.500"); daar is niets om naartoe te tellen, dus die gaat ongewijzigd
door. De hook regelt `prefers-reduced-motion` zelf met `window.matchMedia`, want de globale
CSS-regel onderaan dit bestand vangt alleen CSS-transities en -animaties af, geen
requestAnimationFrame-lussen.

**De ademhaling staat achter `motion-safe:`**, net als de rest van de bewuste beweging achter de
globale `prefers-reduced-motion`-regel. Wie liever geen beweging ziet, ziet ook deze niet.
