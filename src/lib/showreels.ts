import type { SERVICES } from "./services";

/** A service's stored value (`brand`, `web`, `digital-products`). */
export type ServiceValue = (typeof SERVICES)[number]["value"];

/**
 * A showreel video defined in code (not Sanity), hosted on Bunny Stream. It always plays as an
 * ambient video: muted, looped, autoplaying while on screen, with a pause button. The poster is
 * the video's Bunny thumbnail (src/lib/bunny.ts), so pick one in the Bunny dashboard.
 */
export interface Showreel {
  /**
   * The Bunny Stream HLS playlist, `https://vz-<zone>.b-cdn.net/<video id>/playlist.m3u8`.
   * `null` until the video is uploaded: the row then shows the bg-secondary placeholder.
   */
  playlistUrl: string | null;
}

/**
 * Home "Our services" showreels, one per service (4:3, shown at up to 192 px wide).
 * TODO: add the Bunny playlist URLs once the videos are uploaded.
 */
export const SHOWREELS: Record<ServiceValue, Showreel> = {
  brand: { playlistUrl: null },
  web: { playlistUrl: null },
  "digital-products": { playlistUrl: null },
};
