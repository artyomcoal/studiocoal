import { defineField, defineType } from "sanity";
import {
  pageTitle,
  SEO_DESCRIPTION_LIMIT,
  SEO_DESCRIPTION_MIN,
  SEO_PAGE_TITLE_MAX,
  SEO_TITLE_LIMIT,
} from "../../lib/seo";
import { SeoInput } from "../components/SeoInput";

/**
 * Per-document SEO overrides. Every field is optional: left empty, the page uses the
 * document's own title, excerpt and visual (src/lib/seo.ts › contentSeo). The input shows a
 * search result preview with the values that will actually ship.
 */
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  components: { input: SeoInput },
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      description: `Leave empty to use the page title. Google shows about ${SEO_TITLE_LIMIT} characters, including " — Studio Coal".`,
      validation: (rule) =>
        rule
          .custom((value) =>
            value && pageTitle(value).length > SEO_TITLE_LIMIT
              ? `Google will cut this off: keep it under ${SEO_PAGE_TITLE_MAX} characters.`
              : true,
          )
          .warning(),
    }),
    defineField({
      name: "description",
      title: "Search description",
      type: "text",
      rows: 3,
      description: `Leave empty to use the description. ${SEO_DESCRIPTION_MIN}–${SEO_DESCRIPTION_LIMIT} characters works best.`,
      validation: (rule) => [
        rule.max(SEO_DESCRIPTION_LIMIT).warning("Google will cut this off."),
        rule.min(SEO_DESCRIPTION_MIN).warning("Short descriptions are often replaced by Google."),
      ],
    }),
    defineField({
      name: "image",
      title: "Social image",
      type: "image",
      options: { hotspot: true },
      description:
        "Shown when the page is shared (cropped to 1200 × 630). Leave empty to use the page's main visual.",
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      description:
        "Asks Google and others not to list this page, and leaves it out of the sitemap. The page stays reachable by its link.",
      initialValue: false,
      // A site-wide noindex belongs to robots.txt, not to Site settings.
      hidden: ({ document }) => document?._type === "siteSettings",
    }),
  ],
});
