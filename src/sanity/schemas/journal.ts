import { defineField, defineType } from "sanity";
import { PageIcon, SeoIcon } from "../components/icons";
import { previousSlugsField, slugField } from "./fields";

export const journal = defineType({
  name: "journal",
  title: "Journal",
  type: "document",
  groups: [
    { name: "content", title: "Content", icon: PageIcon, default: true },
    { name: "seo", title: "SEO", icon: SeoIcon },
  ],
  fieldsets: [
    { name: "post", title: "Post", options: { columns: 2 } },
    {
      name: "listing",
      title: "Listing",
      description: "Article cards on the home page and the Journal.",
    },
    { name: "article", title: "Article" },
    { name: "search", title: "Search and sharing" },
    { name: "redirects", title: "Redirects" },
  ],
  fields: [
    defineField({
      name: "title",
      group: "content",
      fieldset: "post",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    slugField("journal", "content", "post"),
    defineField({
      name: "publishedAt",
      group: "content",
      fieldset: "post",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      group: "content",
      fieldset: "post",
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
      fieldset: "listing",
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
      fieldset: "listing",
      validation: (rule) =>
        rule
          .custom((value: { asset?: unknown; alt?: string } | undefined) => {
            if (!value?.asset) return "Article cards and the article page show a cover.";
            return value.alt?.trim() ? true : "Describe the cover in Alternative text.";
          })
          .warning(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "richText",
      group: "content",
      fieldset: "article",
    }),
    defineField({
      name: "featured",
      group: "content",
      fieldset: "listing",
      title: "Featured",
      type: "boolean",
      description: "Prefer this post in the Featured Articles section.",
      initialValue: false,
    }),
    defineField({ name: "seo", title: "SEO", type: "seo", group: "seo", fieldset: "search" }),
    previousSlugsField("journal", "seo", "redirects"),
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
