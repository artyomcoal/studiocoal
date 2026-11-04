import { defineArrayMember, defineField, defineType } from "sanity";
import { SERVICES } from "../../lib/services";
import { mediaAspect } from "./media";

export const work = defineType({
  name: "work",
  title: "Work",
  type: "document",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "visuals", title: "Visuals" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      type: "string",
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "details",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "client", title: "Client", type: "string", group: "details" }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      group: "details",
      validation: (rule) => rule.integer().min(2000),
    }),
    defineField({
      name: "services",
      title: "Project type",
      description: "Services we delivered. Shown as tags on project cards.",
      type: "array",
      group: "details",
      of: [{ type: "string" }],
      options: { list: SERVICES.map(({ title, value }) => ({ title, value })) },
    }),
    defineField({
      name: "excerpt",
      title: "Description",
      description: "What the company does and how we helped. Shown on project cards.",
      type: "text",
      rows: 3,
      group: "details",
    }),
    defineField({ name: "body", title: "Project text", type: "richText", group: "details" }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      group: "details",
      description: "Show in the Featured Work section on the home page.",
      initialValue: false,
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
    { title: "Year, newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "client",
      kind: "listingMedia.kind",
      image: "listingMedia.image",
      poster: "listingMedia.video.poster",
    },
    prepare: ({ title, subtitle, kind, image, poster }) => ({
      title,
      subtitle,
      media: kind === "video" ? poster : image,
    }),
  },
});
