import { describe, expect, it } from "vitest";
import {
  AI_CRAWLERS,
  buildSeo,
  canonicalUrl,
  contentPath,
  contentSeo,
  DEFAULT_DESCRIPTION,
  pageTitle,
  robotsTxt,
  SEO_PAGE_TITLE_MAX,
  SEO_TITLE_LIMIT,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  slugify,
} from "./seo";

const site = "https://studiocoal.com";

describe("pageTitle", () => {
  it("appends the site name", () => {
    expect(pageTitle("Work")).toBe("Work — Studio Coal");
  });

  it("uses only the site name on the home page", () => {
    expect(pageTitle()).toBe("Studio Coal");
    expect(pageTitle("  ")).toBe("Studio Coal");
    expect(pageTitle("Studio Coal")).toBe("Studio Coal");
  });
});

describe("canonicalUrl", () => {
  it("keeps the root slash and strips trailing slashes elsewhere", () => {
    expect(canonicalUrl("/", site)).toBe("https://studiocoal.com/");
    expect(canonicalUrl("/work/", site)).toBe("https://studiocoal.com/work");
    expect(canonicalUrl("/work/some-project", site)).toBe(
      "https://studiocoal.com/work/some-project",
    );
  });
});

describe("buildSeo", () => {
  it("falls back to the default description", () => {
    expect(buildSeo({ pathname: "/", site, description: null }).description).toBe(
      DEFAULT_DESCRIPTION,
    );
  });

  it("passes through image and noindex", () => {
    const seo = buildSeo({ pathname: "/a", site, image: "https://x/y.jpg", noindex: true });
    expect(seo).toMatchObject({ image: "https://x/y.jpg", noindex: true });
  });
});

describe("slugify", () => {
  it("makes a clean, lowercase slug", () => {
    expect(slugify("Ünïcode & Co. — 2026!")).toBe("unicode-and-co-2026");
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
    expect(slugify("")).toBe("");
  });

  it("caps the length without a trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(95)} b`);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug).toMatch(SLUG_PATTERN);
  });
});

describe("contentSeo", () => {
  it("prefers the SEO overrides", () => {
    expect(
      contentSeo({
        title: "Acme",
        excerpt: "Excerpt",
        seo: { title: " SEO title ", description: "SEO description", noIndex: true },
      }),
    ).toEqual({
      title: "SEO title",
      description: "SEO description",
      noindex: true,
      source: { title: "seo", description: "seo" },
    });
  });

  it("falls back to the title and excerpt, then the site default", () => {
    expect(contentSeo({ title: "Acme", excerpt: "Excerpt", seo: { title: "  " } })).toMatchObject({
      title: "Acme",
      description: "Excerpt",
      noindex: false,
      source: { title: "title", description: "excerpt" },
    });
    expect(contentSeo({})).toMatchObject({
      title: undefined,
      description: null,
      source: { title: "none", description: "default" },
    });
  });
});

describe("contentPath", () => {
  it("prefixes the content type's path", () => {
    expect(contentPath("work", "acme")).toBe("/work/acme");
    expect(contentPath("journal", "hello")).toBe("/journal/hello");
  });
});

describe("SEO_PAGE_TITLE_MAX", () => {
  it("leaves room for the site name within the title limit", () => {
    expect(SEO_PAGE_TITLE_MAX).toBe(SEO_TITLE_LIMIT - (pageTitle("x").length - 1));
  });
});

describe("robotsTxt", () => {
  const sitemap = "https://studiocoal.com/sitemap-index.xml";

  it("closes everything outside production", () => {
    expect(robotsTxt({ production: false, sitemap })).toBe("User-agent: *\nDisallow: /\n");
  });

  it("opens the site, except the Studio, and names the sitemap", () => {
    expect(robotsTxt({ production: true, sitemap, allowAi: null })).toBe(
      `User-agent: *\nDisallow: /studio\n\nSitemap: ${sitemap}\n`,
    );
  });

  it("turns every AI crawler away when switched off", () => {
    const body = robotsTxt({ production: true, sitemap, allowAi: false });
    for (const bot of AI_CRAWLERS) expect(body).toContain(`User-agent: ${bot}\n`);
    expect(body).toContain("User-agent: CCBot\nDisallow: /\n\nSitemap:");
    expect(body.startsWith("User-agent: *\nDisallow: /studio\n")).toBe(true);
  });
});
