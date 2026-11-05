import { describe, expect, it } from "vitest";
import { isEmptyValue } from "./empty";

describe("isEmptyValue", () => {
  it("treats missing, blank and empty values as empty", () => {
    for (const value of [
      undefined,
      null,
      "",
      [],
      {},
      { _type: "image" },
      { _type: "x", alt: "" },
    ]) {
      expect(isEmptyValue(value)).toBe(true);
    }
  });

  it("treats anything entered as filled", () => {
    for (const value of [
      0,
      false,
      "a",
      [1],
      { _type: "slug", current: "x" },
      { asset: { _ref: "r" } },
    ]) {
      expect(isEmptyValue(value)).toBe(false);
    }
  });
});
