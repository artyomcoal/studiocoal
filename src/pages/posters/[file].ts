/**
 * Resized Bunny posters: /posters/<video id>-<width>.webp (widths in src/lib/bunny.ts).
 * Bunny serves thumbnails only at the video's full resolution (2160×2700 for 4:5), which made
 * every poster a ~23 MB decode; these are built once, at build time, with sharp.
 */
import type { APIRoute, GetStaticPaths } from "astro";
import sharp from "sharp";
import { BUNNY_POSTER_WIDTHS, type BunnyPosterWidth } from "@/lib/bunny";
import { bunnyPosters, POSTER_REFERER } from "@/sanity/posters";

export const getStaticPaths = (async () => {
  const posters = await bunnyPosters();
  return [...posters.values()].flatMap(({ videoId, thumbnail }) =>
    BUNNY_POSTER_WIDTHS.map((width) => ({
      params: { file: `${videoId}-${width}.webp` },
      props: { thumbnail, width },
    })),
  );
}) satisfies GetStaticPaths;

interface Props {
  thumbnail: string;
  width: BunnyPosterWidth;
}

// Each thumbnail is downloaded once for all its widths.
const originals = new Map<string, Promise<ArrayBuffer>>();
function original(url: string): Promise<ArrayBuffer> {
  let result = originals.get(url);
  if (!result) {
    result = fetch(url, { headers: { Referer: POSTER_REFERER } }).then((response) => {
      if (!response.ok) throw new Error(`[posters] ${url}: HTTP ${response.status}`);
      return response.arrayBuffer();
    });
    originals.set(url, result);
  }
  return result;
}

export const GET: APIRoute<Props> = async ({ props: { thumbnail, width } }) => {
  const webp = await sharp(Buffer.from(await original(thumbnail)))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  return new Response(new Uint8Array(webp), { headers: { "Content-Type": "image/webp" } });
};
