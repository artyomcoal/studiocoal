import { expect, test } from "@playwright/test";

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
