import { defineField, defineType, type CustomValidator } from "sanity";
import { aspectMismatch, isHlsUrl, type AspectName } from "../../lib/media";

/** A Bunny Stream video, played over HLS. The poster lives in Sanity (hotspot, LQIP). */
export const bunnyVideo = defineType({
  name: "bunnyVideo",
  title: "Video",
  type: "object",
  fields: [
    defineField({
      name: "playlistUrl",
      title: "HLS playlist URL",
      type: "url",
      description:
        "Bunny Stream › the video › HLS Playlist URL, e.g. https://vz-….b-cdn.net/<video id>/playlist.m3u8",
      validation: (rule) =>
        rule
          .required()
          .uri({ scheme: ["https"] })
          .custom((value) =>
            !value || isHlsUrl(value) ? true : "Use the HLS playlist URL (ends in .m3u8).",
          ),
    }),
    defineField({
      name: "poster",
      title: "Poster image",
      type: "image",
      options: { hotspot: true },
      description:
        "Shown while the video loads and when visitors prefer reduced motion. Use a frame from the video.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alternative text",
      type: "string",
      description:
        "Describe the video for screen readers. Leave empty only if it is purely decorative.",
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({
      name: "playback",
      title: "Playback",
      type: "string",
      options: {
        list: [
          { title: "Ambient: autoplay, muted, loops, no controls", value: "ambient" },
          { title: "Player: shows controls, plays with sound on click", value: "player" },
        ],
        layout: "radio",
      },
      initialValue: "ambient",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "playlistUrl", media: "poster" },
    prepare: ({ title, subtitle, media }) => ({ title: title || "Video", subtitle, media }),
  },
});

interface MediaValue {
  kind?: "image" | "video";
  image?: { asset?: { _ref?: string }; crop?: Record<string, number> };
  video?: { poster?: { asset?: { _ref?: string }; crop?: Record<string, number> } };
}

/**
 * One visual: an image (Sanity) or a video (Bunny HLS). Reused by every Work visual slot.
 * The slot sets the aspect ratio with `mediaAspect()`; the site crops around the hotspot.
 */
export const media = defineType({
  name: "media",
  title: "Media",
  type: "object",
  fields: [
    defineField({
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "image",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "imageWithAlt",
      hidden: ({ parent }) => (parent as MediaValue | undefined)?.kind === "video",
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.parent as MediaValue | undefined)?.kind !== "video" &&
          !(value as MediaValue["image"])?.asset
            ? "Add an image."
            : true,
        ),
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "bunnyVideo",
      hidden: ({ parent }) => (parent as MediaValue | undefined)?.kind !== "video",
      validation: (rule) =>
        rule.custom((value, context) =>
          (context.parent as MediaValue | undefined)?.kind === "video" && !value
            ? "Add a video."
            : true,
        ),
    }),
  ],
  preview: {
    select: {
      kind: "kind",
      imageAlt: "image.alt",
      image: "image",
      videoAlt: "video.alt",
      poster: "video.poster",
    },
    prepare: ({ kind, imageAlt, image, videoAlt, poster }) =>
      kind === "video"
        ? { title: videoAlt || "Video", subtitle: "Video", media: poster }
        : { title: imageAlt || "Image", subtitle: "Image", media: image },
  },
});

/** Studio warning when a media item's image (or video poster) doesn't match the slot's ratio. */
export function mediaAspect(aspect: AspectName): CustomValidator<MediaValue | undefined> {
  return (value) => {
    const image = value?.kind === "video" ? value.video?.poster : value?.image;
    return aspectMismatch(image?.asset?._ref, image?.crop, aspect) ?? true;
  };
}
