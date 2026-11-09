/**
 * Structured data (schema.org JSON-LD) for search engines. Pure functions, covered by Vitest.
 * Pages build a graph with these and pass it to PageLayout's `jsonLd` prop.
 */
import { SITE_NAME } from "./seo";

type Thing = Record<string, unknown> & { "@type": string };

/** Stable node ids, so other nodes can reference the organisation and website. */
export function organizationId(site: string): string {
  return new URL("/#organization", site).href;
}
export function websiteId(site: string): string {
  return new URL("/#website", site).href;
}

export interface OrganizationInput {
  site: string;
  description?: string | null;
  email?: string | null;
  /** Absolute URLs of the studio's profiles (Instagram, LinkedIn, …). */
  sameAs?: (string | null | undefined)[];
  logo?: string | null;
  /** Postal address as written in the footer, one line per row. */
  address?: string | null;
}

export function organization({
  site,
  description,
  email,
  sameAs,
  logo,
  address,
}: OrganizationInput): Thing {
  const profiles = (sameAs ?? []).filter((url): url is string => !!url && /^https?:\/\//.test(url));
  return compact({
    "@type": "Organization",
    "@id": organizationId(site),
    name: SITE_NAME,
    url: new URL("/", site).href,
    description,
    email,
    logo,
    address: address
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join(", "),
    sameAs: profiles.length ? profiles : undefined,
  });
}

export function website(site: string): Thing {
  return {
    "@type": "WebSite",
    "@id": websiteId(site),
    name: SITE_NAME,
    url: new URL("/", site).href,
    publisher: { "@id": organizationId(site) },
  };
}

/** Home › … › current page. `items` are [name, absolute URL] from the top down. */
export function breadcrumbs(items: [name: string, url: string][]): Thing {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map(([name, item], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item,
    })),
  };
}

export interface WebPageInput {
  site: string;
  url: string;
  /** "AboutPage" for About, "CollectionPage" for the Work and Journal lists. */
  type?: "WebPage" | "AboutPage" | "CollectionPage";
  name: string;
  description?: string | null;
  /** Pages › Summary for AI assistants: a plain account of what the page says. */
  summary?: string | null;
}

/** One of the fixed pages (Home, Services, …). */
export function webPage(input: WebPageInput): Thing {
  return compact({
    "@type": input.type ?? "WebPage",
    "@id": `${input.url}#webpage`,
    url: input.url,
    name: input.name,
    description: input.description,
    abstract: input.summary?.trim(),
    isPartOf: { "@id": websiteId(input.site) },
    about: { "@id": organizationId(input.site) },
  });
}

export interface ProjectInput {
  site: string;
  url: string;
  title: string;
  description?: string | null;
  image?: string | null;
  client?: string | null;
  year?: number | null;
  /** Project types and industries, as display text. */
  keywords?: string[];
  updatedAt?: string | null;
}

/** A Work project. */
export function project(input: ProjectInput): Thing {
  return compact({
    "@type": "CreativeWork",
    "@id": `${input.url}#project`,
    url: input.url,
    name: input.title,
    description: input.description,
    image: input.image,
    dateCreated: input.year ? String(input.year) : undefined,
    dateModified: input.updatedAt,
    keywords: input.keywords?.length ? input.keywords.join(", ") : undefined,
    creator: { "@id": organizationId(input.site) },
    sourceOrganization: input.client ? { "@type": "Organization", name: input.client } : undefined,
    isPartOf: { "@id": websiteId(input.site) },
  });
}

export interface ArticleInput {
  site: string;
  url: string;
  title: string;
  description?: string | null;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  category?: string | null;
}

/** A Journal post. */
export function article(input: ArticleInput): Thing {
  return compact({
    "@type": "BlogPosting",
    "@id": `${input.url}#article`,
    url: input.url,
    mainEntityOfPage: input.url,
    headline: input.title,
    description: input.description,
    image: input.image,
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    articleSection: input.category,
    author: { "@id": organizationId(input.site) },
    publisher: { "@id": organizationId(input.site) },
    isPartOf: { "@id": websiteId(input.site) },
  });
}

/** One JSON-LD document holding every node of the page. */
export function graph(...nodes: Thing[]): Record<string, unknown> {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * The JSON for a <script type="application/ld+json">. "<" is escaped so content can never
 * close the script element early.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Drops null, undefined and empty-string values. */
function compact<T extends Record<string, unknown>>(object: T): T {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  ) as T;
}
