import { defineArrayMember, defineField, defineType } from "sanity";
import { videoPreviewMedia } from "../components/BunnyThumbnail";
import { SERVICES, serviceTitle } from "../../lib/services";
import { OverviewIcon, PageIcon, SeoIcon, VisualsIcon } from "../components/icons";
import { previousSlugsField, slugField } from "./fields";
import { mediaAlt, mediaAspect } from "./media";
import { HOME_FEATURED_LIMIT } from "../filters";

/** Featured Work cards show two lines of Body SM: about 100 characters. */
const SUMMARY_MAX = 100;
/** Four sentences of Body SM on an archive card. */
const EXCERPT_MAX = 500;

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  // Tabs follow where things appear: cards and home page (Overview), the project page,
  // visuals, search. Each tab is split into sections (fieldsets) with a heading.
  groups: [
    { name: "details", title: "Overview", icon: OverviewIcon, default: true },
    { name: "page", title: "Project page", icon: PageIcon },
    { name: "visuals", title: "Visuals", icon: VisualsIcon },
    { name: "seo", title: "SEO", icon: SeoIcon },
  ],
  fieldsets: [
    // Overview
    { name: "basics", title: "Name and URL" },
    {
      name: "descriptions",
      title: "Descriptions",
      description:
        "A short one for Featured Work cards, a long one for the archive and project page.",
    },
    { name: "homePage", title: "Home page" },
    // Project page
    {
      name: "projectInfo",
      title: "Project info",
      description:
        "Shown at the top of the project page. Projects are listed by year, newest first.",
      options: { columns: 2 },
    },
    {
      name: "services",
      title: "Services",
      description: "What kind of project it was, and what we delivered.",
    },
    {
      name: "story",
      title: "Story",
      description: "Challenge, solution and outcome, shown in this order on the project page.",
    },
    { name: "results", title: "Results" },
    // Visuals
    {
      name: "cards",
      title: "Cards",
      description: "Featured Work cards and the Work archive.",
    },
    {
      name: "pageVisuals",
      title: "Project page",
      description: "Top to bottom on the project page.",
    },
    // SEO
    { name: "search", title: "Search and sharing" },
    { name: "redirects", title: "Redirects" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      type: "string",
      group: "details",
      fieldset: "basics",
      description: "Shown on project cards and as the project page title.",
      validation: (rule) => rule.required(),
    }),
    slugField("work", "details", "basics"),
    defineField({
      name: "summary",
      title: "Short description",
      description:
        "One line, two at most: what the company does. Shown on Featured Work cards (home, services, recent work) and used for search results unless SEO › Search description is set. Left empty, cards show the long description cut to two lines.",
      type: "text",
      group: "details",
      fieldset: "descriptions",
      rows: 2,
      validation: (rule) =>
        rule
          .max(SUMMARY_MAX)
          .warning(`Keep it to about ${SUMMARY_MAX} characters: cards show two lines.`),
    }),
    defineField({
      // Stored as `excerpt` (its original name), so existing descriptions keep working.
      name: "excerpt",
      title: "Long description",
      description:
        "Two to four sentences: what the company does, what we did and why it mattered. Shown on the Work archive and at the top of the project page.",
      type: "text",
      group: "details",
      fieldset: "descriptions",
      rows: 5,
      validation: (rule) => [
        rule
          .custom((value) =>
            value ? true : "The Work archive and the project page show this under the name.",
          )
          .warning(),
        rule
          .max(EXCERPT_MAX)
          .warning("That's long for the archive cards: aim for two to four sentences."),
      ],
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "details",
      fieldset: "homePage",
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
      name: "client",
      title: "Client",
      type: "string",
      group: "page",
      fieldset: "projectInfo",
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      group: "page",
      fieldset: "projectInfo",
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
      name: "websiteUrl",
      title: "Website",
      description: 'Shown as a "View website" button.',
      type: "url",
      group: "page",
      fieldset: "projectInfo",
      validation: (rule) => rule.uri({ scheme: ["https", "http"] }),
    }),
    defineField({
      name: "industry",
      title: "Industry",
      description: "Tags, e.g. DevTools, Fintech.",
      type: "array",
      group: "page",
      fieldset: "projectInfo",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "services",
      title: "Project type",
      description:
        "Services we delivered. Shown as tags on project cards, and links the project to that service on the Services page.",
      type: "array",
      group: "page",
      fieldset: "services",
      of: [{ type: "string" }],
      options: { list: SERVICES.map(({ title, value }) => ({ title, value })), layout: "grid" },
      validation: (rule) => rule.min(1).warning("Pick at least one project type."),
    }),
    defineField({
      name: "deliverables",
      title: "Services delivered",
      description:
        "Picked from the shared Services list (Studio › Services), shown as tags on the project page. Missing one? Use “Create new” in the picker, then publish it.",
      type: "array",
      group: "page",
      fieldset: "services",
      of: [
        defineArrayMember({
          type: "reference",
          to: [{ type: "deliverable" }],
          options: { disableNew: false },
        }),
      ],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "challenge",
      title: "Challenge",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      group: "page",
      fieldset: "story",
      rows: 5,
    }),
    defineField({
      name: "solution",
      title: "Solution",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      group: "page",
      fieldset: "story",
      rows: 5,
    }),
    defineField({
      name: "outcome",
      title: "Outcome",
      description: "Separate paragraphs with a blank line.",
      type: "text",
      group: "page",
      fieldset: "story",
      rows: 5,
    }),
    defineField({
      name: "results",
      title: "Measurable results",
      description: "Up to three figures, e.g. 20% / Success metric.",
      type: "array",
      group: "page",
      fieldset: "results",
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
      name: "listingMedia",
      title: "Listing visual (4:5)",
      description:
        "Project card on the home, services and about pages, and in recent work sections.",
      type: "media",
      group: "visuals",
      fieldset: "cards",
      validation: (rule) => [
        rule.required(),
        rule.custom(mediaAspect("portrait")).warning(),
        rule.custom(mediaAlt).warning(),
      ],
    }),
    defineField({
      name: "archiveMedia",
      title: "Archive visuals (3 × 4:5)",
      description: "Exactly three visuals, shown in this order on the Work page.",
      type: "array",
      group: "visuals",
      fieldset: "cards",
      of: [
        defineArrayMember({
          type: "media",
          validation: (rule) => [
            rule.custom(mediaAspect("portrait")).warning(),
            rule.custom(mediaAlt).warning(),
          ],
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
      fieldset: "pageVisuals",
      validation: (rule) => [
        rule.required(),
        rule.custom(mediaAspect("landscape")).warning(),
        rule.custom(mediaAlt).warning(),
      ],
    }),
    defineField({
      name: "content",
      title: "Project content",
      description: "Visuals on the project page, top to bottom. Drag to reorder.",
      type: "array",
      group: "visuals",
      fieldset: "pageVisuals",
      of: [defineArrayMember({ type: "mediaFullWidth" }), defineArrayMember({ type: "mediaPair" })],
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo", fieldset: "search" }),
    previousSlugsField("work", "seo", "redirects"),
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
      playlistUrl: "listingMedia.video.playlistUrl",
    },
    // List rows read "Client · Year · Featured", with the project types underneath.
    prepare: ({ title, client, year, featured, services, kind, image, poster, playlistUrl }) => ({
      title: title || "Untitled project",
      subtitle: [client, year, featured && "Featured"].filter(Boolean).join(" · "),
      description: ((services as string[] | undefined) ?? []).map(serviceTitle).join(", "),
      media: kind === "video" ? videoPreviewMedia(poster, playlistUrl) : image,
    }),
  },
});
