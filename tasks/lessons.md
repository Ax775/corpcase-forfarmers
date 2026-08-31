# Lessen

Korte aantekeningen bij fouten en verrassingen, zodat ze niet opnieuw hoeven te gebeuren.

## Een gedeelde motor met twee datasets: id's botsen eerder dan je denkt

Bij het uittillen van de sectorlaag was de eerste aanname dat content-id's uniek zouden blijven over
sectoren heen, zodat bestaande puntlookups ongewijzigd konden blijven. Dat hield geen stand: twee
onafhankelijk geschreven sectoren kiezen vanzelf dezelfde voor de hand liggende namen —
`besturing`, `bestuurder`, `hrm`. Een lookup zonder context geeft dan stilzwijgend het verkeerde
antwoord, en dat valt pas op als iemand in een sessie naar een vreemde domeinnaam kijkt.

**Regel:** als twee datasets dezelfde motor delen, hoort de scope in de aanroep te zitten, niet in
een naamgevingsafspraak. Een afspraak die alleen door discipline wordt gehandhaafd, is geen
afspraak.

## Een `<label>` mag geen `<label>` bevatten

Een veldcomponent die een `<label>` om zijn inhoud heen zet, breekt elke groep keuzerondjes die
erin komt: de opties krijgen de naam van het hele veld in plaats van hun eigen tekst. Visueel is er
niets aan te zien, en met het oog is het niet te vinden.

Het viel hier op doordat Playwright `getByRole("radio", { name: /ForFarmers/ })` niet kon vinden.
Dat is een tweede reden om e2e-tests op toegankelijke namen te laten selecteren in plaats van op
CSS-klassen: ze vinden dit soort fouten gratis.

**Regel:** een veldcomponent die een groep controls kan bevatten, heeft een variant met
`role="group"` nodig. Test een keuzerondjesgroep minstens één keer via zijn toegankelijke naam.

## Twee keer hetzelfde opschrijven is een bug die wacht

De rekenformules stonden als tekst in de content én als TypeScript in de motor, met een test die
bewaakte dat ze niet uit elkaar liepen. Die test is het bewijs dat het probleem bekend was; hij
loste het niet op, hij meldde het alleen. Door de tekst uitvoerbaar te maken verdween de tweede
kopie, en daarmee de hele klasse fouten — plus de eis dat een nieuwe sector code nodig heeft.

**Regel:** als er een test bestaat die bewaakt dat twee representaties gelijk blijven, is dat een
aanwijzing dat er één te veel is.

## macOS schermt drie mappen af voor de shell

Bureaublad, Documenten en Downloads zijn TCC-beschermd. Een bestand daarin is via `ls` wél te zien
qua metadata, maar niet te openen — ook niet met de sandbox uit, en ook niet na het toekennen van
map-toegang in de app. Alles buiten die drie mappen werkt gewoon.

**Regel:** vraag bij een bestand uit een van die drie mappen meteen om het naar de home-map te
verplaatsen, in plaats van drie keer een andere beschermde map te proberen.
