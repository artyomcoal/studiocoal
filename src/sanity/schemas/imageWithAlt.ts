import { defineField, defineType } from "sanity";

/**
 * Image with hotspot/crop and required alt text. LQIP is stored on the asset by default.
 * AI Assist (sanity.config.ts) writes the alt text when an image is uploaded or replaced;
 * editors check and edit it, or regenerate it from the field's AI menu.
 */
export const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  options: {
    hotspot: true,
    aiAssist: { imageDescriptionField: { path: "alt", updateOnImageChange: true } },
  },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description:
        "Describe the image for screen readers. Filled in by AI when you upload an image: check it and fix anything it can't know (client, product, context). Leave empty only if the image is purely decorative.",
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
});
