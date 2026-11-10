import { expect, test } from "./test";

// Section progress indicator (src/components/SectionProgressIndicator.astro) on Work Single:
// Overview (hero + details) and Visuals links, each with a fill that grows with its section,
// fixed bottom centre. It replaces the mobile Get in touch button while it shows.
test.describe("work section progress", () => {
  const progress = (link: import("@playwright/test").Locator) =>
    link
      .locator("[data-progress-fill]")
      .evaluate((fill) => parseFloat((fill as HTMLElement).style.getPropertyValue("--progress")));

  const scrollTo = async (page: import("@playwright/test").Page, y: number) => {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    // One animation frame for the rAF-scheduled update.
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/work/northlight");
  });

  test("sits 16px above the bottom, Overview current with some progress", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Project sections" });
    const overview = nav.getByRole("link", { name: "Overview" });
    const visuals = nav.getByRole("link", { name: "Visuals" });
    await expect(overview).toHaveAttribute("aria-current", "location");
    await expect(visuals).not.toHaveAttribute("aria-current");
    expect(await progress(overview)).toBeGreaterThan(0);
    expect(await progress(visuals)).toBe(0);
    const box = (await nav.boundingBox())!;
    expect(page.viewportSize()!.height - (box.y + box.height)).toBeCloseTo(16, 0);
  });

  test("Visuals takes over once Overview is finished; Overview stays full", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Project sections" });
    const overview = nav.getByRole("link", { name: "Overview" });
    const visuals = nav.getByRole("link", { name: "Visuals" });
    // Visuals' top 40px above the bottom of the viewport: just started.
    const y = await page
      .locator("#visuals")
      .evaluate((el) => el.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40);
    await scrollTo(page, y);
    await expect(visuals).toHaveAttribute("aria-current", "location");
    expect(await progress(overview)).toBe(100);
    const share = await progress(visuals);
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(100);
  });

  test("hides once Visuals is finished and comes back on scroll up", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Project sections" });
    const end = await page
      .locator("#visuals")
      .evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY - window.innerHeight);
    await scrollTo(page, end + 40);
    await expect(nav).toHaveAttribute("data-hidden");
    await scrollTo(page, end - 200);
    await expect(nav).not.toHaveAttribute("data-hidden");
  });

  test("a link scrolls to its section", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Project sections" });
    await nav.getByRole("link", { name: "Visuals" }).click();
    await expect(page).toHaveURL(/#visuals$/);
    await expect(nav.getByRole("link", { name: "Visuals" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("replaces the Get in touch button on base", async ({ page }) => {
    test.skip(page.viewportSize()!.width >= 768, "Base only: md+ keeps the button top right");
    const button = page.getByRole("button", { name: "Get in touch" });
    await expect(button).not.toBeInViewport();
  });
});
