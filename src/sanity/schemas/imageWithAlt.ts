import { defineField, defineType } from "sanity";

/** Image with hotspot/crop and required alt text. LQIP is stored on the asset by default. */
export const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description:
        "Describe the image for screen readers. Leave empty only if it is purely decorative.",
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
  ],
});
