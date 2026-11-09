/**
 * Web app manifest: the name and icon a phone uses when the site is added to its home
 * screen. The icons come from Site settings › Icon (src/pages/icons/[file].ts).
 */
import type { APIRoute } from "astro";
import { sanityClient } from "sanity:client";
import { manifestIcons } from "@/lib/icons";
import { SITE_NAME } from "@/lib/seo";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";

export const GET: APIRoute = async () => {
  const settings = await sanityClient.fetch(SITE_SETTINGS_QUERY);
  const manifest = {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: "/",
    display: "browser",
    icons: settings?.favicon?.asset ? manifestIcons() : [],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
};
