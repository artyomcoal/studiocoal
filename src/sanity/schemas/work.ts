import { defineField, defineType } from "sanity";

export const services = [
  { title: "Brand", value: "brand" },
  { title: "Web", value: "web" },
  { title: "Digital products", value: "digital-products" },
];

export const work = defineType({
  name: "work",
  title: "Work",
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
    defineField({ name: "client", title: "Client", type: "string" }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (rule) => rule.integer().min(2000),
    }),
    defineField({
      name: "services",
      title: "Services",
      type: "array",
      of: [{ type: "string" }],
      options: { list: services },
    }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "imageWithAlt",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "body", title: "Body", type: "richText" }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Show in the Featured Work section on the home page.",
      initialValue: false,
    }),
    defineField({ name: "seo", title: "SEO", type: "seo" }),
  ],
  orderings: [
    { title: "Year, newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: { select: { title: "title", subtitle: "client", media: "coverImage" } },
});
