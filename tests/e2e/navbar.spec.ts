import { expect, test } from "@playwright/test";

// Navbar (src/components/Navbar.astro): fixed frosted pill, all links visible at every
// breakpoint, logomark links home, "Get in touch" top-right from md and bottom-centre on base.
test.describe("navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has the logomark home link and every section link", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Studio Coal home" })).toHaveAttribute("href", "/");
    for (const label of ["Work", "Services", "Process", "Journal", "About"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("marks the home link as the current page on /", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Studio Coal home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.locator("[data-slot=nav-item][aria-current]")).toHaveCount(0);
  });

  test("keeps every link inside the pill", async ({ page }) => {
    const pill = await page.getByRole("navigation", { name: "Main" }).boundingBox();
    const items = await page.locator("[data-slot=nav-item]").all();
    for (const item of items) {
      const box = await item.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(pill!.x + pill!.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  });

  test("places Get in touch per breakpoint", async ({ page }) => {
    const viewport = page.viewportSize()!;
    const box = (await page.getByRole("button", { name: "Get in touch" }).boundingBox())!;
    if (viewport.width < 768) {
      // Bottom centre of the viewport, 16px from the bottom edge.
      expect(Math.round(viewport.height - (box.y + box.height))).toBe(16);
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThan(1);
    } else {
      // Top right, 16px from the edges.
      expect(Math.round(box.y)).toBe(16);
      expect(Math.round(viewport.width - (box.x + box.width))).toBe(16);
    }
  });

  test("is reachable by keyboard in order", async ({ page }) => {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Studio Coal home" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Work", exact: true })).toBeFocused();
  });
});
