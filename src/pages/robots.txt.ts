import type { APIRoute } from "astro";

// The site is hidden from search engines until launch: every build gets "Disallow: /" unless
// ALLOW_INDEXING=1 is set. Set it at launch, on the Cloudflare production build only (Worker ›
// Settings › Builds › Variables), so previews and local builds stay hidden.
export const GET: APIRoute = ({ site }) => {
  const isProduction = process.env.ALLOW_INDEXING === "1";
  const body = isProduction
    ? ["User-agent: *", "Disallow: /studio", "", `Sitemap: ${new URL("sitemap-index.xml", site)}`]
    : ["User-agent: *", "Disallow: /"];
  return new Response(`${body.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
