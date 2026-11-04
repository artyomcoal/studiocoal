import { describe, expect, it } from "vitest";
import { buildSeo, canonicalUrl, DEFAULT_DESCRIPTION, pageTitle } from "./seo";

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
