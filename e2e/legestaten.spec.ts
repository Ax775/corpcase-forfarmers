import { expect, test, type Page } from "@playwright/test";

/**
 * Jaagt een sessie door alle fases zonder ook maar iets in te vullen, en legt elk scherm vast.
 * Lege staten zijn waar een spel als dit doorgaans breekt: delingen door nul, "0 van de 0", of
 * een rapport dat beweert dat er iets ligt terwijl er niets is.
 */

const MAP = process.env.LEEG_MAP ?? "/tmp/leeg";
const FASES = ["Verkennen", "Identificatie", "Waardebepaling", "Prioritering", "Roadmap", "Opbrengst"];

test("lege sessie door alle fases", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 900, height: 1400 } });
  const page: Page = await context.newPage();
  const fouten: string[] = [];
  page.on("pageerror", (e) => fouten.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") fouten.push(`console: ${m.text()}`);
  });

  await page.goto("/start");
  await page.getByLabel("Jouw naam").fill("Guido");
  await page.getByRole("button", { name: "Sessie starten" }).click();
  await page.waitForURL(/\/sessie\/[0-9a-f-]+\/beheer$/);
  const id = page.url().match(/\/sessie\/([0-9a-f-]+)\//)![1];

  for (const fase of FASES) {
    await page.goto(`/sessie/${id}/beheer`);
    await page.getByRole("button", { name: `Volgende fase: ${fase}` }).click();
    await page.waitForTimeout(600);
    await page.goto(`/sessie/${id}`);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${MAP}/leeg-${fase.toLowerCase()}.png`, fullPage: true });
  }

  await page.goto(`/sessie/${id}/scherm`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${MAP}/leeg-beamer.png`, fullPage: true });

  await page.goto(`/sessie/${id}/rapport`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${MAP}/leeg-rapport.png`, fullPage: true });

  // Een lege sessie hoort net zo goed te renderen als een volle. Geen deling door nul, geen
  // ontbrekende sleutel, geen scherm dat halverwege stopt.
  expect(fouten, `JS-fouten in een lege sessie:\n${fouten.join("\n")}`).toEqual([]);
});
