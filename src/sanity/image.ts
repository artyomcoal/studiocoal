import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "sanity:client";

const builder = createImageUrlBuilder(sanityClient);

/** Widths for responsive srcset. Covers 375px mobile at 1x up to 1440px desktop at 2x. */
export const IMAGE_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1600, 2048, 2880] as const;

/** URL builder for one image. Respects hotspot/crop when the source includes them. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}

/**
 * Responsive srcset for a Sanity image. `aspectRatio` (width / height) crops to a fixed ratio
 * around the hotspot; omit it to keep the original ratio.
 */
export function imageSrcSet(source: SanityImageSource, aspectRatio?: number): string {
  return IMAGE_WIDTHS.map((width) => {
    let url = urlFor(source).width(width);
    if (aspectRatio) url = url.height(Math.round(width / aspectRatio)).fit("crop");
    return `${url.url()} ${width}w`;
  }).join(", ");
}
