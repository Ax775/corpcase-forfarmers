import { expect, test, type Browser, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * De volledige sessie met drie spelers.
 *
 * Dit is de test die ertoe doet: hij bewijst dat het spel werkt zoals het bedoeld is. Drie
 * afzonderlijke browsers, elk met een eigen identiteit, die elkaars werk zien, elkaar helpen en
 * samen tot een roadmap komen. Alles wat de fases doen komt hier langs, en de privé-rolopdracht
 * wordt expliciet getoetst omdat het lekken daarvan het spelelement kapotmaakt.
 */

async function nieuweSpeler(browser: Browser): Promise<Page> {
  const context = await browser.newContext();
  return context.newPage();
}

async function joinMet(page: Page, code: string, naam: string, rol: string) {
  await page.goto(`/deelnemen?code=${code}`);
  await page.getByLabel("Jouw naam").fill(naam);
  await page.getByLabel("Jouw rol").selectOption({ label: rol });
  await page.getByRole("button", { name: "Meedoen" }).click();
  await page.waitForURL(/\/sessie\/[0-9a-f-]+$/);
}

test("drie spelers doorlopen samen een sessie tot en met de roadmap", async ({ browser }) => {
  const facilitator = await nieuweSpeler(browser);
  const commercie = await nieuweSpeler(browser);
  const it = await nieuweSpeler(browser);

  // --- Sessie starten -------------------------------------------------------
  await facilitator.goto("/start");
  await facilitator.getByLabel("Jouw naam").fill("Guido");
  await facilitator.getByLabel("Jouw rol").selectOption({ label: "Bestuurder" });
  await facilitator.getByRole("button", { name: "Sessie starten" }).click();
  await facilitator.waitForURL(/\/sessie\/[0-9a-f-]+\/beheer$/);

  const sessieUrl = facilitator.url();
  const sessieId = sessieUrl.match(/\/sessie\/([0-9a-f-]+)\//)![1];

  // Op betekenis zoeken, niet op een stijlklasse: die verandert nu eenmaal mee met de vormgeving.
  const code = (await facilitator.getByLabel(/Sessiecode/).innerText()).trim();
  expect(code).toHaveLength(6);

  // --- Twee spelers doen mee ------------------------------------------------
  await joinMet(commercie, code, "Marieke", "Commercieel directeur");
  await joinMet(it, code, "Peter", "Informatiemanager / IT");

  // De facilitator ziet ze allebei binnenkomen zonder de pagina te verversen.
  await expect(facilitator.getByText("Marieke")).toBeVisible();
  await expect(facilitator.getByText("Peter")).toBeVisible();

  // --- Privé-rolopdracht lekt niet -----------------------------------------
  // De opdracht zit achter het rolpaneel, dat zelf achter het avatarknopje in de balk zit.
  await commercie.getByRole("button", { name: "Toon jouw rol en opdracht" }).click();
  await commercie.getByRole("button", { name: /Toon mijn opdracht/ }).click();
  const opdrachtVanMarieke = await commercie
    .getByText(/Zorg dat minstens twee use cases/)
    .innerText();
  expect(opdrachtVanMarieke).toContain("veehouder");
  // Peter ziet zijn eigen opdracht, niet die van Marieke.
  await it.getByRole("button", { name: "Toon jouw rol en opdracht" }).click();
  await it.getByRole("button", { name: /Toon mijn opdracht/ }).click();
  await expect(
    it.getByText(/klant- of bedrijfsgegevens gebruikt een expliciet vastgelegde aanname/),
  ).toBeVisible();
  await expect(it.getByText(/Zorg dat minstens twee use cases/)).toHaveCount(0);

  // --- Fase 1: verkennen ----------------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Verkennen" }).click();

  await expect(commercie.getByRole("heading", { name: "Wat herken je?" })).toBeVisible();
  // De kaarten staan per lens gefilterd, zoals een deelnemer ze ook doorloopt.
  await commercie.getByRole("button", { name: "Jaarverslag", exact: true }).click();
  await commercie.getByRole("button", { name: /Recordjaar, maar autonoom bijna vlak/ }).click();
  await commercie.getByRole("button", { name: "Veehouder", exact: true }).click();
  await commercie.getByRole("button", { name: /Gerrit — melkveehouder/ }).click();

  await it.getByRole("button", { name: "Uitdaging", exact: true }).click();
  await it.getByRole("button", { name: /Data staat in silo's/ }).click();

  // Peter ziet op de kaart die Marieke markeerde dat een collega dit ook herkent. Dat is het
  // punt van de gezamenlijke verkenning: je ziet waar jullie beeld samenvalt.
  await it.getByRole("button", { name: "Jaarverslag", exact: true }).click();
  await expect(
    it.getByRole("button", { name: /Recordjaar, maar autonoom bijna vlak/ }),
  ).toContainText(/collega/, { timeout: 20_000 });

  // --- Fase 2: identificatie ------------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Identificatie" }).click();
  await expect(commercie.getByRole("heading", { name: "Welke use cases volgen hieruit?" })).toBeVisible();

  await commercie.getByRole("button", { name: "Bibliotheek" }).click();
  const eersteKaart = commercie.getByRole("button", { name: "Op tafel leggen" }).first();
  await eersteKaart.click();

  await commercie.getByRole("button", { name: /Op tafel \(/ }).click();
  await expect(commercie.getByRole("button", { name: "Openen en meehelpen" }).first()).toBeVisible();

  // Peter ziet de use case van Marieke verschijnen.
  await expect(it.getByRole("button", { name: /Op tafel \(1\)/ })).toBeVisible({ timeout: 20_000 });

  // --- Elkaar helpen: hulpvraag en aanvulling ------------------------------
  await commercie.getByRole("button", { name: "Openen en meehelpen" }).first().click();
  await commercie.getByRole("button", { name: "Hulpvraag" }).click();
  await commercie
    .getByPlaceholder(/Wat weet je niet/)
    .fill("Ik weet niet hoeveel meldingen dit per jaar zijn.");
  await commercie.getByRole("button", { name: "Toevoegen" }).click();
  await expect(commercie.getByText("Ik weet niet hoeveel meldingen dit per jaar zijn.")).toBeVisible();

  // Peter ziet de hulpvraag van Marieke en beantwoordt hem.
  await it.getByRole("button", { name: /Op tafel \(/ }).click();
  await it.getByRole("button", { name: "Openen en meehelpen" }).first().click();
  await expect(it.getByText("Ik weet niet hoeveel meldingen dit per jaar zijn.")).toBeVisible({
    timeout: 20_000,
  });
  await it.getByRole("button", { name: "Hier antwoord op geven" }).click();
  await it.getByPlaceholder(/Wat weet jij dat helpt/).fill("Ongeveer 25.000 per jaar uit het ERP.");
  await it.getByRole("button", { name: "Toevoegen" }).click();

  // Marieke ziet de aanvulling van Peter binnenkomen.
  await expect(commercie.getByText("Ongeveer 25.000 per jaar uit het ERP.")).toBeVisible({
    timeout: 20_000,
  });

  // --- Fase 3: waardebepaling ----------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Waardebepaling" }).click();
  await expect(commercie.getByRole("heading", { name: "Wat levert het op?" })).toBeVisible();

  await commercie.getByRole("button", { name: "Waarderen" }).first().click();
  await commercie.getByRole("button", { name: "Doorrekenen" }).click();
  await commercie.getByRole("button", { name: /Begin met de ordegroottes/ }).click();

  // Zodra de drivers gevuld zijn, staat er een bandbreedte tussen twee bedragen en niet één
  // hard getal. Dat is de belofte van het waardemodel, dus die toetsen we expliciet.
  await expect(commercie.getByText(/€[\d.\s]+ – €[\d.\s]+/).first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(commercie.getByText("netto per jaar")).toBeVisible();

  // De niet-financiële waarde staat er los naast en wordt apart gescoord. Marieke zet de
  // klantwaarde hoog; dat telt straks mee bij de onthulling van haar rolopdracht.
  const klantwaardeBlok = commercie
    .getByText("Waarde voor de veehouder", { exact: true })
    .locator("xpath=..");
  await expect(klantwaardeBlok).toBeVisible();
  await klantwaardeBlok.getByRole("button", { name: "Score 5" }).click();

  // Ook de haalbaarheid krijgt een oordeel, anders komt de use case niet op de matrix.
  const haalbaarheidBlok = commercie
    .getByText("Databeschikbaarheid", { exact: true })
    .locator("xpath=..");
  await haalbaarheidBlok.getByRole("button", { name: "Score 4" }).click();

  // --- Fase 4: prioritering -------------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Prioritering" }).click();
  await expect(commercie.getByRole("heading", { name: "Wat doen we wél?" })).toBeVisible();

  await commercie.getByRole("button", { name: "Opnemen" }).first().click();
  await expect(commercie.getByRole("button", { name: "In het portfolio" })).toBeVisible();

  // Het toegekende budget verschijnt in de balk die laat zien wat er nog in past.
  await expect(commercie.getByText(/van .*€/).first()).toBeVisible();

  // Een realiteitscheck vraagt om een besluit, en dat besluit wordt vastgelegd.
  await commercie.getByRole("button", { name: /We handhaven/ }).first().click();
  await expect(commercie.getByText("gehandhaafd").first()).toBeVisible({ timeout: 20_000 });

  // --- Fase 5: roadmap ------------------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Roadmap" }).click();
  await expect(commercie.getByRole("heading", { name: "Wanneer doen we wat?" })).toBeVisible();

  await commercie.getByRole("button", { name: "Nu", exact: true }).first().click();
  const randvoorwaarden = commercie
    .getByRole("textbox", { name: /Wat moet er eerst geregeld zijn/ })
    .first();
  await expect(randvoorwaarden).toBeVisible();
  await randvoorwaarden.fill("Koppelvlak op het ERP en een besluit over het gebruik van klantdata.");
  await randvoorwaarden.blur();

  // --- Opbrengst en rapport -------------------------------------------------
  await facilitator.getByRole("button", { name: "Volgende fase: Opbrengst" }).click();
  await expect(commercie.getByRole("heading", { name: "Wat er ligt" })).toBeVisible();

  // Pas nu zijn de rolopdrachten van iedereen zichtbaar.
  await expect(
    commercie.getByText(/klant- of bedrijfsgegevens gebruikt een expliciet vastgelegde aanname/),
  ).toBeVisible();

  await commercie.goto(`/sessie/${sessieId}/rapport`);
  await expect(commercie.getByRole("heading", { name: "Het portfolio" })).toBeVisible();
  await expect(commercie.getByRole("heading", { name: "Aannames en onzekerheden" })).toBeVisible();
  await expect(
    commercie.getByText(/komen uit publieke bronnen en zijn niet geverifieerd/),
  ).toBeVisible();
  // De randvoorwaarde die Marieke invulde staat bij het roadmap-item in het rapport.
  await expect(commercie.getByText(/Eerst nodig: Koppelvlak op het ERP/)).toBeVisible();
  // En de kanttekening dat een doorrekening op aannames rust, ontbreekt niet.
  await expect(commercie.getByRole("heading", { name: "Realiteitschecks" })).toBeVisible();

  // Het rapport gaat ook als spreadsheet mee, voor wie verder wil rekenen dan de pagina zelf.
  const [download] = await Promise.all([
    commercie.waitForEvent("download"),
    commercie.getByRole("button", { name: "CSV downloaden" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  const csvPad = await download.path();
  const csvInhoud = readFileSync(csvPad!, "utf-8");
  expect(csvInhoud).toContain("Portfolio");
  expect(csvInhoud).toContain("Business cases");
  expect(csvInhoud).toContain("Roadmap");
  // De randvoorwaarde die Marieke invulde staat ook in de export.
  expect(csvInhoud).toContain("Koppelvlak op het ERP");

  // Het beamerscherm van de facilitator toont dezelfde sessie.
  await facilitator.goto(`/sessie/${sessieId}/scherm`);
  await expect(facilitator.getByRole("heading", { name: "Waarde tegen haalbaarheid" })).toBeVisible();
});

test("de facilitator logt op een ander apparaat opnieuw in met de beheercode", async ({
  browser,
}) => {
  const facilitator = await nieuweSpeler(browser);
  const speler = await nieuweSpeler(browser);
  const anderApparaat = await nieuweSpeler(browser);

  await facilitator.goto("/start");
  await facilitator.getByLabel("Jouw naam").fill("Guido");
  await facilitator.getByRole("button", { name: "Sessie starten" }).click();
  await facilitator.waitForURL(/\/sessie\/[0-9a-f-]+\/beheer$/);
  const sessieId = facilitator.url().match(/\/sessie\/([0-9a-f-]+)\//)![1];
  const code = (await facilitator.getByLabel(/Sessiecode/).innerText()).trim();

  await joinMet(speler, code, "Marieke", "Commercieel directeur");

  // Een gewone deelnemer die op het beheerscherm meekijkt, krijgt de beheercode nooit te zien —
  // dat veld reist alleen naar wie zich al als facilitator bewees.
  await speler.goto(`/sessie/${sessieId}/beheer`);
  await expect(speler.getByText("Je kijkt mee")).toBeVisible();
  await expect(speler.getByText("Beheertoegang")).toHaveCount(0);
  // Terug naar haar eigen spelerscherm, waar de volgende controle de fase leest.
  await speler.goto(`/sessie/${sessieId}`);

  // De facilitator vindt zijn eigen beheercode terug om hem elders te gebruiken.
  await facilitator.getByRole("button", { name: /Toon de beheercode/ }).click();
  const beheerCode = (await facilitator.getByLabel(/Beheercode/).innerText()).trim();
  expect(beheerCode).toHaveLength(10);

  // Op een nieuwe browser — geen identiteit, geen localStorage — logt hij daarmee weer in.
  await anderApparaat.goto("/facilitator");
  await anderApparaat.getByLabel("Beheercode").fill(beheerCode);
  await anderApparaat.getByRole("button", { name: "Inloggen" }).click();
  await anderApparaat.waitForURL(`/sessie/${sessieId}/beheer`);
  await expect(anderApparaat.getByText("Je kijkt mee")).toHaveCount(0);

  // En kan van daaruit ook echt besturen: de fase verzetten komt bij alle browsers aan.
  await anderApparaat.getByRole("button", { name: "Volgende fase: Verkennen" }).click();
  await expect(speler.getByRole("heading", { name: "Wat herken je?" })).toBeVisible();
});

test("een speler navigeert zelf vooruit en krijgt een waarschuwing dat hij voorloopt", async ({
  browser,
}) => {
  const facilitator = await nieuweSpeler(browser);
  const speler = await nieuweSpeler(browser);

  await facilitator.goto("/start");
  await facilitator.getByLabel("Jouw naam").fill("Guido");
  await facilitator.getByRole("button", { name: "Sessie starten" }).click();
  await facilitator.waitForURL(/\/sessie\/[0-9a-f-]+\/beheer$/);
  const code = (await facilitator.getByLabel(/Sessiecode/).innerText()).trim();

  await joinMet(speler, code, "Marieke", "Commercieel directeur");
  await expect(speler.getByRole("heading", { name: "Klaar om te beginnen" })).toBeVisible();

  // De facilitator zet de groep pas op Verkennen; de waarschuwing bestaat nog niet.
  await facilitator.getByRole("button", { name: "Volgende fase: Verkennen" }).click();
  await expect(speler.getByRole("heading", { name: "Wat herken je?" })).toBeVisible();
  await expect(speler.getByText(/Je loopt voor op de groep/)).toHaveCount(0);

  // De speler klikt zelf door naar Identificatie, zonder op de facilitator te wachten.
  await speler.getByRole("button", { name: "Identificatie", exact: true }).click();
  await expect(speler.getByRole("heading", { name: "Welke use cases volgen hieruit?" })).toBeVisible();
  await expect(
    speler.getByText(/Je loopt voor op de groep — de facilitator staat nog bij Verkennen/),
  ).toBeVisible();

  // Teruglopen naar een fase die de groep al gehad heeft, is geen "voorlopen".
  await speler.getByRole("button", { name: "Lobby", exact: true }).click();
  await expect(speler.getByRole("heading", { name: "Klaar om te beginnen" })).toBeVisible();
  await expect(speler.getByText(/Je loopt voor op de groep/)).toHaveCount(0);

  // "Terug naar de groep" laat de speler weer meevolgen met wat de facilitator instelt.
  await speler.getByRole("button", { name: "Terug naar de groep" }).click();
  await expect(speler.getByRole("heading", { name: "Wat herken je?" })).toBeVisible();

  // Zet de facilitator de groep nu vooruit, dan volgt de speler automatisch mee.
  await facilitator.getByRole("button", { name: "Volgende fase: Identificatie" }).click();
  await expect(speler.getByRole("heading", { name: "Welke use cases volgen hieruit?" })).toBeVisible();
});

test("een browser zonder identiteit komt niet in de sessie", async ({ browser }) => {
  const facilitator = await nieuweSpeler(browser);
  await facilitator.goto("/start");
  await facilitator.getByLabel("Jouw naam").fill("Guido");
  await facilitator.getByRole("button", { name: "Sessie starten" }).click();
  await facilitator.waitForURL(/\/sessie\/[0-9a-f-]+\/beheer$/);
  const sessieId = facilitator.url().match(/\/sessie\/([0-9a-f-]+)\//)![1];

  const buitenstaander = await nieuweSpeler(browser);
  await buitenstaander.goto(`/sessie/${sessieId}`);
  await expect(buitenstaander.getByText("Je doet nog niet mee")).toBeVisible();
});
