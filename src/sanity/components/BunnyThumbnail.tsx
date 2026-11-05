/** @jsxImportSource react */
/**
 * Bunny Stream thumbnail for a video without an uploaded poster (Studio only, React).
 * Tries the thumbnail chosen in Bunny, then its first generated frame (src/lib/bunny.ts),
 * and renders nothing if neither loads. The browser sends the Studio's origin as referrer,
 * which Bunny's referrer protection allows.
 */
import { useState, type CSSProperties } from "react";
import type { PreviewValue } from "sanity";
import { bunnyThumbnailCandidates } from "../../lib/bunny";

interface Props {
  playlistUrl?: string | null;
  className?: string;
  style?: CSSProperties;
}

export function BunnyThumbnail({ playlistUrl, className, style }: Props) {
  const candidates = bunnyThumbnailCandidates(playlistUrl);
  const [index, setIndex] = useState(0);
  const src = candidates[index];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{ width: "100%", height: "100%", objectFit: "cover", ...style }}
      onError={() => setIndex((i) => i + 1)}
    />
  );
}

/** For schema previews (`prepare`): the uploaded poster when set, else Bunny's thumbnail. */
export function videoPreviewMedia(
  poster: unknown,
  playlistUrl?: string | null,
): PreviewValue["media"] {
  // An image value with an asset: Sanity renders it as the preview image.
  if (poster && typeof poster === "object" && "asset" in poster && poster.asset) {
    return poster as PreviewValue["media"];
  }
  return playlistUrl ? <BunnyThumbnail playlistUrl={playlistUrl} /> : undefined;
}
