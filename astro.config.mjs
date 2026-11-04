// @ts-check
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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

// https://astro.build/config
export default defineConfig({
  integrations: [
    sanity({
      projectId: PUBLIC_SANITY_PROJECT_ID,
      dataset: PUBLIC_SANITY_DATASET,
      apiVersion: "2026-11-01",
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
