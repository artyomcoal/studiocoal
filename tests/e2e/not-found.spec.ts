import { expect, test } from "./test";

// 404 page (src/pages/404.astro): served with a 404 status, its section at least 75% of the
// viewport tall, so the footer sits low on this short page.
test("unknown paths get the 404 page, at least 75% of the viewport tall", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Page not found.");
  const { section, viewport } = await page.evaluate(() => ({
    section: document.querySelector("main > section")!.getBoundingClientRect().height,
    viewport: innerHeight,
  }));
  expect(section).toBeGreaterThanOrEqual(viewport * 0.75 - 1);
  await expect(page.getByRole("link", { name: "Back to homepage" })).toHaveAttribute("href", "/");
});
