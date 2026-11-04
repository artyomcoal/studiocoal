import type { APIRoute } from "astro";

// Only the production deployment may be indexed. Vercel sets VERCEL_ENV at build time;
// previews and local builds get "Disallow: /".
export const GET: APIRoute = ({ site }) => {
  const isProduction = process.env.VERCEL_ENV === "production";
  const body = isProduction
    ? ["User-agent: *", "Disallow: /studio", "", `Sitemap: ${new URL("sitemap-index.xml", site)}`]
    : ["User-agent: *", "Disallow: /"];
  return new Response(`${body.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
