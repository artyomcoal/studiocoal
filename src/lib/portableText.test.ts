import { describe, expect, it } from "vitest";
import { escapeHtml, groupLists, renderSpans, safeHref, type PtBlock } from "./portableText";

const block = (over: Partial<PtBlock>): PtBlock => ({ _type: "block", _key: "b", ...over });

describe("groupLists", () => {
  it("groups consecutive list items of the same kind", () => {
    const out = groupLists([
      block({ _key: "a" }),
      block({ _key: "b", listItem: "bullet" }),
      block({ _key: "c", listItem: "bullet" }),
      block({ _key: "d", listItem: "number" }),
      block({ _key: "e" }),
    ]);
    expect(out.map((node) => node._type)).toEqual(["block", "list", "list", "block"]);
    expect((out[1] as { items: unknown[] }).items).toHaveLength(2);
  });

  it("leaves non-block nodes alone", () => {
    expect(groupLists([{ _type: "imageWithAlt", _key: "i" }])).toEqual([
      { _type: "imageWithAlt", _key: "i" },
    ]);
  });
});

describe("renderSpans", () => {
  it("escapes text and applies marks", () => {
    const html = renderSpans(
      block({
        children: [
          { _type: "span", text: "a < b & ", marks: [] },
          { _type: "span", text: "bold", marks: ["strong"] },
          { _type: "span", text: " link", marks: ["l1", "em"] },
        ],
        markDefs: [{ _key: "l1", _type: "link", href: "https://studiocoal.com" }],
      }),
    );
    expect(html).toContain("a &lt; b &amp; ");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toMatch(/<em><a href="https:\/\/studiocoal.com" class="[^"]+"> link<\/a><\/em>/);
  });

  it("drops unsafe links but keeps their text", () => {
    const html = renderSpans(
      block({
        children: [{ _type: "span", text: "x", marks: ["l1"] }],
        markDefs: [{ _key: "l1", _type: "link", href: "javascript:alert(1)" }],
      }),
    );
    expect(html).toBe("x");
  });

  it("turns newlines into <br>", () => {
    expect(renderSpans(block({ children: [{ _type: "span", text: "a\nb" }] }))).toBe("a<br>b");
  });
});

describe("safeHref / escapeHtml", () => {
  it("allows web, mail, phone and relative links", () => {
    for (const href of ["https://a.b", "http://a.b", "mailto:a@b.c", "tel:+1", "/work", "#x"]) {
      expect(safeHref(href)).toBe(href);
    }
    expect(safeHref("data:text/html,x")).toBeNull();
  });

  it("escapes quotes", () => {
    expect(escapeHtml(`"'`)).toBe("&quot;&#39;");
  });
});
