/**
 * Social share image of a project or post: /og/work/<slug>.png, /og/journal/<slug>.png.
 * Rendered at build time (src/lib/social-image.ts). Built only when the Graphik OTF/TTF is
 * present, and only for pages without SEO › Social image.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import { sanityClient } from "sanity:client";
import { fetchAsDataUrl, renderSocialImage, socialImagesEnabled } from "@/lib/social-image";
import { urlFor } from "@/sanity/image";
import { SOCIAL_IMAGES_QUERY } from "@/sanity/queries";

const EYEBROW = { work: "Work", journal: "Journal" } as const;

export const getStaticPaths = (async () => {
  if (!socialImagesEnabled()) {
    console.warn("[og] Graphik OTF/TTF not found in src/assets/fonts/: skipping social images.");
    return [];
  }
  const pages = await sanityClient.fetch(SOCIAL_IMAGES_QUERY);
  return pages.flatMap((page) =>
    page.slug && (page._type === "work" || page._type === "journal")
      ? [{ params: { type: page._type, slug: page.slug }, props: { page } }]
      : [],
  );
}) satisfies GetStaticPaths;

type Props = { page: Awaited<ReturnType<typeof getStaticPaths>>[number]["props"]["page"] };

export const GET: APIRoute<Props> = async ({ props: { page } }) => {
  const visual = page.visual?.asset
    ? await fetchAsDataUrl(
        urlFor(page.visual).width(1200).height(630).fit("crop").format("jpg").url(),
      )
    : null;
  const png = await renderSocialImage({
    eyebrow: EYEBROW[page._type as keyof typeof EYEBROW],
    title: page.title ?? "",
    image: visual,
  });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
