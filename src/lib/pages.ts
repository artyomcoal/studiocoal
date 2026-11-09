/**
 * The site's fixed pages (the ones built in Astro, not Work or Journal items). Shared by the
 * site (BaseLayout's `page` prop), the Studio (Pages list, SEO preview) and /llms.txt.
 *
 * `title` and `description` are the built-in search texts: what the page ships with while its
 * Studio document (Pages › …) leaves the SEO fields empty. Pure data, covered by Vitest.
 */

export const PAGES = [
  // No title: the home page's search title is just the site name.
  { key: "home", name: "Home", path: "/", title: undefined, description: null },
  {
    key: "work",
    name: "Work",
    path: "/work",
    title: "Work",
    description:
      "A selection of brands, websites and products Studio Coal has made with founders and their teams.",
  },
  {
    key: "services",
    name: "Services",
    path: "/services",
    title: "Services",
    description:
      "Brand, web and product, shaped by one design-led studio to tell one unmistakable story.",
  },
  {
    key: "process",
    name: "Process",
    path: "/process",
    title: "Process",
    description: "Few people, close to the work, from the first conversation to launch and after.",
  },
  {
    key: "journal",
    name: "Journal",
    path: "/journal",
    title: "Journal",
    description:
      "Notes from Studio Coal: work in progress, things we've learned, and what's on our minds.",
  },
  {
    key: "about",
    name: "About",
    path: "/about",
    title: "About",
    description:
      "Studio Coal is a design partner for founders at a turning point. Senior, curious and particular about the details.",
  },
  {
    key: "cookie-policy",
    name: "Cookie Policy",
    path: "/cookie-policy",
    title: "Cookie Policy",
    description: "What cookies studiocoal.com uses, why, and how to switch them off.",
  },
] as const;

export type PageKey = (typeof PAGES)[number]["key"];
export type PageInfo = (typeof PAGES)[number];

/** Sanity document id of a page's settings: "page-about". */
export function pageDocumentId(key: PageKey): string {
  return `page-${key}`;
}

export function pageInfo(key: PageKey): PageInfo {
  // Every PageKey is in PAGES by construction.
  return PAGES.find((page) => page.key === key) as PageInfo;
}

/** The page a document id belongs to, draft or published: "drafts.page-about" → About. */
export function pageByDocumentId(id?: string | null): PageInfo | undefined {
  const published = id?.replace(/^drafts\./, "");
  return PAGES.find((page) => pageDocumentId(page.key) === published);
}
