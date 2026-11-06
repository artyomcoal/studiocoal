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
  test.describe("shared pill", () => {
    // The pill box vs an item's box, in viewport pixels.
    const pillMatches = (page: import("@playwright/test").Page, label: string) =>
      page.evaluate((label) => {
        const pill = document.querySelector("[data-nav-pill]")!.getBoundingClientRect();
        const item = [...document.querySelectorAll("[data-slot=nav-item]")]
          .find((el) => el.textContent?.trim() === label)!
          .getBoundingClientRect();
        return Math.abs(pill.left - item.left) < 1 && Math.abs(pill.width - item.width) < 1;
      }, label);

    test("on load the current item has its own background and the pill is hidden", async ({
      page,
    }) => {
      // Nothing is measured or animated on load: the pill only takes over on interaction.
      await page.goto("/work");
      const pill = page.locator("[data-nav-pill]");
      await expect(pill).toHaveCSS("opacity", "0");
      expect(await pill.evaluate((el) => el.getAnimations().length)).toBe(0);
      const work = page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Work", exact: true });
      await expect(work).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    });

    test("takes over from the current item's background, then follows the pointer", async ({
      page,
    }) => {
      await page.goto("/work");
      const nav = page.getByRole("navigation", { name: "Main" });
      const work = nav.getByRole("link", { name: "Work", exact: true });
      const fill = await work.evaluate((el) => getComputedStyle(el).backgroundColor);
      await work.hover();
      await expect(page.locator("[data-nav-pill]")).toHaveCSS("opacity", "1");
      await expect(page.locator("[data-nav-pill]")).toHaveCSS("background-color", fill);
      await expect(work).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      expect(await pillMatches(page, "Work")).toBe(true);
    });

    test("slides to a hovered item and back, without changing the text colours", async ({
      page,
      isMobile,
    }) => {
      test.skip(!!isMobile, "hover");
      await page.goto("/work");
      const nav = page.getByRole("navigation", { name: "Main" });
      const work = nav.getByRole("link", { name: "Work", exact: true });
      const about = nav.getByRole("link", { name: "About", exact: true });
      const workColor = await work.evaluate((el) => getComputedStyle(el).color);
      const aboutColor = await about.evaluate((el) => getComputedStyle(el).color);
      await about.hover();
      await expect.poll(() => pillMatches(page, "About")).toBe(true);
      await expect(work).toHaveCSS("color", workColor);
      await expect(about).toHaveCSS("color", aboutColor);
      await page.mouse.move(5, 500);
      await expect.poll(() => pillMatches(page, "Work")).toBe(true);
    });

    test("a click swaps the text colours at once, before the next page loads", async ({ page }) => {
      // Read the final colours (transition off) in the click event itself, on the old page.
      await page.addInitScript(() =>
        addEventListener("click", () => {
          const colour = (label: string) => {
            const el = [...document.querySelectorAll<HTMLElement>("[data-slot=nav-item]")].find(
              (item) => item.textContent?.trim() === label,
            )!;
            el.style.transition = "none";
            return getComputedStyle(el).color;
          };
          sessionStorage.setItem("navColours", JSON.stringify([colour("Work"), colour("About")]));
        }),
      );
      await page.goto("/work");
      const nav = page.getByRole("navigation", { name: "Main" });
      const before = await Promise.all(
        ["Work", "About"].map((name) =>
          nav.getByRole("link", { name, exact: true }).evaluate((el) => getComputedStyle(el).color),
        ),
      );
      await nav.getByRole("link", { name: "About", exact: true }).click();
      await page.waitForURL("**/about");
      const [work, about] = JSON.parse(
        (await page.evaluate(() => sessionStorage.getItem("navColours")))!,
      );
      expect(about).toBe(before[0]); // About took the current (primary) colour
      expect(work).toBe(before[1]); // Work took the secondary colour
    });

    test("follows keyboard focus", async ({ page }) => {
      await page.goto("/work");
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Journal", exact: true })
        .focus();
      await expect.poll(() => pillMatches(page, "Journal")).toBe(true);
    });
  });
  test.describe("journal article bar", () => {
    test("scrolling down swaps the nav items for the article bar, scrolling up swaps back", async ({
      page,
    }) => {
      await page.goto("/journal/quiet-interfaces");
      const nav = page.getByRole("navigation", { name: "Main" });
      const bar = nav.locator("[data-nav-article]");
      const list = nav.locator("[data-nav-list]");
      await expect(nav).not.toHaveAttribute("data-mode", "article");
      expect(await bar.evaluate((el) => (el as HTMLElement).inert)).toBe(true);

      await page.evaluate(() => window.scrollTo(0, 400));
      await page.evaluate(() => window.scrollBy(0, 200));
      await expect(nav).toHaveAttribute("data-mode", "article");
      expect(await list.evaluate((el) => (el as HTMLElement).inert)).toBe(true);
      expect(await bar.evaluate((el) => (el as HTMLElement).inert)).toBe(false);
      // One line: the title truncates instead of wrapping.
      const title = bar.locator("[data-nav-title-current]");
      await title.evaluate((el) => (el.textContent = "A very long article title ".repeat(6)));
      const box = await title.boundingBox();
      expect(box!.height).toBeLessThanOrEqual(20);
      expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
      // Arrows point at the neighbouring posts (or are disabled at the ends).
      for (const link of await bar.locator("a").all())
        expect(await link.getAttribute("href")).toMatch(/^\/journal\/[^/]+$/);

      await page.evaluate(() => window.scrollBy(0, -200));
      await expect(nav).not.toHaveAttribute("data-mode", "article");
      expect(await list.evaluate((el) => (el as HTMLElement).inert)).toBe(false);
    });

    test("an article arrow opens the next article with the article bar already shown", async ({
      page,
    }) => {
      await page.goto("/journal/quiet-interfaces");
      const nav = page.getByRole("navigation", { name: "Main" });
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.evaluate(() => window.scrollBy(0, 200));
      await expect(nav).toHaveAttribute("data-mode", "article");
      const arrow = nav.locator("[data-nav-article] a").first();
      const href = (await arrow.getAttribute("href"))!;
      await arrow.click();
      await page.waitForURL(`**${href}`);
      await expect(nav).toHaveAttribute("data-mode", "article");
      // The title swap ends with only the new title, at rest; the previous one is gone.
      const bar = nav.locator("[data-nav-article]");
      await expect(bar.locator("[data-nav-title-prev]")).toBeHidden();
      await expect(bar.locator("[data-nav-title-current]")).not.toHaveAttribute("data-from", "");
      // A nudge at the top doesn't switch back; scrolling up after 100px does. Each step waits a
      // frame or two, so every scroll position fires its own scroll event.
      const scrollTo = async (y: number) => {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        await page.waitForTimeout(100);
      };
      await scrollTo(20);
      await scrollTo(0);
      await expect(nav).toHaveAttribute("data-mode", "article");
      await scrollTo(300);
      await scrollTo(200);
      await expect(nav).not.toHaveAttribute("data-mode", "article");
    });

    test("other pages have no article bar", async ({ page }) => {
      await page.goto("/work");
      await expect(page.locator("[data-nav-article]")).toHaveCount(0);
    });
  });
});
