import { expect, test } from "./test";

// Journal posts published on another website (Journal › "Published on another website",
// fixture: "Designing for the next boat"): their cards open the external link in a new tab, and
// no article page is built for them.
const title = "Designing for the next boat";
const externalUrl = "https://example.com/interviews/designing-for-the-next-boat";

test.describe("external journal posts", () => {
  for (const path of ["/", "/journal", "/journal/small-studio"]) {
    test(`${path}: the card opens the external article in a new tab`, async ({ page }) => {
      await page.goto(path);
      const link = page.getByRole("link", { name: new RegExp(title) });
      await expect(link).toHaveAttribute("href", externalUrl);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener");
      await expect(link).toHaveAccessibleName(`${title} (opens in a new tab)`);
      await expect(page.locator('a[href^="/journal/designing-for-the-next-boat"]')).toHaveCount(0);
    });
  }

  test("has no article page", async ({ page }) => {
    const response = await page.goto("/journal/designing-for-the-next-boat");
    expect(response?.status()).toBe(404);
  });
});
