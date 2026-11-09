import type { APIRoute } from "astro";
import { sanityClient } from "sanity:client";
import { robotsTxt } from "@/lib/seo";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";

// Only the production deployment may be indexed. Vercel sets VERCEL_ENV at build time;
// previews and local builds get "Disallow: /". AI crawlers follow Site settings › Let AI
// assistants read the site (src/lib/seo.ts › robotsTxt).
export const GET: APIRoute = async ({ site }) => {
  const settings = await sanityClient.fetch(SITE_SETTINGS_QUERY);
  const body = robotsTxt({
    production: process.env.VERCEL_ENV === "production",
    sitemap: new URL("sitemap-index.xml", site).href,
    allowAi: settings?.aiCrawlers,
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
