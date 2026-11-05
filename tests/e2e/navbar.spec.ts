import { expect, test } from "./test";

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

  test("never overflows the viewport, and every link is reachable", async ({ page }) => {
    const viewport = page.viewportSize()!;
    const pill = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
    expect(pill.x).toBeGreaterThanOrEqual(0);
    expect(pill.x + pill.width).toBeLessThanOrEqual(viewport.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    // Links that don't fit scroll inside the pill: the last one can be scrolled into view.
    const last = page.locator("[data-slot=nav-item]").last();
    await last.scrollIntoViewIfNeeded();
    const box = (await last.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(pill.x + pill.width);
  });

  test("places Get in touch per breakpoint", async ({ page }) => {
    const viewport = page.viewportSize()!;
    const box = (await page.getByRole("button", { name: "Get in touch" }).boundingBox())!;
    if (viewport.width < 768) {
      // Bottom centre of the viewport, 16px from the bottom edge.
      expect(Math.round(viewport.height - (box.y + box.height))).toBe(16);
      // Centred in the visible width: the fixed header spans it (a reserved classic-scrollbar gutter is outside).
      const width = await page.evaluate(
        () => document.querySelector("header")!.getBoundingClientRect().width,
      );
      expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThan(1);
    } else {
      // Top right, 16px from the edges.
      expect(Math.round(box.y)).toBe(16);
      const width = await page.evaluate(
        () => document.querySelector("header")!.getBoundingClientRect().width,
      );
      expect(Math.round(width - (box.x + box.width))).toBe(16);
    }
  });

  test("pill blurs the page behind it: no view-transition-name on an ancestor", async ({
    page,
  }) => {
    // A view-transition-name makes its element a backdrop root, so on an ancestor of the
    // pill the backdrop-filter would only see that (transparent) ancestor, never the page.
    const result = await page.getByRole("navigation", { name: "Main" }).evaluate((nav) => {
      const named: string[] = [];
      // <html> (view-transition-name: root) is the page itself, so it's fine.
      for (
        let el = nav.parentElement;
        el && el !== document.documentElement;
        el = el.parentElement
      ) {
        const name = getComputedStyle(el).viewTransitionName;
        if (name && name !== "none") named.push(`${el.tagName}: ${name}`);
      }
      return { filter: getComputedStyle(nav).backdropFilter, named };
    });
    expect(result.filter).toMatch(/^blur\(/);
    expect(result.named).toEqual([]);
  });

  test("is reachable by keyboard in order", async ({ page }) => {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Studio Coal home" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Work", exact: true })).toBeFocused();
  });
});
