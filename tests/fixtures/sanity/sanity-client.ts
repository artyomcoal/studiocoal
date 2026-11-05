/**
 * Stand-in for `sanity:client` in fixture mode (astro.config.mjs aliases the virtual module
 * here when `E2E_FIXTURES=1`). Same `sanityClient` export, but `fetch` reads the committed
 * fixtures (./fixtures.ts) and the image URL builder points at the fixture dataset.
 */
import { createClient, type SanityClient } from "@sanity/client";
import { FIXTURE_DATASET, fetchFixture, installFixtureFetch } from "./fixtures";

installFixtureFetch();

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID ?? "fixtures",
  dataset: FIXTURE_DATASET,
  apiVersion: "2026-11-01",
  useCdn: false,
});
// The site only calls `fetch(query, params)`; the client's overloads can't be matched one by one.
client.fetch = ((query: string, params?: Record<string, unknown>) =>
  fetchFixture(query, params)) as SanityClient["fetch"];

export const sanityClient = client;
