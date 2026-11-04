/**
 * Media helpers shared by the Sanity schema (Studio validation) and the site (rendering).
 * Pure functions, so they're covered by Vitest.
 */

/** Aspect ratios (width / height) used by the Work visuals. */
export const ASPECT = {
  /** Listing, archive and side-by-side visuals. */
  portrait: 4 / 5,
  /** Project hero and full-width visuals. */
  landscape: 16 / 9,
  /** Journal article cards. */
  square: 1,
} as const;

export type AspectName = keyof typeof ASPECT;

interface Crop {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

/**
 * Dimensions of a Sanity image asset from its reference, e.g.
 * `image-abc123-1600x2000-jpg` → { width: 1600, height: 2000 }. Applies the editor's crop.
 */
export function assetDimensions(
  ref: string | undefined,
  crop?: Crop | null,
): { width: number; height: number } | null {
  const match = ref?.match(/-(\d+)x(\d+)-[a-z0-9]+$/);
  if (!match) return null;
  const width = Number(match[1]) * (1 - (crop?.left ?? 0) - (crop?.right ?? 0));
  const height = Number(match[2]) * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0));
  return width > 0 && height > 0 ? { width, height } : null;
}

/**
 * Studio warning text when an image's ratio differs from the slot's ratio by more than
 * `tolerance` (relative), or `null` when it fits. The site still crops around the hotspot,
 * so a mismatch is a warning, not an error.
 */
export function aspectMismatch(
  ref: string | undefined,
  crop: Crop | null | undefined,
  aspect: AspectName,
  tolerance = 0.02,
): string | null {
  const size = assetDimensions(ref, crop);
  if (!size) return null;
  const expected = ASPECT[aspect];
  const actual = size.width / size.height;
  if (Math.abs(actual - expected) / expected <= tolerance) return null;
  const label = { portrait: "4:5", landscape: "16:9", square: "1:1" }[aspect];
  return `This image is ${Math.round(size.width)} × ${Math.round(size.height)}, but this slot shows ${label}. It will be cropped around the hotspot.`;
}

/** True for an absolute https URL to an HLS playlist (.m3u8), e.g. a Bunny Stream playlist. */
export function isHlsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.pathname.endsWith(".m3u8");
  } catch {
    return false;
  }
}
