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
