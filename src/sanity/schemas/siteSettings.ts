import { defineArrayMember, defineField, defineType } from "sanity";
import { normalizePath } from "../../lib/redirects";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "about", title: "About page" },
    { name: "redirects", title: "Redirects" },
  ],
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
      name: "clients",
      title: "Clients",
      description: "Logos in the Clients section (home page). Single-colour SVGs work best.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "client",
          fields: [
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "logo",
              title: "Logo",
              type: "image",
              options: { accept: "image/svg+xml,image/png" },
              description: "Shown in one colour, tinted to the theme. Keep the artboard tight.",
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),
    defineField({
      name: "aboutGallery",
      title: "About: studio photos",
      description:
        "The horizontal photo strip under the About hero, left to right. Cropped to 3:2.",
      type: "array",
      group: "about",
      of: [defineArrayMember({ type: "imageWithAlt" })],
    }),
    defineField({
      name: "aboutPrinciplesImage",
      title: "About: principles image",
      description: "Next to the principles on the About page. Cropped square.",
      type: "imageWithAlt",
      group: "about",
    }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({ name: "seo", title: "Default SEO", type: "seo" }),
    defineField({
      name: "redirects",
      title: "Redirects",
      group: "redirects",
      description:
        "Send old or short addresses somewhere else, e.g. /projects → /work. Changed project and post URLs redirect by themselves (their Old URLs field). Applies after the next deploy.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "redirect",
          fields: [
            defineField({
              name: "from",
              title: "From",
              type: "string",
              description: "A path on this site, e.g. /projects.",
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    value && !value.startsWith("/") ? "Start with /, e.g. /projects." : true,
                  ),
            }),
            defineField({
              name: "to",
              title: "To",
              type: "string",
              description: "A path on this site (/work) or a full URL (https://…).",
              validation: (rule) =>
                rule
                  .required()
                  .custom((value) =>
                    value && !/^(\/|https?:\/\/)/.test(value)
                      ? "Use a path starting with / or a full https:// URL."
                      : true,
                  ),
            }),
            defineField({
              name: "permanent",
              title: "Permanent (301)",
              type: "boolean",
              description: "Turn off for a temporary redirect (302), e.g. a campaign.",
              initialValue: true,
            }),
          ],
          preview: {
            select: { from: "from", to: "to", permanent: "permanent" },
            prepare: ({ from, to, permanent }) => ({
              title: `${from ? normalizePath(from) : "…"} → ${to ?? "…"}`,
              subtitle: permanent === false ? "Temporary (302)" : "Permanent (301)",
            }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
