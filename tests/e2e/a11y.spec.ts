import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// CLAUDE.md: WCAG 2.2 AA, except colour contrast. The low-contrast text tokens (fg-secondary,
// fg-tertiary in light mode) are an accepted design decision, so `color-contrast` is disabled.
for (const route of routes) {
  test(`${route.name} has no axe violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .disableRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
