import { describe, expect, it } from "vitest";
import {
  neutralColor,
  renderSocialImage,
  socialImageFont,
  socialImagePath,
  titleSize,
  withAlpha,
} from "./social-image";

describe("neutralColor", () => {
  it("reads a palette step from tokens.css", () => {
    const css = ":root { --color-neutral-50: #ffffff; --color-neutral-900: #0f0f10; }";
    expect(neutralColor(css, 900)).toBe("#0f0f10");
    expect(() => neutralColor(css, 500)).toThrow();
  });
});

describe("withAlpha", () => {
  it("turns a hex colour into rgba", () => {
    expect(withAlpha("#0f0f10", 0.8)).toBe("rgba(15, 15, 16, 0.8)");
    expect(withAlpha("#fff", 1)).toBe("rgba(255, 255, 255, 1)");
  });
});

describe("titleSize", () => {
  it("steps down for longer titles", () => {
    expect(titleSize("Acme")).toBe(80);
    expect(titleSize("a".repeat(40))).toBe(64);
    expect(titleSize("a".repeat(80))).toBe(56);
  });
});

describe("socialImagePath", () => {
  it("is a PNG per page", () => {
    expect(socialImagePath("work", "acme")).toBe("/og/work/acme.png");
  });
});

describe.runIf(socialImageFont())("renderSocialImage", () => {
  // Rendering takes a few seconds, more on CI.
  it("renders a 1200 × 630 PNG", { timeout: 30_000 }, async () => {
    const png = await renderSocialImage({ eyebrow: "Work", title: "Acme rebrand" });
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});
