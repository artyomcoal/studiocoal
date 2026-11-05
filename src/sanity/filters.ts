/**
 * GROQ conditions shared by the Studio (lists, the Work table) and src/sanity/queries.ts.
 * Plain template strings with no Sanity or React imports, so the site's queries can use them
 * and Sanity typegen can evaluate them (no arrays or function calls).
 */
import { SEO_DESCRIPTION_LIMIT, SEO_PAGE_TITLE_MAX } from "../lib/seo";

/** The page's search title or description is longer than Google shows. */
export const SEO_TOO_LONG_FILTER = `length(coalesce(seo.title, title)) > ${SEO_PAGE_TITLE_MAX} || length(coalesce(seo.description, excerpt)) > ${SEO_DESCRIPTION_LIMIT}`;

/** A Work document is missing something the site shows, or has an SEO problem. */
export const WORK_NEEDS_ATTENTION_FILTER = `!defined(slug.current)
  || !defined(excerpt)
  || count(coalesce(services, [])) == 0
  || !defined(listingMedia)
  || count(coalesce(archiveMedia, [])) != 3
  || !defined(heroMedia)
  || ${SEO_TOO_LONG_FILTER}
  || (listingMedia.kind == "image" && !defined(listingMedia.image.alt))
  || (listingMedia.kind == "video" && !defined(listingMedia.video.alt))`;

/** A Journal post is missing something the site shows, or has an SEO problem. */
export const JOURNAL_NEEDS_ATTENTION_FILTER = `!defined(slug.current)
  || !defined(publishedAt)
  || !defined(excerpt)
  || !defined(coverImage.asset)
  || (defined(coverImage.asset) && !defined(coverImage.alt))
  || ${SEO_TOO_LONG_FILTER}`;

/** How many projects the home page's Featured Work section shows (src/pages/index.astro). */
export const HOME_FEATURED_LIMIT = 6;
