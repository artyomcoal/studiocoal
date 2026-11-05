/**
 * Auto-generated social share images (1200 × 630 PNG) for project and post pages, rendered
 * at build time by src/pages/og/[type]/[slug].png.ts with satori (layout → SVG) and resvg
 * (SVG → PNG). Design: the page's visual full-bleed, a dark gradient, the wordmark top left,
 * the section name and title bottom left in Graphik.
 *
 * Needs Graphik as OTF / TTF (satori can't read WOFF2) in src/assets/fonts/, which is never
 * served. Without it, no images are generated and pages fall back to their plain visual.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

export const SOCIAL_IMAGE_WIDTH = 1200;
export const SOCIAL_IMAGE_HEIGHT = 630;

const FONT_CANDIDATES = ["Graphik-Medium.otf", "Graphik-Medium.ttf"];
// From the project root: Astro bundles this module into dist/, so paths relative to
// import.meta.url wouldn't point at src/ during the build. Builds and tests run from the root.
const root = process.cwd();
const fontsDir = join(root, "src/assets/fonts");
const tokensFile = join(root, "src/styles/tokens.css");
const wordmarkFile = join(root, "src/assets/studio-coal-wordmark.svg");

/** Path of the Graphik file the images are set in, or null when it isn't there. */
export function socialImageFont(): string | null {
  for (const name of FONT_CANDIDATES) {
    const path = join(fontsDir, name);
    if (existsSync(path)) return path;
  }
  return null;
}

/** Whether this build generates social images (the font is present). */
export const socialImagesEnabled = (): boolean => socialImageFont() !== null;

/** "/og/work/acme.png". */
export function socialImagePath(type: "work" | "journal", slug: string): string {
  return `/og/${type}/${slug}.png`;
}

/** Reads `--color-neutral-N` values from tokens.css, so the image uses the same palette. */
export function neutralColor(css: string, step: number): string {
  const match = css.match(new RegExp(`--color-neutral-${step}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match?.[1]) throw new Error(`--color-neutral-${step} not found in tokens.css`);
  return match[1];
}

/** "#0f0f10", 0.8 → "rgba(15, 15, 16, 0.8)". */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Title size steps down for long titles so they stay within three lines. */
export function titleSize(title: string): number {
  return title.length > 60 ? 56 : title.length > 32 ? 64 : 80;
}

export interface SocialImageInput {
  /** Section name above the title, e.g. "Work". */
  eyebrow: string;
  title: string;
  /** Background visual as a data URL (fetched at build time), or none. */
  image?: string | null;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra = {},
): Node => ({
  type,
  props: { style, children, ...extra },
});

export async function renderSocialImage({ eyebrow, title, image }: SocialImageInput) {
  const fontPath = socialImageFont();
  if (!fontPath) throw new Error("Social images need Graphik as OTF/TTF in src/assets/fonts/.");
  const css = readFileSync(tokensFile, "utf8");
  const dark = neutralColor(css, 900);
  const light = neutralColor(css, 50);
  const muted = neutralColor(css, 450);
  const wordmark = readFileSync(wordmarkFile, "utf8").replace(/currentColor/g, light);
  const wordmarkUrl = `data:image/svg+xml;base64,${Buffer.from(wordmark).toString("base64")}`;
  const size = titleSize(title);

  const tree = el(
    "div",
    {
      position: "relative",
      display: "flex",
      width: "100%",
      height: "100%",
      backgroundColor: dark,
      fontFamily: "Graphik",
    },
    [
      image
        ? el(
            "img",
            { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
            undefined,
            {
              src: image,
            },
          )
        : null,
      el("div", {
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(to top, ${withAlpha(dark, 0.9)} 0%, ${withAlpha(dark, 0.35)} 55%, ${withAlpha(dark, 0.15)} 100%)`,
      }),
      el(
        "div",
        {
          // Insets, not padding on a 100% box: satori would size that past the frame.
          position: "absolute",
          top: 64,
          right: 64,
          bottom: 64,
          left: 64,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        },
        [
          el("img", { width: 240, height: 40 }, undefined, { src: wordmarkUrl }),
          el("div", { display: "flex", flexDirection: "column", gap: 20 }, [
            el(
              "div",
              { fontSize: 24, letterSpacing: "0.02em", textTransform: "uppercase", color: muted },
              eyebrow,
            ),
            el(
              "div",
              {
                fontSize: size,
                lineHeight: 1.05,
                letterSpacing: `${-0.04 * size}px`,
                color: light,
                maxWidth: 980,
              },
              title,
            ),
          ]),
        ],
      ),
    ],
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: SOCIAL_IMAGE_WIDTH,
    height: SOCIAL_IMAGE_HEIGHT,
    fonts: [{ name: "Graphik", data: readFileSync(fontPath), weight: 500, style: "normal" }],
  });
  return new Resvg(svg, { fitTo: { mode: "width", value: SOCIAL_IMAGE_WIDTH } }).render().asPng();
}

/** Downloads an image and returns it as a data URL for satori, or null on failure. */
export async function fetchAsDataUrl(
  url: string,
  headers?: Record<string, string>,
): Promise<string | null> {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "image/jpeg";
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${type};base64,${data}`;
  } catch {
    return null;
  }
}
