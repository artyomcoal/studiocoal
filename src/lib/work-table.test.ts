import { describe, expect, it } from "vitest";
import {
  filterRows,
  isWorkSort,
  isWorkTab,
  mergeVersions,
  sortRows,
  type WorkTableDoc,
} from "./work-table";

type TestDoc = WorkTableDoc & { needsAttention?: boolean };
const doc = (id: string, fields: Partial<TestDoc> = {}): TestDoc => ({
  _id: id,
  _createdAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-01T00:00:00Z",
  ...fields,
});

describe("mergeVersions", () => {
  it("shows the draft when there is one and derives the status", () => {
    const rows = mergeVersions(
      [
        doc("a", { title: "A live" }),
        doc("drafts.a", { title: "A edited" }),
        doc("b", { title: "B" }),
        doc("drafts.c", { title: "C new" }),
      ],
      ["b"],
    );
    expect(rows.map(({ id, title, status, onHome }) => ({ id, title, status, onHome }))).toEqual([
      { id: "a", title: "A edited", status: "changed", onHome: false },
      { id: "b", title: "B", status: "published", onHome: true },
      { id: "c", title: "C new", status: "draft", onHome: false },
    ]);
  });
});

describe("filterRows", () => {
  const rows = mergeVersions(
    [
      doc("a", { title: "Acme", client: "Acme Inc.", featured: true }),
      doc("b", { title: "Beta", client: "Northwind", needsAttention: true }),
      doc("c", { title: "Gamma" }),
    ],
    ["a", "c"],
  );
  const ids = (list: { id: string }[]) => list.map((row) => row.id);

  it("filters by tab", () => {
    expect(ids(filterRows(rows, "all"))).toEqual(["a", "b", "c"]);
    expect(ids(filterRows(rows, "featured"))).toEqual(["a"]);
    expect(ids(filterRows(rows, "home"))).toEqual(["a", "c"]);
    expect(ids(filterRows(rows, "attention"))).toEqual(["b"]);
  });

  it("searches the name and client, ignoring case", () => {
    expect(ids(filterRows(rows, "all", " north "))).toEqual(["b"]);
    expect(ids(filterRows(rows, "home", "GAM"))).toEqual(["c"]);
  });
});

describe("sortRows", () => {
  const rows = mergeVersions(
    [
      doc("a", { title: "beta", year: 2024, _createdAt: "2026-03-01T00:00:00Z" }),
      doc("b", { title: "Alpha", year: 2026, _createdAt: "2026-01-01T00:00:00Z" }),
      doc("c", { title: null, year: null, _createdAt: "2026-02-01T00:00:00Z" }),
      doc("d", { title: "Item 10", year: 2024, _createdAt: "2026-04-01T00:00:00Z" }),
      doc("e", { title: "Item 9", year: 2025, _createdAt: "2026-05-01T00:00:00Z" }),
    ],
    [],
  );
  const order = (sort: Parameters<typeof sortRows>[1]) => sortRows(rows, sort).map((r) => r.id);

  it("sorts by project date, missing years last, ties newest added first", () => {
    expect(order("year-desc")).toEqual(["b", "e", "d", "a", "c"]);
    expect(order("year-asc")).toEqual(["d", "a", "e", "b", "c"]);
  });

  it("sorts alphabetically, case- and number-aware, untitled last", () => {
    expect(order("title-asc")).toEqual(["b", "a", "e", "d", "c"]);
    expect(order("title-desc")).toEqual(["d", "e", "a", "b", "c"]);
  });

  it("sorts by date added", () => {
    expect(order("created-desc")).toEqual(["e", "d", "a", "c", "b"]);
    expect(order("created-asc")).toEqual(["b", "c", "a", "d", "e"]);
  });

  it("doesn't change the input", () => {
    const before = rows.map((r) => r.id);
    sortRows(rows, "title-asc");
    expect(rows.map((r) => r.id)).toEqual(before);
  });
});

describe("guards", () => {
  it("accepts only known tabs and sorts", () => {
    expect(isWorkTab("home")).toBe(true);
    expect(isWorkTab("nope")).toBe(false);
    expect(isWorkSort("title-asc")).toBe(true);
    expect(isWorkSort(null)).toBe(false);
  });
});
