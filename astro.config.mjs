// @ts-check
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { createClient } from "@sanity/client";
import { defineConfig } from "astro/config";
import { SITEMAP_QUERY } from "./src/sanity/queries.ts";

// Load .env when present (local dev); in CI and on Vercel the variables come from the environment.
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

const site = "https://studiocoal.com";
const apiVersion = "2026-11-01";

// Sitemap data for project and post pages: last-modified dates, and the pages hidden from
// search engines (SEO › Hide from search engines), which the sitemap leaves out.
const sitemapPages = await createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET,
  apiVersion,
  useCdn: false,
}).fetch(SITEMAP_QUERY);
/** @param {string} url */
const pathOf = (url) => new URL(url).pathname.replace(/\/+$/, "") || "/";
const pageByPath = new Map(
  sitemapPages.map((page) => [`/${page._type === "work" ? "work" : "journal"}/${page.slug}`, page]),
);

// https://astro.build/config
export default defineConfig({
  // Canonical production origin. Used for canonical URLs, Open Graph URLs and the sitemap.
  site,
  integrations: [
    // Match on the path: the full URL (https://studiocoal.com/…) itself contains "/studio".
    sitemap({
      filter: (page) => {
        const path = pathOf(page);
        return !path.startsWith("/studio") && !pageByPath.get(path)?.noIndex;
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
  },
});
