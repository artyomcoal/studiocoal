import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// Graphik is git-ignored until the licence is bought, so its preload 404s in CI.
const ignoredRequests = [/\/fonts\/graphik\//];

for (const route of routes) {
  test(`${route.name} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      const url = response.url();
      if (response.status() >= 400 && !ignoredRequests.some((pattern) => pattern.test(url))) {
        errors.push(`${response.status()} ${url}`);
      }
    });

    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator("h1")).toHaveCount(1);

    // Console errors for the ignored requests are reported without a URL, so filter on the
    // generic resource message only when such a request actually failed.
    const unexpected = errors.filter(
      (error) =>
        !error.startsWith("Failed to load resource: the server responded with a status of 404"),
    );
    expect(unexpected).toEqual([]);
  });
}
