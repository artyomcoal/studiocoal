/**
 * Bunny Stream helpers. A video's files sit next to its HLS playlist:
 * https://vz-<zone>.b-cdn.net/<video id>/playlist.m3u8 → …/<video id>/thumbnail_1.jpg
 *
 * Thumbnails: `thumbnail.jpg` exists once a thumbnail is chosen in the Bunny dashboard;
 * otherwise Bunny's auto-generated frames are `thumbnail_1.jpg`, `thumbnail_2.jpg`, …
 * They're full-size JPEGs at the video's resolution (Bunny doesn't resize on request).
 *
 * The library uses referrer protection: requests need a Referer from an allowed site
 * (the production domain, Cloudflare previews, localhost). Browsers send it by themselves.
 */

/** "…/<video id>/playlist.m3u8" → "…/<video id>", or null when it isn't a playlist URL. */
export function bunnyVideoBase(playlistUrl: string | null | undefined): string | null {
  if (!playlistUrl) return null;
  try {
    const url = new URL(playlistUrl);
    if (url.protocol !== "https:" || !url.pathname.endsWith("/playlist.m3u8")) return null;
    return `${url.origin}${url.pathname.slice(0, -"/playlist.m3u8".length)}`;
  } catch {
    return null;
  }
}

/** Thumbnail URLs to try, in order: the chosen one, then the first auto-generated frame. */
export function bunnyThumbnailCandidates(playlistUrl: string | null | undefined): string[] {
  const base = bunnyVideoBase(playlistUrl);
  return base ? [`${base}/thumbnail.jpg`, `${base}/thumbnail_1.jpg`] : [];
}

const resolved = new Map<string, Promise<string | null>>();

/**
 * Build time: the first thumbnail candidate that exists, or null (network error, video not
 * processed yet). `referer` is the site's origin, for Bunny's referrer protection. Cached
 * per playlist for the whole build.
 */
export function resolveBunnyThumbnail(
  playlistUrl: string | null | undefined,
  referer: string,
  fetcher: typeof fetch = fetch,
): Promise<string | null> {
  const candidates = bunnyThumbnailCandidates(playlistUrl);
  if (!candidates.length) return Promise.resolve(null);
  const key = `${playlistUrl}|${referer}`;
  let result = resolved.get(key);
  if (!result) {
    result = (async () => {
      for (const url of candidates) {
        try {
          const response = await fetcher(url, { method: "HEAD", headers: { Referer: referer } });
          if (response.ok) return url;
        } catch {
          // Try the next candidate.
        }
      }
      return null;
    })();
    resolved.set(key, result);
  }
  return result;
}

/**
 * Poster sizes. Bunny's thumbnails are full-size frames (2160×2700 for a 4:5 video: ~23 MB
 * decoded each), shown in cards a few hundred px wide, so decoding them made scrolling stutter.
 * They're resized at build time to these widths (src/pages/posters/[file].ts) and served with
 * a srcset; 1440 covers the widest card at 2× density.
 */
export const BUNNY_POSTER_WIDTHS = [480, 720, 960, 1440] as const;
export type BunnyPosterWidth = (typeof BUNNY_POSTER_WIDTHS)[number];

/** "…/<video id>/playlist.m3u8" → "<video id>" (Bunny's GUID), or null. */
export function bunnyVideoId(playlistUrl: string | null | undefined): string | null {
  const base = bunnyVideoBase(playlistUrl);
  const id = base?.split("/").pop();
  return id && /^[\w-]+$/.test(id) ? id : null;
}

/** Path of a resized poster: /posters/<video id>-<width>.webp. */
export function bunnyPosterPath(videoId: string, width: BunnyPosterWidth): string {
  return `/posters/${videoId}-${width}.webp`;
}

/** `srcset` for a video's resized posters. */
export function bunnyPosterSrcSet(videoId: string): string {
  return BUNNY_POSTER_WIDTHS.map((w) => `${bunnyPosterPath(videoId, w)} ${w}w`).join(", ");
}

/**
 * Every Bunny playlist URL in some Sanity content: `bunnyVideo` objects at any depth (media
 * fields, galleries, rich text). Deduplicated, in first-seen order.
 */
export function collectBunnyPlaylists(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (record._type === "bunnyVideo" && typeof record.playlistUrl === "string") {
      if (bunnyVideoBase(record.playlistUrl)) found.add(record.playlistUrl);
    }
    Object.values(record).forEach(walk);
  };
  walk(value);
  return [...found];
}
