import { describe, expect, it } from "vitest";
import { iconPath, ICONS, manifestIcons } from "./icons";

describe("icons", () => {
  it("serves every icon from /icons", () => {
    expect(iconPath("icon-48.png")).toBe("/icons/icon-48.png");
  });

  it("gives Google a tab icon that is a multiple of 48", () => {
    expect(ICONS.some((icon) => icon.rel === "icon" && icon.size % 48 === 0)).toBe(true);
  });

  it("lists the square app icons in the manifest, without the iOS one", () => {
    expect(manifestIcons()).toEqual([
      { src: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ]);
  });
});
