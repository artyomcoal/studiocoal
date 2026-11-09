/**
 * /llms.txt: a Markdown guide to the site for AI assistants (src/lib/llms.ts). The studio
 * profile and the questions come from Site settings › Search and AI, each fixed page's line
 * from Pages › Summary for AI assistants. Pages hidden from search engines are left out.
 */
import type { APIRoute } from "astro";
import { sanityClient } from "sanity:client";
import { buildLlmsTxt } from "@/lib/llms";
import { pageDocumentId, PAGES } from "@/lib/pages";
import { canonicalUrl, contentPath, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { LLMS_QUERY, PAGES_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/queries";

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? "https://studiocoal.com";
  const [settings, pages, content] = await Promise.all([
    sanityClient.fetch(SITE_SETTINGS_QUERY),
    sanityClient.fetch(PAGES_QUERY),
    sanityClient.fetch(LLMS_QUERY),
  ]);
  const pageById = new Map(pages.map((page) => [page._id, page]));

  const body = buildLlmsTxt({
    name: SITE_NAME,
    summary: settings?.aiSummary || settings?.description || DEFAULT_DESCRIPTION,
    faq: settings?.faq,
    sections: [
      {
        title: "Pages",
        links: PAGES.flatMap((info) => {
          const page = pageById.get(pageDocumentId(info.key));
          return page?.noIndex
            ? []
            : [
                {
                  title: info.name,
                  url: canonicalUrl(info.path, origin),
                  description: page?.aiSummary || page?.description || info.description,
                },
              ];
        }),
      },
      {
        title: "Work",
        links: content.work.flatMap(({ title, slug, description }) =>
          title && slug
            ? [{ title, url: canonicalUrl(contentPath("work", slug), origin), description }]
            : [],
        ),
      },
      {
        title: "Journal",
        links: content.journal.flatMap(({ title, slug, description }) =>
          title && slug
            ? [{ title, url: canonicalUrl(contentPath("journal", slug), origin), description }]
            : [],
        ),
      },
    ],
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
