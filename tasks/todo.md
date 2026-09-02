# Corpcase voor ForFarmers

**Doel:** een serious business game waarmee het management van ForFarmers van jaarverslagsignalen
naar een doorgerekend, geprioriteerd AI-usecaseportfolio komt. Bestemming: een echte pitch/sessie,
dus cijfers zijn geverifieerd tegen primaire bronnen waar dat kon.

**Scope:** For the Future of Farming en de voorkant van de dienstverlening. De operationele keten
— grondstofinkoop, formulering, productie, laboratorium — valt er bewust buiten.

## Stand

Af en groen: `content:check`, `typecheck`, `lint`, 185 unittests en 6 e2e-tests, `build` slaagt.
De volledige sessie — drie browsers, alle vijf fases, rapport en beamerscherm — speelt door.

| Onderdeel | Omvang |
|---|---|
| Vakgebieden (domeinmodel) | 14, alle met een bibliotheekkaart |
| Use cases | 34 (18 bewezen, 12 opkomend, 4 verkennend) |
| Waardedrivers | 7: tijdsbesparing, volumebehoud, klantgroei, extra afzet, dienstopbrengst, transport, vermeden kosten |
| Rollen met privé-opdracht | 8 |
| Realiteitschecks | 10 |
| Signaalkaarten | 12 jaarverslag + 6 klantpersona's + 17 uitdagingen + 14 vakgebieden |
| Geverifieerde kengetallen | 9 van de 10; 7 uitgangspunten zijn expliciet aanname |

## Optimalisatieronde (2026-09-01)

Gekozen op wat een echte sessie scherper maakt, niet op wat er kán.

- [x] O1 **Timers tot leven.** `zetFaseDeadline` wordt nergens aangeroepen: de timers uit de
      speelmodi zijn dood, en daarmee ook de "loopt uit"-interventie. Bij het openen van een fase
      wordt de deadline gezet; beheerscherm en beamer tonen een aflopende teller.
- [x] O2 **Cijfers checken vóór de sessie.** De rekenkundige uitgangspunten zijn aannames die de
      facilitator "per sessie kan aanpassen" — maar alleen door JSON te bewerken en te deployen.
      De startpagina krijgt een stap waar je ze voor déze sessie overschrijft; het rapport meldt
      wat er is aangepast.
- [x] O3 **Realiteitschecks die het portfolio raken.** Nu pseudo-willekeurig op sessie-id; het veld
      `raakt` is dood. Elke check krijgt `scherp_bij` (domeinen, budgetdruk) en de selectie kiest
      wat het portfolio het hardst raakt, met de reden op de kaart. Checks met een besluit blijven
      staan.
- [x] O4 **Rapport opent met één zin.** De RvC-lezer krijgt eerst de conclusie, dan de cijfers.
- [x] O5 **Lexend als variabel lettertype.** Vijf losse gewichten worden één bestand.

## Wat er nog moet

- [ ] Eigen Supabase-project aanmaken en de twee omgevingsvariabelen zetten;
      `supabase/schema.sql` richt een leeg project in één keer in. Vraagt een account, dus ligt bij
      de gebruiker.
- [ ] Deploy op Vercel zodat deelnemers op hun eigen telefoon kunnen meedoen. Zie de sectie
      "Hosten op Vercel" in de README. **Zonder Supabase-variabelen valt de app terug op de offline
      modus, en die werkt niet op een serverless host** — een sessie zou willekeurig verdwijnen.
      De startpagina waarschuwt daarvoor.
- [ ] De negen resterende cijfers verifiëren, met name de 41 productielocaties en het domeinmodel
      naast de echte organisatie-indeling van ForFarmers.
- [ ] De rekenkundige uitgangspunten vervangen door de werkelijke cijfers van ForFarmers. Kan nu
      per sessie op `/start` onder "Cijfers voor deze sessie", zonder deploy; de content-defaults
      blijven aannames tot er echte cijfers zijn.
- [ ] De klantpersona's naast de echte klantsegmentatie leggen. Het zijn nu samengestelde typen
      op basis van de segmenten waarin ForFarmers publiek zegt te werken.

## Herkomst

De codebase komt voort uit een game die een collega voor een andere opdrachtgever bouwde. Commit
`5cd7119` is die oplevering ongewijzigd; alles daarna is de doorontwikkeling naar ForFarmers.
Die geschiedenis staat bewust nog in git: het laat zien wat overgenomen is en wat nieuw. Wie de
repo overdraagt zonder die herkomst mee te geven, kan hem platslaan tot één commit.

De inhoud van de oorspronkelijke opdrachtgever is volledig verwijderd. Wat is gebleven is de
motor, en de scheiding tussen wat aan een bedrijfstak vastzit (`content/sectoren/diervoeding/`) en
wat aan één organisatie (`content/organisaties/`, `content/signalen/`). Die scheiding is er niet
voor de sier: ze maakt een tweede organisatie een formulier en een andere bedrijfstak een map met
JSON, in plaats van een kopie van de codebase.

## Niet-doelen

- Geen herontwerp van de vormgeving; de gelaagde compositie en de contrastregels blijven staan.
- Geen wijziging aan het databaseschema of het RLS-model.
