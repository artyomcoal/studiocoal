/**
 * Bunny Stream helpers. A video's files sit next to its HLS playlist:
 * https://vz-<zone>.b-cdn.net/<video id>/playlist.m3u8 → …/<video id>/thumbnail_1.jpg
 *
 * Thumbnails: `thumbnail.jpg` exists once a thumbnail is chosen in the Bunny dashboard;
 * otherwise Bunny's auto-generated frames are `thumbnail_1.jpg`, `thumbnail_2.jpg`, …
 * They're full-size JPEGs at the video's resolution (Bunny doesn't resize on request).
 *
 * The library uses referrer protection: requests need a Referer from an allowed site
 * (the production domain, Vercel previews, localhost). Browsers send it by themselves.
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
