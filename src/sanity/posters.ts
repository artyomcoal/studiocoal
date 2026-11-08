/**
 * Bunny posters resized at build time (src/pages/posters/[file].ts, src/lib/bunny.ts).
 * One index per build: every Bunny video in the published content and the code-defined
 * showreels, with the thumbnail Bunny serves for it. Media.astro and the posters route both
 * read it, so a page only links resized files the route has built.
 */
import { sanityClient } from "sanity:client";
import { bunnyVideoId, collectBunnyPlaylists, resolveBunnyThumbnail } from "@/lib/bunny";
import { SHOWREELS } from "@/lib/showreels";
import { BUNNY_CONTENT_QUERY } from "./queries";

export interface BunnyPoster {
  /** Bunny's video GUID, used in the resized files' names. */
  videoId: string;
  /** The full-size thumbnail the resized files are made from. */
  thumbnail: string;
}

/** The site's origin, sent as Referer: the Bunny library only serves allowed sites. */
export const POSTER_REFERER = String(import.meta.env.SITE ?? "https://studiocoal.com");

let index: Promise<Map<string, BunnyPoster>> | undefined;

/** Playlist URL → poster, for every Bunny video that has a thumbnail. Cached for the build. */
export function bunnyPosters(): Promise<Map<string, BunnyPoster>> {
  index ??= (async () => {
    const content = await sanityClient.fetch(BUNNY_CONTENT_QUERY);
    const showreels = Object.values(SHOWREELS).flatMap((reel) =>
      reel.playlistUrl ? [reel.playlistUrl] : [],
    );
    const playlists = [...new Set([...collectBunnyPlaylists(content), ...showreels])];
    const entries = await Promise.all(
      playlists.map(async (playlistUrl) => {
        const videoId = bunnyVideoId(playlistUrl);
        const thumbnail = videoId ? await resolveBunnyThumbnail(playlistUrl, POSTER_REFERER) : null;
        return videoId && thumbnail ? ([[playlistUrl, { videoId, thumbnail }]] as const) : [];
      }),
    );
    return new Map(entries.flat());
  })();
  return index;
}
