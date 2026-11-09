import { describe, expect, it } from "vitest";
import { relatedWork } from "./services";

const work = (id: string) => ({ _id: id });

describe("relatedWork", () => {
  it("falls back to the newest projects when nothing is picked", () => {
    expect(relatedWork(null, [work("a"), work("b"), work("c")])).toEqual([work("a"), work("b")]);
    expect(relatedWork([], [work("a")])).toEqual([work("a")]);
  });

  it("shows the picks in their order", () => {
    expect(relatedWork([work("c"), work("b")], [work("a"), work("b")])).toEqual([
      work("c"),
      work("b"),
    ]);
  });

  it("fills a single pick with the newest other project", () => {
    expect(relatedWork([work("b")], [work("b"), work("a")])).toEqual([work("b"), work("a")]);
  });

  it("skips picks that didn't resolve (unpublished or untagged)", () => {
    expect(relatedWork([null, work("c")], [work("a")])).toEqual([work("c"), work("a")]);
  });

  it("never shows more than the limit", () => {
    expect(relatedWork([work("a"), work("b"), work("c")], [])).toHaveLength(2);
  });
});
