import { expect, test } from "@playwright/test";
import { routes } from "./routes";

for (const route of routes) {
  test(`${route.name} matches the visual baseline`, async ({ page }) => {
    await page.goto(route.path);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
  });
}
