# Corpcase voor ForFarmers

**Doel:** een serious business game waarmee het management van ForFarmers van jaarverslagsignalen
naar een doorgerekend, geprioriteerd AI-usecaseportfolio komt. Bestemming: een echte pitch/sessie,
dus cijfers zijn geverifieerd tegen primaire bronnen waar dat kon.

## Stand

Af en groen: `content:check`, `typecheck`, `lint`, 137 unittests en 5 e2e-tests, `build` slaagt.
De volledige sessie — drie browsers, alle vijf fases, rapport en beamerscherm — speelt door.

| Onderdeel | Omvang |
|---|---|
| Vakgebieden (domeinmodel) | 18, alle met een bibliotheekkaart |
| Use cases | 40 (23 bewezen, 15 opkomend, 2 verkennend) |
| Waardedrivers | 7, waaronder formuleringsmarge, transport, afkeur en volumebehoud |
| Rollen met privé-opdracht | 8 |
| Realiteitschecks | 9 |
| Signaalkaarten | 12 jaarverslag + 6 klantpersona's + 17 uitdagingen + 18 domeinen |
| Geverifieerde kengetallen | 9 van de 10; 8 uitgangspunten zijn expliciet aanname |

## Wat er nog moet

- [ ] Eigen Supabase-project aanmaken en `.env.local` vullen; `supabase/schema.sql` richt een leeg
      project in één keer in. Vraagt een account, dus ligt bij de gebruiker. Zonder die variabelen
      draait de app in de offline modus en is hij wel speelbaar.
- [ ] Deploy (Vercel of anders) zodat deelnemers op hun eigen telefoon kunnen meedoen.
- [ ] De negen resterende cijfers verifiëren, met name de 41 productielocaties en het domeinmodel
      naast de echte organisatie-indeling van ForFarmers.
- [ ] De rekenkundige uitgangspunten vervangen door de werkelijke cijfers. Dat is de grootste
      sprong in scherpte die met de minste moeite te maken is: uurtarief, kosten per rit,
      afkeurpercentage, aantal klantcontacten en erfbezoeken.
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
