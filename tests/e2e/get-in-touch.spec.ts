import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Get in touch dialog (src/components/GetInTouchModal.astro), opened from the Navbar button.
const trigger = (page: Page) => page.getByRole("button", { name: "Get in touch" });
const dialog = (page: Page) => page.getByRole("dialog");

async function open(page: Page) {
  await trigger(page).click();
  await expect(dialog(page)).toBeVisible();
  // Wait for the opening transition to settle before measuring.
  await expect(dialog(page)).toHaveCSS("opacity", "1");
}

test.describe("get in touch dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("opens as a labelled modal dialog", async ({ page }) => {
    await expect(dialog(page)).toBeHidden();
    await open(page);
    await expect(dialog(page)).toHaveAttribute("aria-modal", "true");
    await expect(dialog(page)).toHaveAccessibleName(/^Get in touch\. Tell us what’s coming up/);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-slot=dialog-overlay]")).toBeVisible();
  });

  test("sits under the button (md+) or centred above it (base)", async ({ page }) => {
    await open(page);
    const viewport = page.viewportSize()!;
    const panel = (await dialog(page).boundingBox())!;
    const button = (await trigger(page).boundingBox())!;
    expect(panel.width).toBeLessThanOrEqual(384);
    if (viewport.width < 768) {
      expect(Math.round(button.y - (panel.y + panel.height))).toBe(16);
      expect(Math.abs(panel.x + panel.width / 2 - viewport.width / 2)).toBeLessThan(1);
    } else {
      expect(panel.width).toBe(384);
      expect(Math.round(panel.y - (button.y + button.height))).toBe(16);
      expect(Math.round(panel.x + panel.width)).toBe(Math.round(button.x + button.width));
    }
  });

  test("closes on Escape and returns focus to the trigger", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(trigger(page)).toBeFocused();
  });

  test("closes with the close button", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: "Close" }).click();
    await expect(dialog(page)).toBeHidden();
  });

  test("closes on a click outside the panel", async ({ page }) => {
    await open(page);
    await page.mouse.click(4, page.viewportSize()!.height / 2);
    await expect(dialog(page)).toBeHidden();
  });

  test("copies an address and confirms with Copied!", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page);
    const copy = dialog(page).getByRole("button", { name: "Copy hello@studiocoal.com" });
    await copy.click();
    await expect(copy).toHaveText("Copied!");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("hello@studiocoal.com");
    await expect(copy).toHaveText("Copy", { timeout: 4000 });
  });

  test("has no axe violations while open", async ({ page }) => {
    await open(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .disableRules(["color-contrast"]) // Accepted design decision (CLAUDE.md › Accessibility).
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
