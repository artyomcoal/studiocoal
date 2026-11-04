import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Site title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "description", title: "Default description", type: "text", rows: 3 }),
    defineField({ name: "navigation", title: "Navigation", type: "array", of: [{ type: "link" }] }),
    defineField({
      name: "email",
      title: "Contact email",
      type: "string",
      validation: (rule) => rule.email(),
    }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "address", title: "Address", type: "text", rows: 3 }),
    defineField({ name: "social", title: "Social links", type: "array", of: [{ type: "link" }] }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({ name: "seo", title: "Default SEO", type: "seo" }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
