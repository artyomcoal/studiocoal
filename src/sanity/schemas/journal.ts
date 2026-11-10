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
      name: "externalLink",
      title: "External article",
      description: "For a post published on another website, e.g. a guest article or an interview.",
    },
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
      name: "external",
      title: "Published on another website",
      description:
        "Article cards open the link below in a new tab instead of a page on this site. No article page is built, so the body and SEO settings aren't used.",
      type: "boolean",
      group: "content",
      fieldset: "externalLink",
      initialValue: false,
    }),
    defineField({
      name: "externalUrl",
      title: "Article link",
      type: "url",
      group: "content",
      fieldset: "externalLink",
      hidden: ({ document }) => document?.external !== true,
      validation: (rule) => [
        rule.uri({ scheme: ["https", "http"] }),
        rule.custom((value, context) =>
          context.document?.external === true && !value
            ? 'Add the link, or turn off "Published on another website".'
            : true,
        ),
      ],
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
      // External posts have no article page.
      hidden: ({ document }) => document?.external === true,
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
  preview: {
    select: {
      title: "title",
      publishedAt: "publishedAt",
      external: "external",
      media: "coverImage",
    },
    // List rows read "Date · External" for posts that live on another website.
    prepare: ({ title, publishedAt, external, media }) => ({
      title,
      subtitle: [publishedAt, external && "External"].filter(Boolean).join(" · "),
      media,
    }),
  },
});
