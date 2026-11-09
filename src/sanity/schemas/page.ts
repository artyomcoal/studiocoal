import { defineField, defineType } from "sanity";
import { pageByDocumentId } from "../../lib/pages";
import { SEO_DESCRIPTION_LIMIT } from "../../lib/seo";

/**
 * Search, sharing and AI settings of one of the site's fixed pages (Home, Work, Services,
 * Process, Journal, About, Cookie Policy). One document per page, with a fixed id
 * (src/lib/pages.ts › pageDocumentId), opened from Structure › Pages. The page's content
 * itself lives in the site's code; every field here is optional.
 */
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fieldsets: [
    {
      name: "ai",
      title: "AI assistants",
      description:
        "For ChatGPT, Claude, Perplexity and other assistants that answer questions about the studio.",
    },
  ],
  fields: [
    // An object field is a section of its own: no fieldset around it, or its heading shows twice.
    defineField({
      name: "seo",
      title: "Search and sharing",
      description:
        "How this page appears in search results and when its link is shared. Left empty, the page keeps its built-in texts and the site's default share image.",
      type: "seo",
    }),
    defineField({
      name: "aiSummary",
      title: "Summary for AI assistants",
      description:
        "Two or three plain sentences on what this page tells a visitor: facts, not slogans. Added to the page's information for search engines and to /llms.txt. Left empty, the search description is used.",
      type: "text",
      rows: 4,
      fieldset: "ai",
      validation: (rule) =>
        rule
          .max(SEO_DESCRIPTION_LIMIT * 3)
          .warning("Keep it short: assistants quote the first sentences."),
    }),
  ],
  preview: {
    select: { id: "_id" },
    prepare: ({ id }) => {
      const info = pageByDocumentId(id);
      return { title: info?.name ?? "Page", subtitle: info ? `studiocoal.com${info.path}` : "" };
    },
  },
});
