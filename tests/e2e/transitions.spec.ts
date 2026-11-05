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

test("in-site navigation plays the entrance", async ({ page, baseURL }) => {
  await page.goto("/", { referer: `${baseURL}/` });
  await expect(page.locator("html")).toHaveClass(/nav-entered/);
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
  const keyframes = await page.locator(firstSection).evaluate((el) =>
    el
      .getAnimations()
      .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes())
      .map(({ offset, opacity, filter }) => ({ offset, opacity, filter })),
  );
  expect(keyframes.length).toBeGreaterThan(0);
  for (const frame of keyframes) expect(frame.filter ?? "none").toBe("none");
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
