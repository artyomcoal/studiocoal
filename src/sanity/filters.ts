/**
 * Values shared by the Studio and src/sanity/queries.ts. No Sanity or React imports, so the
 * site's queries can use them, and plain literals so Sanity typegen can evaluate them.
 * ("Needs attention" in the Studio tables now comes from the documents' own validation.)
 */

/** How many projects the home page's Featured Work section shows (src/pages/index.astro). */
export const HOME_FEATURED_LIMIT = 6;

/** How many posts the home page's Featured Articles section shows (src/pages/index.astro). */
export const HOME_JOURNAL_LIMIT = 4;
