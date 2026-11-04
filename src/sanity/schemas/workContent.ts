import { defineField, defineType } from "sanity";
import { mediaAspect } from "./media";

/** Work project content block: one full-width visual, 16:9. */
export const mediaFullWidth = defineType({
  name: "mediaFullWidth",
  title: "Full-width visual (16:9)",
  type: "object",
  fields: [
    defineField({
      name: "media",
      title: "Visual",
      type: "media",
      validation: (rule) => [rule.required(), rule.custom(mediaAspect("landscape")).warning()],
    }),
  ],
  preview: {
    select: { kind: "media.kind", image: "media.image", poster: "media.video.poster" },
    prepare: ({ kind, image, poster }) => ({
      title: "Full-width visual",
      subtitle: kind === "video" ? "16:9 · video" : "16:9 · image",
      media: kind === "video" ? poster : image,
    }),
  },
});

/** Work project content block: two visuals side by side, 4:5 each. */
export const mediaPair = defineType({
  name: "mediaPair",
  title: "Two visuals side by side (4:5)",
  type: "object",
  fields: [
    defineField({
      name: "left",
      title: "Left visual",
      type: "media",
      validation: (rule) => [rule.required(), rule.custom(mediaAspect("portrait")).warning()],
    }),
    defineField({
      name: "right",
      title: "Right visual",
      type: "media",
      validation: (rule) => [rule.required(), rule.custom(mediaAspect("portrait")).warning()],
    }),
  ],
  preview: {
    select: { kind: "left.kind", image: "left.image", poster: "left.video.poster" },
    prepare: ({ kind, image, poster }) => ({
      title: "Two visuals side by side",
      subtitle: "2 × 4:5",
      media: kind === "video" ? poster : image,
    }),
  },
});
