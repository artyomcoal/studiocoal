import { defineField, defineType } from "sanity";

export const journal = defineType({
  name: "journal",
  title: "Journal",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({ name: "coverImage", title: "Cover image", type: "imageWithAlt" }),
    defineField({ name: "body", title: "Body", type: "richText" }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Prefer this post in the Featured Articles section.",
      initialValue: false,
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  orderings: [
    {
      title: "Newest first",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: { select: { title: "title", subtitle: "publishedAt", media: "coverImage" } },
});
