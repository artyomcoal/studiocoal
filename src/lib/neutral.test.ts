import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NEUTRAL } from "./neutral";

describe("NEUTRAL", () => {
  it("matches --color-neutral-* in tokens.css", () => {
    const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");
    for (const [step, value] of Object.entries(NEUTRAL)) {
      const match = css.match(new RegExp(`--color-neutral-${step}:\\s*(#[0-9a-fA-F]{3,8})`));
      expect(match?.[1]?.toLowerCase(), `--color-neutral-${step}`).toBe(value);
    }
  });
});
