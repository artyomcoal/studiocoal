import { describe, expect, it } from "vitest";
import {
  article,
  breadcrumbs,
  graph,
  organization,
  organizationId,
  project,
  serializeJsonLd,
  webPage,
  website,
} from "./structured-data";

const site = "https://studiocoal.com";

describe("organization", () => {
  it("keeps only absolute profile URLs and drops empty values", () => {
    expect(
      organization({ site, email: "", sameAs: ["https://instagram.com/x", "/about", null] }),
    ).toEqual({
      "@type": "Organization",
      "@id": "https://studiocoal.com/#organization",
      name: "Studio Coal",
      url: "https://studiocoal.com/",
      sameAs: ["https://instagram.com/x"],
    });
  });
});

describe("website", () => {
  it("is published by the organisation", () => {
    expect(website(site).publisher).toEqual({ "@id": organizationId(site) });
  });
});

describe("breadcrumbs", () => {
  it("numbers items from 1", () => {
    const list = breadcrumbs([
      ["Home", "https://studiocoal.com/"],
      ["Work", "https://studiocoal.com/work"],
    ]);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://studiocoal.com/" },
      { "@type": "ListItem", position: 2, name: "Work", item: "https://studiocoal.com/work" },
    ]);
  });
});

describe("project", () => {
  it("describes a Work project made by the studio", () => {
    const node = project({
      site,
      url: "https://studiocoal.com/work/acme",
      title: "Acme",
      client: "Acme Inc.",
      year: 2025,
      keywords: ["Brand", "Website"],
      description: null,
    });
    expect(node).toMatchObject({
      "@type": "CreativeWork",
      name: "Acme",
      dateCreated: "2025",
      keywords: "Brand, Website",
      creator: { "@id": "https://studiocoal.com/#organization" },
      sourceOrganization: { "@type": "Organization", name: "Acme Inc." },
    });
    expect(node).not.toHaveProperty("description");
  });
});

describe("article", () => {
  it("falls back to the publish date for dateModified", () => {
    const node = article({
      site,
      url: "https://studiocoal.com/journal/hello",
      title: "Hello",
      publishedAt: "2026-01-02T00:00:00Z",
    });
    expect(node).toMatchObject({
      "@type": "BlogPosting",
      headline: "Hello",
      datePublished: "2026-01-02T00:00:00Z",
      dateModified: "2026-01-02T00:00:00Z",
    });
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content can't close the script element", () => {
    const json = serializeJsonLd(graph(website(site), { "@type": "Thing", name: "</script>" }));
    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)["@graph"][1].name).toBe("</script>");
  });
});

describe("webPage", () => {
  it("describes a fixed page and links it to the site and the studio", () => {
    expect(
      webPage({
        site,
        url: "https://studiocoal.com/about",
        type: "AboutPage",
        name: "About — Studio Coal",
        description: "",
        summary: " A studio of four. ",
      }),
    ).toEqual({
      "@type": "AboutPage",
      "@id": "https://studiocoal.com/about#webpage",
      url: "https://studiocoal.com/about",
      name: "About — Studio Coal",
      abstract: "A studio of four.",
      isPartOf: { "@id": "https://studiocoal.com/#website" },
      about: { "@id": "https://studiocoal.com/#organization" },
    });
  });
});

describe("organization address", () => {
  it("joins the footer's address lines", () => {
    expect(organization({ site, address: "Keizersgracht 1\n\n1015 AA Amsterdam " }).address).toBe(
      "Keizersgracht 1, 1015 AA Amsterdam",
    );
  });
});
