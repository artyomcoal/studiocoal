import type { APIRoute } from "astro";
import { sanityClient } from "sanity:client";
import { robotsTxt } from "@/lib/seo";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";

// The site is hidden from search engines until launch: every build gets "Disallow: /" unless
// ALLOW_INDEXING=1 is set. Set it at launch, on the Cloudflare production build only (Worker ›
// Settings › Builds › Variables), so previews and local builds stay hidden. Once open, AI
// crawlers follow Site settings › Let AI assistants read the site (src/lib/seo.ts › robotsTxt).
export const GET: APIRoute = async ({ site }) => {
  const settings = await sanityClient.fetch(SITE_SETTINGS_QUERY);
  const body = robotsTxt({
    production: process.env.ALLOW_INDEXING === "1",
    sitemap: new URL("sitemap-index.xml", site).href,
    allowAi: settings?.aiCrawlers,
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
