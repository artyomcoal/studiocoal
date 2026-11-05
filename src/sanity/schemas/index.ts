import { deliverable } from "./deliverable";
import { imageWithAlt } from "./imageWithAlt";
import { journal } from "./journal";
import { link } from "./link";
import { bunnyVideo, media } from "./media";
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
  richText,
  imageWithAlt,
  media,
  bunnyVideo,
  mediaFullWidth,
  mediaPair,
  seo,
  link,
];

/** Document types with exactly one document, edited from a fixed Structure item. */
export const singletonTypes = new Set(["siteSettings"]);
