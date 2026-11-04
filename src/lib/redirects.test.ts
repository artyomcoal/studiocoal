import { describe, expect, it } from "vitest";
import { buildRedirects, normalizePath } from "./redirects";

describe("normalizePath", () => {
  it("adds a leading slash and drops trailing ones", () => {
    expect(normalizePath("work/old/")).toBe("/work/old");
    expect(normalizePath(" / ")).toBe("/");
    expect(normalizePath("https://example.com/x/")).toBe("https://example.com/x/");
  });
});

describe("buildRedirects", () => {
  it("redirects every previous slug to the current page", () => {
    expect(
      buildRedirects([
        { _type: "work", slug: "acme-rebrand", previousSlugs: ["acme", "acme-2024", null] },
        { _type: "journal", slug: "hello", previousSlugs: ["hi"] },
      ]),
    ).toEqual({
      "/work/acme": { status: 301, destination: "/work/acme-rebrand" },
      "/work/acme-2024": { status: 301, destination: "/work/acme-rebrand" },
      "/journal/hi": { status: 301, destination: "/journal/hello" },
    });
  });

  it("never shadows a live page or redirects a page to itself", () => {
    expect(
      buildRedirects([
        { _type: "work", slug: "new", previousSlugs: ["new", "taken"] },
        { _type: "work", slug: "taken" },
      ]),
    ).toEqual({});
  });

  it("ignores documents without a slug and unknown types", () => {
    expect(
      buildRedirects([
        { _type: "work", slug: null, previousSlugs: ["x"] },
        { _type: "siteSettings", slug: "x", previousSlugs: ["y"] },
      ]),
    ).toEqual({});
  });

  it("adds manual redirects after content ones, 302 when not permanent", () => {
    expect(
      buildRedirects(
        [{ _type: "work", slug: "b", previousSlugs: ["a"] }],
        [
          { from: "/work/a", to: "/elsewhere" },
          { from: "projects/", to: "/work" },
          { from: "/launch", to: "https://example.com/launch", permanent: false },
          { from: "https://other.com/x", to: "/work" },
          { from: "/incomplete" },
        ],
      ),
    ).toEqual({
      "/work/a": { status: 301, destination: "/work/b" },
      "/projects": { status: 301, destination: "/work" },
      "/launch": { status: 302, destination: "https://example.com/launch" },
    });
  });
});
