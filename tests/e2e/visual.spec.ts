import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// Reduced motion keeps the home headline's rotating words on their first word, so the
// screenshot doesn't depend on when the rotation timer fires.
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

for (const route of routes) {
  test(`${route.name} matches the visual baseline`, async ({ page }) => {
    await page.goto(route.path);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true });
  });
}

test("get in touch dialog matches the visual baseline", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Get in touch" }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await expect(page).toHaveScreenshot("get-in-touch.png");
});
