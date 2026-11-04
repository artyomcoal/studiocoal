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
