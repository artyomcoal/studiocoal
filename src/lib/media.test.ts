import { describe, expect, it } from "vitest";
import { aspectMismatch, assetDimensions, isHlsUrl } from "./media";

describe("assetDimensions", () => {
  it("reads width and height from an asset reference", () => {
    expect(assetDimensions("image-abc123-1600x2000-jpg")).toEqual({ width: 1600, height: 2000 });
  });

  it("applies the crop", () => {
    expect(assetDimensions("image-abc-1000x1000-png", { left: 0.1, right: 0.1 })).toEqual({
      width: 800,
      height: 1000,
    });
  });

  it("returns null for anything else", () => {
    expect(assetDimensions(undefined)).toBeNull();
    expect(assetDimensions("file-abc-pdf")).toBeNull();
  });
});

describe("aspectMismatch", () => {
  it("accepts an image that matches the slot", () => {
    expect(aspectMismatch("image-a-1600x2000-jpg", null, "portrait")).toBeNull();
    expect(aspectMismatch("image-a-1920x1080-jpg", null, "landscape")).toBeNull();
  });

  it("warns when the ratio is off", () => {
    expect(aspectMismatch("image-a-1920x1080-jpg", null, "portrait")).toMatch(/4:5/);
  });

  it("accepts an off-ratio image that the editor cropped to fit", () => {
    // 2000 × 2000 cropped to 1600 × 2000 → 4:5
    expect(aspectMismatch("image-a-2000x2000-jpg", { left: 0.1, right: 0.1 }, "portrait")).toBe(
      null,
    );
  });
});

describe("isHlsUrl", () => {
  it("accepts an https .m3u8 playlist", () => {
    expect(isHlsUrl("https://vz-1234.b-cdn.net/0f1e/playlist.m3u8")).toBe(true);
  });

  it("rejects other URLs", () => {
    expect(isHlsUrl("http://vz-1234.b-cdn.net/0f1e/playlist.m3u8")).toBe(false);
    expect(isHlsUrl("https://vz-1234.b-cdn.net/0f1e/play_720p.mp4")).toBe(false);
    expect(isHlsUrl("not a url")).toBe(false);
  });
});
