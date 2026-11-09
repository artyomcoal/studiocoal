/**
 * Browser and device icons: /icons/icon-48.png, /icons/apple-touch-icon.png, …
 * (src/lib/icons.ts). Rendered at build time from Site settings › Icon, so they are static
 * files on the site's own origin. Without an icon in the Studio none are built and the site
 * keeps its built-in /favicon.svg.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { sanityClient } from "sanity:client";
import { ICONS } from "@/lib/icons";
import { urlFor } from "@/sanity/image";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";

export const getStaticPaths = (async () => {
  const settings = await sanityClient.fetch(SITE_SETTINGS_QUERY);
  const favicon = settings?.favicon;
  if (!favicon?.asset) return [];
  return ICONS.map(({ file, size }) => ({
    params: { file },
    props: { url: urlFor(favicon).width(size).height(size).fit("crop").format("png").url() },
  }));
}) satisfies GetStaticPaths;

interface Props {
  url: string;
}

export const GET: APIRoute<Props> = async ({ props: { url } }) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`[icons] ${response.status} for ${url}`);
  return new Response(await response.arrayBuffer(), { headers: { "Content-Type": "image/png" } });
};
