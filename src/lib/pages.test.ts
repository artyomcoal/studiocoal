import { describe, expect, it } from "vitest";
import { pageByDocumentId, pageDocumentId, pageInfo, PAGES } from "./pages";
import { pageTitle, SEO_DESCRIPTION_LIMIT, SEO_TITLE_LIMIT } from "./seo";

describe("PAGES", () => {
  it("has unique keys and paths", () => {
    expect(new Set(PAGES.map((page) => page.key)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((page) => page.path)).size).toBe(PAGES.length);
  });

  it("keeps the built-in search texts within what Google shows", () => {
    for (const page of PAGES) {
      expect(pageTitle(page.title).length).toBeLessThanOrEqual(SEO_TITLE_LIMIT);
      expect((page.description ?? "").length).toBeLessThanOrEqual(SEO_DESCRIPTION_LIMIT);
    }
  });
});

describe("page documents", () => {
  it("maps a page to its document id and back, draft or published", () => {
    expect(pageDocumentId("cookie-policy")).toBe("page-cookie-policy");
    expect(pageByDocumentId("page-about")).toBe(pageInfo("about"));
    expect(pageByDocumentId("drafts.page-home")?.path).toBe("/");
  });

  it("knows no other documents", () => {
    expect(pageByDocumentId("siteSettings")).toBeUndefined();
    expect(pageByDocumentId(null)).toBeUndefined();
  });
});
