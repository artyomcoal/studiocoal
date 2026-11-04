/**
 * Redirects for astro.config.mjs (`redirects`). Pure, covered by Vitest.
 *
 * - Content: a Work project or Journal post keeps the slugs it was published under before
 *   (`previousSlugs`, recorded by the Studio's publish action). Each old URL redirects to the
 *   current one.
 * - Manual: Site settings › Redirects, for anything else (old site URLs, campaigns).
 *
 * On Vercel the adapter turns these into real 301s; local and CI builds emit HTML redirect
 * pages instead.
 */
import { CONTENT_PATHS, type ContentType } from "./seo";

export interface ContentRedirectSource {
  _type: string;
  slug: string | null;
  previousSlugs?: (string | null)[] | null;
}

export interface ManualRedirect {
  from?: string | null;
  to?: string | null;
  permanent?: boolean | null;
}

export type RedirectConfig = Record<string, { status: 301 | 302; destination: string }>;

const isContentType = (type: string): type is ContentType => type in CONTENT_PATHS;

/** "/Work/Old/" → "/Work/Old". Paths are compared as written, without trailing slashes. */
export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function buildRedirects(
  content: ContentRedirectSource[],
  manual: ManualRedirect[] = [],
): RedirectConfig {
  const live = new Set<string>();
  const pages: [path: string, previous: string[]][] = [];
  for (const doc of content) {
    if (!doc.slug || !isContentType(doc._type)) continue;
    const path = `${CONTENT_PATHS[doc._type]}/${doc.slug}`;
    live.add(path);
    const previous = (doc.previousSlugs ?? [])
      .filter((slug): slug is string => !!slug && slug !== doc.slug)
      .map((slug) => `${CONTENT_PATHS[doc._type as ContentType]}/${slug}`);
    pages.push([path, previous]);
  }

  const redirects: RedirectConfig = {};
  const add = (from: string, to: string, status: 301 | 302) => {
    // Never shadow a live page, never redirect to itself, first rule wins.
    if (from === to || live.has(from) || from in redirects) return;
    redirects[from] = { status, destination: to };
  };

  for (const [path, previous] of pages) {
    for (const from of previous) add(from, path, 301);
  }
  for (const rule of manual) {
    if (!rule.from || !rule.to) continue;
    const from = normalizePath(rule.from);
    if (/^https?:\/\//.test(from)) continue; // Only paths on this site can be redirected.
    add(from, normalizePath(rule.to), rule.permanent === false ? 302 : 301);
  }
  return redirects;
}
