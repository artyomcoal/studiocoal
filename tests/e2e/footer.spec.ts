import type { Page } from "@playwright/test";
import { expect, test } from "./test";

// Footer (src/components/Footer.astro): contact, service and social links, and the newsletter
// form, which shows its success message only after the endpoint answers 2xx.
const ENDPOINT = "/__test-newsletter";

/** Point the form at a mocked endpoint (the build may have no PUBLIC_NEWSLETTER_ENDPOINT). */
async function mockNewsletter(page: Page, status: number) {
  await page.route(`**${ENDPOINT}`, (route) => route.fulfill({ status, body: "{}" }));
  await page
    .locator("[data-newsletter-form]")
    .evaluate((form, action) => form.setAttribute("action", action), ENDPOINT);
}

test.describe("footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has email, service and social links", async ({ page }) => {
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "hello@studiocoal.com" })).toHaveAttribute(
      "href",
      "mailto:hello@studiocoal.com",
    );
    const services = footer.getByRole("navigation", { name: "Services" });
    await expect(services.getByRole("link", { name: "Brand" })).toHaveAttribute(
      "href",
      "/services#brand",
    );
    const connect = footer.getByRole("navigation", { name: "Connect" });
    const social = connect.getByRole("link").first();
    await expect(social).toHaveAttribute("target", "_blank");
    await expect(social).toHaveAccessibleName(/\(opens in a new tab\)$/);
  });

  test("links turn fg-secondary on hover", async ({ page }) => {
    const link = page.getByRole("contentinfo").getByRole("link", { name: "Brand" });
    const color = () => link.evaluate((el) => getComputedStyle(el).color);
    const [primary, secondary] = await page.evaluate(() => {
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.className = "text-fg-primary";
      const a = getComputedStyle(probe).color;
      probe.className = "text-fg-secondary";
      const b = getComputedStyle(probe).color;
      probe.remove();
      return [a, b];
    });
    expect(await color()).toBe(primary);
    await link.hover();
    await expect.poll(color).toBe(secondary);
  });

  test("shows the success message only after a successful sign-up", async ({ page }) => {
    const field = page.getByRole("textbox", { name: "Email address" });
    const status = page.locator("[data-newsletter-status]");

    await mockNewsletter(page, 500);
    await field.fill("test@example.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect
      .poll(() => field.evaluate((el: HTMLInputElement) => el.validationMessage))
      .not.toBe("");
    await expect(status).toBeEmpty();

    await mockNewsletter(page, 200);
    await field.fill("test@example.com");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(status).toHaveText("Thank you. We’ll see you soon.");
    await expect(field).toHaveValue("");
  });

  test("leaves invalid addresses to native validation", async ({ page }) => {
    let requested = false;
    await page.route(`**${ENDPOINT}`, (route) => {
      requested = true;
      return route.fulfill({ status: 200 });
    });
    await page
      .locator("[data-newsletter-form]")
      .evaluate((form, action) => form.setAttribute("action", action), ENDPOINT);
    const field = page.getByRole("textbox", { name: "Email address" });
    await field.fill("hello@");
    await page.getByRole("button", { name: "Submit" }).click();
    expect(await field.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
    await expect(page.locator("[data-newsletter-status]")).toBeEmpty();
    expect(requested).toBe(false);
  });
});
