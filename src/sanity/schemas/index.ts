import { deliverable } from "./deliverable";
import { imageWithAlt } from "./imageWithAlt";
import { journal } from "./journal";
import { link } from "./link";
import { bunnyVideo, media } from "./media";
import { page } from "./page";
import { richText } from "./richText";
import { seo } from "./seo";
import { siteSettings } from "./siteSettings";
import { work } from "./work";
import { mediaFullWidth, mediaPair } from "./workContent";

export const schemaTypes = [
  work,
  journal,
  deliverable,
  siteSettings,
  page,
  richText,
  imageWithAlt,
  media,
  bunnyVideo,
  mediaFullWidth,
  mediaPair,
  seo,
  link,
];

/**
 * Document types whose documents have fixed ids and are edited from a fixed Structure item:
 * the Site settings, and one "page" per fixed page (src/lib/pages.ts).
 */
export const singletonTypes = new Set(["siteSettings", "page"]);
