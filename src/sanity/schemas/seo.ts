import { defineField, defineType } from "sanity";

/** Optional per-document overrides. Falls back to the document title / excerpt / cover image. */
export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(160),
    }),
    defineField({ name: "image", title: "Social image", type: "image" }),
  ],
});
