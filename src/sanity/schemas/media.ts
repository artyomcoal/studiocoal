import {
  defineField,
  defineType,
  type CustomValidator,
  type Path,
  type ValidationContext,
} from "sanity";
import { videoPreviewMedia } from "../components/BunnyThumbnail";
import { aspectMismatch, isHlsUrl, type AspectName } from "../../lib/media";

/** The value at `path` in the document (array items by _key). */
function valueAt(document: unknown, path: Path): unknown {
  let current: unknown = document;
  for (const segment of path) {
    if (current == null) return undefined;
    if (typeof segment === "object" && segment !== null && "_key" in segment) {
      current = Array.isArray(current)
        ? current.find((item) => (item as { _key?: string })?._key === segment._key)
        : undefined;
    } else {
      current = (current as Record<string | number, unknown>)[segment as string | number];
    }
  }
  return current;
}

/**
 * Whether a bunnyVideo field belongs to a media item set to Video. Its path ends in
 * …/<media>/video/<field>; the video object also exists on Image items (the playback default
 * creates it), and Sanity validates hidden fields, so its rules only apply to videos.
 */
function isVideoItem(context: ValidationContext): boolean {
  const media = valueAt(context.document, context.path?.slice(0, -2) ?? []);
  const kind = (media as { kind?: string } | undefined)?.kind;
  return kind === undefined || kind === "video";
}

/**
 * A Bunny Stream video, played over HLS. The poster is optional: without one, the site and
 * the Studio use Bunny's own thumbnail (src/lib/bunny.ts).
 */
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
      // Required only on Video items (see isVideoItem). A custom rule, not required(), so
      // typegen types it as optional, which it is on Image items.
      validation: (rule) =>
        rule.uri({ scheme: ["https"] }).custom((value, context) => {
          if (!isVideoItem(context)) return true;
          if (!value) return "Add the video's HLS playlist URL.";
          return isHlsUrl(value) ? true : "Use the HLS playlist URL (ends in .m3u8).";
        }),
    }),
    defineField({
      name: "poster",
      title: "Poster image",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional. Shown while the video loads and when visitors prefer reduced motion. Leave empty to use the video's thumbnail from Bunny (the one chosen in Bunny, or its first frame).",
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
      validation: (rule) =>
        rule.custom((value, context) =>
          !isVideoItem(context) || value ? true : "Choose how the video plays.",
        ),
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "playlistUrl", poster: "poster" },
    prepare: ({ title, subtitle, poster }) => ({
      title: title || "Video",
      subtitle,
      media: videoPreviewMedia(poster, subtitle),
    }),
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
      playlistUrl: "video.playlistUrl",
    },
    prepare: ({ kind, imageAlt, image, videoAlt, poster, playlistUrl }) =>
      kind === "video"
        ? {
            title: videoAlt || "Video",
            subtitle: "Video",
            media: videoPreviewMedia(poster, playlistUrl),
          }
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
