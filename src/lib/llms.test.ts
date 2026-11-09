import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llms";

describe("buildLlmsTxt", () => {
  it("writes the title, summary, answers and described links", () => {
    expect(
      buildLlmsTxt({
        name: "Studio Coal",
        summary: "A design studio\nfor brand, web and product.",
        faq: [
          { question: "Where is the studio?", answer: "In Amsterdam." },
          { question: "No answer yet", answer: " " },
        ],
        sections: [
          {
            title: "Pages",
            links: [
              { title: "About", url: "https://studiocoal.com/about", description: "Who we are." },
              { title: "Work", url: "https://studiocoal.com/work" },
            ],
          },
          { title: "Journal", links: [] },
        ],
      }),
    ).toBe(
      [
        "# Studio Coal",
        "> A design studio for brand, web and product.",
        "- **Where is the studio?** In Amsterdam.",
        "## Pages\n\n- [About](https://studiocoal.com/about): Who we are.\n- [Work](https://studiocoal.com/work)",
      ].join("\n\n") + "\n",
    );
  });

  it("needs nothing but a name", () => {
    expect(buildLlmsTxt({ name: "Studio Coal", sections: [] })).toBe("# Studio Coal\n");
  });
});
