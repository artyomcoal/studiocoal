/** SEO helpers. Pure functions, so they're covered by Vitest. */

export const SITE_NAME = "Studio Coal";
export const DEFAULT_DESCRIPTION =
  "Studio Coal is a design studio for brand, web and digital products.";

export interface SeoInput {
  /** Page title without the site name. Omit on the home page. */
  title?: string;
  description?: string | null;
  /** Absolute URL of the social image (1200 × 630). */
  image?: string | null;
  /** Current URL path, e.g. Astro.url.pathname. */
  pathname: string;
  /** Canonical origin, e.g. Astro.site. */
  site: URL | string;
  noindex?: boolean;
}

export interface Seo {
  title: string;
  description: string;
  canonical: string;
  image: string | null;
  noindex: boolean;
}

/** "Work — Studio Coal", or just "Studio Coal" when there is no page title. */
export function pageTitle(title?: string): string {
  const trimmed = title?.trim();
  return trimmed && trimmed !== SITE_NAME ? `${trimmed} — ${SITE_NAME}` : SITE_NAME;
}

/** Canonical URL on the production origin, with a trailing slash only on the root. */
export function canonicalUrl(pathname: string, site: URL | string): string {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  return new URL(path, site).href;
}

export function buildSeo(input: SeoInput): Seo {
  return {
    title: pageTitle(input.title),
    description: input.description?.trim() || DEFAULT_DESCRIPTION,
    canonical: canonicalUrl(input.pathname, input.site),
    image: input.image ?? null,
    noindex: input.noindex ?? false,
  };
}

/*
 * Content SEO. Shared by the site (pages pass the result to PageLayout) and the Studio's
 * SEO preview (src/sanity/components/SeoInput.tsx), so editors see exactly what ships.
 */

/** Google shows about this many characters of a title and a description. */
export const SEO_TITLE_LIMIT = 60;
export const SEO_DESCRIPTION_LIMIT = 160;
/** Shorter descriptions are often replaced by Google with text from the page. */
export const SEO_DESCRIPTION_MIN = 70;
/** Longest URL slug the Studio generates. */
export const SLUG_MAX_LENGTH = 96;
/** A clean slug: lowercase letters and digits, single hyphens between words. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** URL prefix of each content type with its own pages. */
export const CONTENT_PATHS = { work: "/work", journal: "/journal" } as const;
export type ContentType = keyof typeof CONTENT_PATHS;

/** "/work/some-project". */
export function contentPath(type: ContentType, slug: string): string {
  return `${CONTENT_PATHS[type]}/${slug}`;
}

/** "Ünïcode & Co. — 2026!" → "unicode-and-co-2026". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

export interface ContentSeoInput {
  /** The document's own title and excerpt. */
  title?: string | null;
  excerpt?: string | null;
  /** The document's SEO overrides. */
  seo?: { title?: string | null; description?: string | null; noIndex?: boolean | null } | null;
}

export interface ContentSeo {
  /** Page title without the site name (pageTitle() adds it). */
  title?: string;
  /** Null when neither the override nor the excerpt is set: the site default applies. */
  description: string | null;
  noindex: boolean;
  /** Where each value comes from, for the Studio preview. */
  source: { title: "seo" | "title" | "none"; description: "seo" | "excerpt" | "default" };
}

/** SEO override first, then the document's own title / excerpt. */
export function contentSeo({ title, excerpt, seo }: ContentSeoInput): ContentSeo {
  const seoTitle = seo?.title?.trim();
  const ownTitle = title?.trim();
  const seoDescription = seo?.description?.trim();
  const ownDescription = excerpt?.trim();
  return {
    title: seoTitle || ownTitle || undefined,
    description: seoDescription || ownDescription || null,
    noindex: seo?.noIndex === true,
    source: {
      title: seoTitle ? "seo" : ownTitle ? "title" : "none",
      description: seoDescription ? "seo" : ownDescription ? "excerpt" : "default",
    },
  };
}

/** Longest page title (before " — Studio Coal") that keeps the full title within the limit. */
export const SEO_PAGE_TITLE_MAX = SEO_TITLE_LIMIT - (pageTitle("x").length - 1);
