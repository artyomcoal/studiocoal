import { imageWithAlt } from "./imageWithAlt";
import { journal } from "./journal";
import { link } from "./link";
import { richText } from "./richText";
import { seo } from "./seo";
import { siteSettings } from "./siteSettings";
import { work } from "./work";

export const schemaTypes = [work, journal, siteSettings, richText, imageWithAlt, seo, link];

/** Document types with exactly one document, edited from a fixed Structure item. */
export const singletonTypes = new Set(["siteSettings"]);
