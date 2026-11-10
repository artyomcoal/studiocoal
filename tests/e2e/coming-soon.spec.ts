import { expect, test } from "./test";

// Projects whose case study isn't ready (Work › "Case study coming soon", fixture: Tidewater):
// listed on cards without a link, no project page, and a "Coming soon" label in the top-left
// corner of the visual (src/components/ComingSoonLabel.astro).
test.describe("case study coming soon", () => {
  for (const path of ["/", "/work", "/services", "/work/northlight"]) {
    test(`${path} lists Tidewater without linking to it`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: /Tidewater/ }).first()).toBeVisible();
      await expect(page.locator('a[href^="/work/tidewater"]')).toHaveCount(0);
    });
  }

  test("has no project page", async ({ page }) => {
    const response = await page.goto("/work/tidewater");
    expect(response?.status()).toBe(404);
  });

  test("a label sits 16px in from the top-left corner of the first visual only", async ({
    page,
  }) => {
    await page.goto("/work");
    const card = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: /Tidewater/ }) });
    const visuals = card.getByRole("list", { name: "Tidewater visuals" }).getByRole("listitem");
    await expect(visuals).toHaveCount(3);
    const label = visuals.first().getByText("Coming soon", { exact: true });
    await expect(label).toBeVisible();
    await expect(card.getByText("Coming soon", { exact: true })).toHaveCount(1);

    const visual = (await visuals.first().boundingBox())!;
    const box = (await label.boundingBox())!;
    expect(box.x - visual.x).toBeCloseTo(16, 0);
    expect(box.y - visual.y).toBeCloseTo(16, 0);
  });
});
