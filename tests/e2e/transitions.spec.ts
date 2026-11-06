import { expect, test } from "./test";

// Page transitions (src/styles/motion.css). The entrance only plays after an in-site
// navigation, which BaseLayout detects from a same-origin referrer.
const firstSection = "main.animate-enter-stagger > :first-child";

test("direct visit renders without the entrance", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveClass(/nav-entered/);
  const animation = await page
    .locator(firstSection)
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
});

test("in-site navigation plays the entrance once the page is ready", async ({ page, baseURL }) => {
  await page.goto("/", { referer: `${baseURL}/` });
  await expect(page.locator("html")).toHaveClass(/nav-entered/);
  await expect(page.locator("html")).toHaveClass(/nav-ready/);
  const animation = await page
    .locator(firstSection)
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("page-enter");
});

test("reduced motion turns the entrance off", async ({ page, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { referer: `${baseURL}/` });
  const animation = await page
    .locator(firstSection)
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe("none");
});

test("the entrance is a plain fade: no filter on any frame", async ({ page, baseURL }) => {
  await page.goto("/", { referer: `${baseURL}/` });
  await expect(page.locator("html")).toHaveClass(/nav-ready/);
  const keyframes = await page.locator(firstSection).evaluate((el) =>
    el
      .getAnimations()
      .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes())
      .map(({ offset, opacity, filter }) => ({ offset, opacity, filter })),
  );
  expect(keyframes.length).toBeGreaterThan(0);
  for (const frame of keyframes) expect(frame.filter ?? "none").toBe("none");
});

test("sections stay hidden until the page is ready, then fade to full opacity", async ({
  page,
  baseURL,
}) => {
  // Hold nav-ready back by stalling the fonts: the sections must stay at opacity 0.
  await page.route("**/*.woff2", () => {});
  await page.goto("/", { referer: `${baseURL}/`, waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveClass(/nav-entered/);
  const hidden = await page.locator(firstSection).evaluate((el) => getComputedStyle(el).opacity);
  if (!(await page.locator("html").getAttribute("class"))?.includes("nav-ready")) {
    expect(hidden).toBe("0");
  }
  // The 1s cap releases it even though a font never arrives.
  await expect(page.locator("html")).toHaveClass(/nav-ready/, { timeout: 3000 });
  await expect
    .poll(() => page.locator(firstSection).evaluate((el) => getComputedStyle(el).opacity))
    .toBe("1");
});

test("a reload doesn't replay the entrance", async ({ page, baseURL }) => {
  await page.goto("/", { referer: `${baseURL}/` });
  await expect(page.locator("html")).toHaveClass(/nav-entered/);
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/nav-entered/);
});

test("the navbar isn't part of the transition: its old snapshot is never drawn", async ({
  page,
}) => {
  // Checked on the stylesheet: headless Chromium doesn't reliably run cross-document View
  // Transitions, so the pseudo-elements can't be inspected during one.
  await page.goto("/");
  const hidden = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .filter((rule) => rule.style.display === "none")
      .flatMap((rule) => rule.selectorText.split(",").map((s) => s.trim())),
  );
  expect(hidden).toContain("::view-transition-old(site-header)");
  expect(hidden).toContain("::view-transition-old(site-header-action)");
});

test("the View Transition opt-in is inline in <head>, before any external stylesheet", async ({
  page,
}) => {
  // From the external stylesheet, Chrome often read the opt-in before it was applied and
  // skipped the transition (cached navigations, where module scripts run first).
  await page.goto("/");
  const order = await page.evaluate(() =>
    [...document.head.querySelectorAll("style, link[rel=stylesheet]")].map((el) =>
      el instanceof HTMLStyleElement ? (el.textContent ?? "") : "external",
    ),
  );
  const optIn = order.findIndex((css) => /@view-transition\s*\{\s*navigation:\s*auto/.test(css));
  expect(optIn).toBeGreaterThanOrEqual(0);
  expect(order.slice(0, optIn)).not.toContain("external");
});

test("the navbar logo is inline SVG, so it's drawn in the new page's first frame", async ({
  page,
}) => {
  await page.goto("/");
  const logo = page.getByRole("navigation", { name: "Main" }).getByRole("img", {
    name: "Studio Coal home",
  });
  expect(await logo.evaluate((el) => el.tagName.toLowerCase())).toBe("svg");
});

test("the new page's first frame waits for the navbar, so it's always in the transition", async ({
  page,
}) => {
  await page.goto("/");
  const expectLink = page.locator('head link[rel="expect"][blocking="render"]');
  await expect(expectLink).toHaveAttribute("href", "#site-header");
  await expect(page.locator("#site-header")).toHaveAttribute("data-slot", "navbar");
});

test("the nav pill's blur moves to its transition group while a transition runs", async ({
  page,
}) => {
  // Safari bakes a named element's backdrop into its snapshot (the pill turned flat and opaque
  // mid-transition), so the group blurs the page snapshots and the pill drops its own blur.
  await page.goto("/");
  const rules = await page.evaluate(() =>
    [...document.styleSheets]
      .flatMap((sheet) => [...sheet.cssRules])
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
      .map((rule) => ({ selector: rule.selectorText, backdrop: rule.style.backdropFilter })),
  );
  expect(rules).toContainEqual({
    selector: "::view-transition-group(site-header)",
    backdrop: "blur(20px)",
  });
  expect(rules).toContainEqual({
    selector: ":root:active-view-transition .view-transition-header",
    backdrop: "none",
  });
});
