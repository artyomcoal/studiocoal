import { defineField, defineType } from "sanity";
import { previousSlugsField, slugField } from "./fields";

export const journal = defineType({
  name: "journal",
  title: "Journal",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      group: "content",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    slugField("journal", "content"),
    defineField({
      name: "publishedAt",
      group: "content",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      group: "content",
      title: "Category",
      type: "string",
      description: "Shown as a tag on article cards, e.g. News, Insight, Process.",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      group: "content",
      description:
        "Shown on article cards, and used for search results unless SEO › Search description is set.",
      validation: (rule) =>
        rule
          .custom((value) => (value ? true : "Article cards show this under the title."))
          .warning(),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "imageWithAlt",
      group: "content",
      validation: (rule) =>
        rule
          .custom((value: { asset?: unknown; alt?: string } | undefined) => {
            if (!value?.asset) return "Article cards and the article page show a cover.";
            return value.alt?.trim() ? true : "Describe the cover in Alternative text.";
          })
          .warning(),
    }),
    defineField({ name: "body", title: "Body", type: "richText", group: "content" }),
    defineField({
      name: "featured",
      group: "content",
      title: "Featured",
      type: "boolean",
      description: "Prefer this post in the Featured Articles section.",
      initialValue: false,
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo" }),
    previousSlugsField("journal", "seo"),
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
