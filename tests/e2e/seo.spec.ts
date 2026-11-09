import { expect, test } from "./test";

// Studio-controlled search, sharing and AI settings, as set in the fixtures
// (tests/fixtures/sanity/dataset.ndjson): Site settings, and the "page" documents of About
// (own description and AI summary) and Cookie Policy (hidden from search engines).

test("a fixed page takes its search texts from its Studio document", async ({ page }) => {
  await page.goto("/about");
  // Title: built in (src/lib/pages.ts). Description: from the Studio.
  await expect(page).toHaveTitle("About — Studio Coal");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Fixture description of the About page/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

  const graph = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  )["@graph"] as Record<string, unknown>[];
  const about = graph.find((node) => node["@type"] === "AboutPage");
  expect(about?.abstract).toMatch(/^The About page introduces/);
  expect(graph.find((node) => node["@type"] === "Organization")?.logo).toBe(
    "https://studiocoal.com/icons/icon-512.png",
  );
});

test("a page without a Studio document keeps its built-in texts", async ({ page }) => {
  await page.goto("/services");
  await expect(page).toHaveTitle("Services — Studio Coal");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Brand, web and product/,
  );
});

test("a hidden page is noindex and left out of the sitemap and llms.txt", async ({
  page,
  request,
}) => {
  await page.goto("/cookie-policy");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  expect(sitemap).toContain("https://studiocoal.com/about");
  expect(sitemap).not.toContain("cookie-policy");

  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).not.toContain("cookie-policy");
});

test("site settings reach the head: icons, manifest and verification", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="icon"][sizes="48x48"]')).toHaveAttribute(
    "href",
    "/icons/icon-48.png",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/icons/apple-touch-icon.png",
  );
  await expect(page.locator('meta[name="google-site-verification"]')).toHaveAttribute(
    "content",
    "fixture-google-code",
  );
  await expect(page.locator('meta[name="msvalidate.01"]')).toHaveCount(0);

  const icon = await request.get("/icons/apple-touch-icon.png");
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toContain("image/png");

  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.name).toBe("Studio Coal");
  expect(manifest.icons).toHaveLength(3);
});

test("llms.txt introduces the studio, answers questions and lists the pages", async ({
  request,
}) => {
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toMatch(/^# Studio Coal\n\n> Studio Coal is a fictional fixture studio/);
  expect(llms).toContain("- **What does Studio Coal do?** Brand identity, websites");
  expect(llms).toContain(
    "- [About](https://studiocoal.com/about): The About page introduces the fixture studio",
  );
  expect(llms).toContain("## Work\n\n- [");
  expect(llms).toContain("## Journal\n\n- [");
});
