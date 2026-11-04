import { defineField } from "sanity";
import {
  CONTENT_PATHS,
  type ContentType,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  slugify,
} from "../../lib/seo";
import { AutoSlugInput } from "../components/AutoSlugInput";

/**
 * The URL slug of a Work project or Journal post. It fills in from the title while the page
 * is unpublished, and is checked for a clean format.
 */
export function slugField(type: ContentType, group?: string) {
  return defineField({
    name: "slug",
    title: "URL",
    type: "slug",
    group,
    description: `The page address: studiocoal.com${CONTENT_PATHS[type]}/<this>. Fills in from the title until the page is first published.`,
    options: { source: "title", maxLength: SLUG_MAX_LENGTH, slugify: (input) => slugify(input) },
    components: { input: AutoSlugInput },
    validation: (rule) => [
      rule.required(),
      rule.custom((value) =>
        !value?.current || SLUG_PATTERN.test(value.current)
          ? true
          : "Use lowercase letters, numbers and single hyphens, e.g. my-project.",
      ),
    ],
  });
}

/**
 * Slugs a published page had before its URL changed. Each one redirects to the current URL
 * (src/lib/redirects.ts). The publish action in sanity.config.ts adds them automatically.
 */
export function previousSlugsField(type: ContentType, group?: string) {
  return defineField({
    name: "previousSlugs",
    title: "Old URLs",
    type: "array",
    group,
    description: `Earlier addresses of this page, each redirecting here (studiocoal.com${CONTENT_PATHS[type]}/<old>). Added automatically when you publish a new URL. Remove one to stop redirecting it.`,
    of: [{ type: "string" }],
    options: { layout: "tags" },
    validation: (rule) =>
      rule.custom((value) =>
        (value as string[] | undefined)?.every((slug) => SLUG_PATTERN.test(slug)) === false
          ? "Old URLs use lowercase letters, numbers and single hyphens."
          : true,
      ),
  });
}
