import type { SERVICES } from "./services";

/** A service's stored value (`brand`, `web`, `digital-products`). */
export type ServiceValue = (typeof SERVICES)[number]["value"];

/**
 * A showreel video defined in code (not Sanity). It always plays as an ambient video: muted,
 * looped, autoplaying while on screen, with a pause button.
 */
export interface Showreel {
  /**
   * Either a Bunny Stream HLS playlist (`https://vz-….b-cdn.net/<id>/playlist.m3u8`) or a
   * self-hosted file in `public/` (e.g. `/showreels/brand.mp4`). `null` until the video
   * exists: the row then shows the bg-secondary placeholder.
   */
  src: string | null;
  /**
   * Still frame shown until the video plays (and under reduced motion), e.g.
   * `/showreels/brand.jpg`. Optional for Bunny: its thumbnail is used automatically.
   */
  poster?: string;
}

/**
 * Home "Our services" showreels, one per service (4:3, shown at up to 192 px wide).
 * TODO: add the videos once they're exported.
 */
export const SHOWREELS: Record<ServiceValue, Showreel> = {
  brand: { src: null },
  web: { src: null },
  "digital-products": { src: null },
};
