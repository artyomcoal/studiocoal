import { defineArrayMember, defineField, defineType } from "sanity";
import { SERVICES, serviceTitle } from "../../lib/services";
import { mediaAspect } from "./media";

/** How many projects the home page's Featured Work section shows (src/pages/index.astro). */
const HOME_FEATURED_LIMIT = 6;

/**
 * GROQ condition for a Work document that's missing something the site shows. Used by the
 * Studio's "Needs attention" list, and mirrors the fields' required validation.
 */
export const WORK_NEEDS_ATTENTION_FILTER = [
  "!defined(slug.current)",
  "!defined(excerpt)",
  "count(coalesce(services, [])) == 0",
  "!defined(listingMedia)",
  "count(coalesce(archiveMedia, [])) != 3",
  "!defined(heroMedia)",
].join(" || ");

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  // Tabs follow where things appear: cards (Overview), the project page, visuals, search.
  groups: [
    { name: "details", title: "Overview", default: true },
    { name: "page", title: "Project page" },
    { name: "visuals", title: "Visuals" },
    { name: "seo", title: "SEO" },
  ],
  fieldsets: [
    { name: "meta", title: "Client and year", options: { columns: 2 } },
    {
      name: "story",
      title: "Story",
      description: "Challenge, solution and outcome, shown in this order on the project page.",
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      type: "string",
      group: "details",
      description: "Shown on project cards and as the project page title.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL",
      type: "slug",
      group: "details",
      description:
        "The project page address: studiocoal.com/work/<this>. Generate it from the name.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "string",
      group: "details",
      fieldset: "meta",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      group: "details",
      fieldset: "meta",
      description: "Projects are listed newest first.",
      initialValue: () => new Date().getFullYear(),
      validation: (rule) => [
        rule.integer().min(2000),
        rule.max(new Date().getFullYear() + 1).warning("Is the year right?"),
        // A custom rule, not required(): typegen would then type the field as always present.
        rule
          .custom((value) =>
            value === undefined ? "Without a year the project sorts to the end." : true,
          )
          .warning(),
      ],
    }),
    defineField({
      name: "services",
      title: "Project type",
      description:
        "Services we delivered. Shown as tags on project cards, and links the project to that service on the Services page.",
      type: "array",
      group: "details",
      of: [{ type: "string" }],
      options: { list: SERVICES.map(({ title, value }) => ({ title, value })), layout: "grid" },
      validation: (rule) => rule.min(1).warning("Pick at least one project type."),
    }),
    defineField({
      name: "excerpt",
      title: "Description",
      description:
        "What the company does and how we helped, in one or two sentences. Shown on project cards, and used for search results unless SEO › Description is set.",
      type: "text",
      rows: 3,
      group: "details",
      validation: (rule) => [
        rule
          .custom((value) => (value ? true : "Project cards show this under the name."))
          .warning(),
        rule.max(200).warning("Keep it short: cards show it in full."),
      ],
    }),
    defineField({
      name: "industry",
      title: "Industry",
      description: "Tags, e.g. DevTools, Fintech.",
      type: "array",
      group: "page",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "deliverables",
      title: "Services delivered",
      description: "Tags on the project page, e.g. Brand Strategy, Website, Product Design.",
      type: "array",
      group: "page",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      rows: 5,
      group: "page",
      fieldset: "story",
    }),
    defineField({
      name: "solution",
      title: "Solution",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      rows: 5,
      group: "page",
      fieldset: "story",
    }),
    defineField({
      name: "outcome",
      title: "Outcome",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      rows: 5,
      group: "page",
      fieldset: "story",
    }),
    defineField({
      name: "results",
      title: "Measurable results",
      description: "Up to three figures, e.g. 20% / Success metric.",
      type: "array",
      group: "page",
      of: [
        defineArrayMember({
          type: "object",
          name: "result",
          fields: [
            defineField({
              name: "value",
              title: "Figure",
              type: "string",
              validation: (rule) => rule.required().max(8),
            }),
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
      validation: (rule) => rule.max(3),
    }),
    defineField({
      name: "websiteUrl",
      title: "Website",
      description: 'Live site, shown as a "View website" button.',
      type: "url",
      group: "page",
      validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "details",
      description: `The home page shows ${HOME_FEATURED_LIMIT} projects: featured ones first (newest first), then the newest of the rest.`,
      initialValue: false,
      validation: (rule) =>
        rule
          .custom(async (value, context) => {
            if (value !== true) return true;
            const id = context.document?._id.replace(/^drafts\./, "");
            const others = await context
              .getClient({ apiVersion: "2026-11-01" })
              .fetch<number>(
                `count(*[_type == "work" && featured == true && !(_id in path("drafts.**")) && _id != $id])`,
                { id },
              );
            return others >= HOME_FEATURED_LIMIT
              ? `${others} other projects are already featured. The home page shows ${HOME_FEATURED_LIMIT}, so the oldest featured ones won't appear.`
              : true;
          })
          .warning(),
    }),

    defineField({
      name: "listingMedia",
      title: "Listing visual (4:5)",
      description:
        "Project card on the home, services and about pages, and in recent work sections.",
      type: "media",
      group: "visuals",
      validation: (rule) => [rule.required(), rule.custom(mediaAspect("portrait")).warning()],
    }),
    defineField({
      name: "archiveMedia",
      title: "Archive visuals (3 × 4:5)",
      description: "Exactly three visuals, shown in this order on the Work page.",
      type: "array",
      group: "visuals",
      of: [
        defineArrayMember({
          type: "media",
          validation: (rule) => rule.custom(mediaAspect("portrait")).warning(),
        }),
      ],
      validation: (rule) => rule.required().length(3),
    }),
    defineField({
      name: "heroMedia",
      title: "Project hero (16:9)",
      description: "Full-width visual at the top of the project page.",
      type: "media",
      group: "visuals",
      validation: (rule) => [rule.required(), rule.custom(mediaAspect("landscape")).warning()],
    }),
    defineField({
      name: "content",
      title: "Project content",
      description: "Visuals on the project page, top to bottom. Drag to reorder.",
      type: "array",
      group: "visuals",
      of: [defineArrayMember({ type: "mediaFullWidth" }), defineArrayMember({ type: "mediaPair" })],
    }),

    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
  ],
  orderings: [
    {
      title: "Year, newest first",
      name: "yearDesc",
      by: [
        { field: "year", direction: "desc" },
        { field: "_createdAt", direction: "desc" },
      ],
    },
    { title: "Year, oldest first", name: "yearAsc", by: [{ field: "year", direction: "asc" }] },
    { title: "Project name, A–Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
    { title: "Client, A–Z", name: "clientAsc", by: [{ field: "client", direction: "asc" }] },
    {
      title: "Featured first",
      name: "featuredFirst",
      by: [
        { field: "featured", direction: "desc" },
        { field: "year", direction: "desc" },
      ],
    },
    {
      title: "Recently edited",
      name: "updatedDesc",
      by: [{ field: "_updatedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      client: "client",
      year: "year",
      featured: "featured",
      services: "services",
      kind: "listingMedia.kind",
      image: "listingMedia.image",
      poster: "listingMedia.video.poster",
    },
    // List rows read "Client · Year · Featured", with the project types underneath.
    prepare: ({ title, client, year, featured, services, kind, image, poster }) => ({
      title: title || "Untitled project",
      subtitle: [client, year, featured && "Featured"].filter(Boolean).join(" · "),
      description: ((services as string[] | undefined) ?? []).map(serviceTitle).join(", "),
      media: kind === "video" ? poster : image,
    }),
  },
});
