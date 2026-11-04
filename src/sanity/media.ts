import type { FEATURED_WORK_QUERY_RESULT } from "./types";

/**
 * The shared `media` projection from src/sanity/queries.ts (an image or a Bunny HLS video).
 * Every query uses the same projection, so this one type fits listing, archive, hero and
 * content visuals alike.
 */
export type MediaData = NonNullable<FEATURED_WORK_QUERY_RESULT[number]["listingMedia"]>;

type ImageData = NonNullable<Extract<MediaData, { image: unknown }>["image"]>;
type VideoData = NonNullable<Extract<MediaData, { video: unknown }>["video"]>;

/** Narrows a media item to the branch for its kind. Typegen can't narrow on `kind` itself. */
export function resolveMedia(
  media: MediaData | null | undefined,
): { kind: "image"; image: ImageData } | { kind: "video"; video: VideoData } | null {
  if (!media) return null;
  if (media.kind === "video" && "video" in media && media.video?.playlistUrl) {
    return { kind: "video", video: media.video };
  }
  if (media.kind === "image" && "image" in media && media.image?.asset) {
    return { kind: "image", image: media.image };
  }
  return null;
}
