import type { APIRoute } from "astro";

// Only the production deployment may be indexed. Cloudflare Workers Builds sets
// WORKERS_CI_BRANCH at build time, and production builds from main; branch previews and
// local builds get "Disallow: /".
export const GET: APIRoute = ({ site }) => {
  const isProduction = process.env.WORKERS_CI_BRANCH === "main";
  const body = isProduction
    ? ["User-agent: *", "Disallow: /studio", "", `Sitemap: ${new URL("sitemap-index.xml", site)}`]
    : ["User-agent: *", "Disallow: /"];
  return new Response(`${body.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
