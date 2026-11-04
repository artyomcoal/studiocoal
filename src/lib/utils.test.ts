import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cn } from "./utils";

const typeUtilities = [
  ...readFileSync(new URL("../styles/typography.css", import.meta.url), "utf8").matchAll(
    /@utility (text-[a-z-]+)/g,
  ),
].map((match) => match[1]);

describe("cn", () => {
  it("joins and dedupes conflicting Tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("px-container", { hidden: false }, undefined)).toBe("px-container");
  });

  it("finds the type utilities in typography.css", () => {
    expect(typeUtilities.length).toBeGreaterThan(0);
  });

  // Guards the rule in CLAUDE.md: every type utility must be in the font-size list in utils.ts,
  // otherwise tailwind-merge drops it when a text color class is also present.
  it.each(typeUtilities)("keeps %s next to a text color", (utility) => {
    expect(cn(utility, "text-fg-primary")).toBe(`${utility} text-fg-primary`);
  });

  it("lets a later type utility override an earlier one", () => {
    expect(cn("text-body-md", "text-headline-xs")).toBe("text-headline-xs");
  });
});
