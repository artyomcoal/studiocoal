// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { createClient } from "@sanity/client";
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import { pageByDocumentId } from "./src/lib/pages.ts";
import { buildRedirects } from "./src/lib/redirects.ts";
import { PAGES_QUERY, REDIRECTS_QUERY, SITEMAP_QUERY } from "./src/sanity/queries.ts";

// Load .env when present (local dev); in CI and on Cloudflare the variables come from the environment.
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}
const { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } = process.env;

if (!PUBLIC_SANITY_PROJECT_ID || !PUBLIC_SANITY_DATASET) {
  throw new Error(
    "Missing PUBLIC_SANITY_PROJECT_ID or PUBLIC_SANITY_DATASET. Copy .env.example to .env.",
  );
}

// E2E_FIXTURES=1 (set by playwright.config.ts): build from the committed fixture dataset in
// tests/fixtures/sanity/ instead of the live one, so the e2e tests never depend on what's
// published. `sanity:client` is aliased to a fixture client; see CLAUDE.md › Quality › Tests.
const fixtures = process.env.E2E_FIXTURES === "1";
const fixtureModule = fixtures ? await import("./tests/fixtures/sanity/fixtures.ts") : null;
fixtureModule?.installFixtureFetch();

const site = "https://studiocoal.com";
const apiVersion = "2026-11-01";

// Sitemap data for project and post pages: last-modified dates, and the pages hidden from
// search engines (SEO › Hide from search engines), which the sitemap leaves out.
const sanityBuildClient = createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET,
  apiVersion,
  useCdn: false,
});
/** @type {typeof sanityBuildClient.fetch} */
const buildFetch = fixtureModule
  ? /** @type {any} -- fixture fetch mirrors client.fetch(query, params) */ (
      fixtureModule.fetchFixture
    )
  : sanityBuildClient.fetch.bind(sanityBuildClient);
const [sitemapPages, fixedPages, redirectSources] = await Promise.all([
  buildFetch(SITEMAP_QUERY),
  buildFetch(PAGES_QUERY),
  buildFetch(REDIRECTS_QUERY),
]);
/** @param {string} url */
const pathOf = (url) => new URL(url).pathname.replace(/\/+$/, "") || "/";
const pageByPath = new Map(
  sitemapPages.map((page) => [`/${page._type === "work" ? "work" : "journal"}/${page.slug}`, page]),
);

// Fixed pages hidden in the Studio (Pages › Hide from search engines). A hidden Journal list
// hides its further pages (/journal/2, …) too.
const hiddenPaths = new Set(
  fixedPages.flatMap((page) => {
    const path = page.noIndex ? pageByDocumentId(page._id)?.path : undefined;
    return path ? [/** @type {string} */ (path)] : [];
  }),
);
/** @param {string} path */
const isHidden = (path) =>
  hiddenPaths.has(path.replace(/^\/journal\/\d+$/, "/journal")) || !!pageByPath.get(path)?.noIndex;

// Old project / post URLs and Site settings › Redirects (src/lib/redirects.ts).
const redirects = buildRedirects(redirectSources.content, redirectSources.manual ?? []);

// https://astro.build/config
export default defineConfig({
  // Canonical production origin. Used for canonical URLs, Open Graph URLs and the sitemap.
  site,
  redirects,
  // No adapter: the site is static (Cloudflare serves dist/ as assets, see wrangler.jsonc),
  // so Astro writes each redirect as an HTML redirect page.
  integrations: [
    // Match on the path: the full URL (https://studiocoal.com/…) itself contains "/studio".
    sitemap({
      filter: (page) => {
        const path = pathOf(page);
        return !path.startsWith("/studio") && !isHidden(path);
      },
      serialize: (item) => {
        const page = pageByPath.get(pathOf(item.url));
        return page ? { ...item, lastmod: page._updatedAt } : item;
      },
    }),
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      apiVersion,
      // Static build: always read fresh content, the CDN can lag behind a publish webhook.
      useCdn: false,
      // Embedded Studio (React). Static output → the Studio uses hash routing (/studio#/…).
      studioBasePath: "/studio",
    }),
    // React is only for the embedded Studio. Never use it in src/components, src/sections or src/ui.
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Embed Graphik in the CSS (src/styles/typography.css explains why); everything else keeps
      // Vite's default (inline below 4 KB).
      assetsInlineLimit: (file, content) =>
        file.endsWith("Graphik_Medium.woff2") ? true : content.length < 4096,
    },
    // Dev only: pre-bundle the Studio's Vision tool at startup. Otherwise Vite finds it on the
    // first /studio visit, re-bundles and reloads the page (a blank Studio and "Outdated
    // Optimize Dep" errors until then).
    optimizeDeps: { include: ["@sanity/vision"] },
    define: fixtureModule
      ? { "import.meta.env.COPYRIGHT_YEAR": JSON.stringify(fixtureModule.FIXTURE_YEAR) }
      : {},
    resolve: {
      alias: fixtures
        ? [
            {
              find: /^sanity:client$/,
              replacement: fileURLToPath(
                new URL("./tests/fixtures/sanity/sanity-client.ts", import.meta.url),
              ),
            },
          ]
        : [],
    },
  },
});
