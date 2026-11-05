/**
 * Shared by the media schema (validation) and MediaInput (the "looks fine" tick): the shape
 * of a media value and which aspect each media slot expects.
 */
import type { Path } from "sanity";
import type { AspectName } from "../lib/media";

export interface MediaValue {
  kind?: "image" | "video";
  image?: { asset?: { _ref?: string }; crop?: Record<string, number>; alt?: string };
  video?: {
    playlistUrl?: string;
    alt?: string;
    poster?: { asset?: { _ref?: string }; crop?: Record<string, number> };
  };
  decorative?: boolean;
  /** Asset id of the image whose size warning the editor dismissed (MediaInput). */
  aspectChecked?: string;
}

/** The image a slot's size check looks at: the image, or a video's uploaded poster. */
export function mediaCheckImage(value: MediaValue | undefined) {
  return value?.kind === "video" ? value.video?.poster : value?.image;
}

/**
 * Each media slot's aspect ratio, by the field it sits in. MediaInput uses it to offer the
 * "looks fine" tick next to a size warning; the slots' validation passes the same aspects.
 */
const SLOT_ASPECT: Record<string, AspectName> = {
  listingMedia: "portrait",
  archiveMedia: "portrait",
  heroMedia: "landscape",
  media: "landscape", // content › Full-width visual
  left: "portrait", // content › Two visuals side by side
  right: "portrait",
};

/** The aspect of the media slot at `path` (the last named segment). */
export function slotAspect(path: Path): AspectName | undefined {
  for (let i = path.length - 1; i >= 0; i--) {
    const segment = path[i];
    if (typeof segment === "string") return SLOT_ASPECT[segment];
  }
  return undefined;
}
