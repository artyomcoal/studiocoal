import { describe, expect, it } from "vitest";
import {
  type CollectionDoc,
  type CollectionRow,
  filterRows,
  isCollectionSort,
  isCollectionTab,
  mergeVersions,
  sortOptions,
  sortRows,
  timestamp,
} from "./collection-table";

type TestDoc = CollectionDoc & { client?: string | null; year?: number | null };
const doc = (id: string, fields: Partial<TestDoc> = {}): TestDoc => ({
  _id: id,
  _createdAt: "2026-01-01T00:00:00Z",
  _updatedAt: "2026-01-01T00:00:00Z",
  ...fields,
});
const ids = (list: { id: string }[]) => list.map((row) => row.id);

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

  it("filters by tab", () => {
    expect(ids(filterRows(rows, "all"))).toEqual(["a", "b", "c"]);
    expect(ids(filterRows(rows, "featured"))).toEqual(["a"]);
    expect(ids(filterRows(rows, "home"))).toEqual(["a", "c"]);
    expect(ids(filterRows(rows, "attention"))).toEqual(["b"]);
  });

  it("searches the given fields, ignoring case", () => {
    const byNameOrClient = (row: CollectionRow<TestDoc>) => [row.title, row.client];
    expect(ids(filterRows(rows, "all", " north ", byNameOrClient))).toEqual(["b"]);
    expect(ids(filterRows(rows, "home", "GAM", byNameOrClient))).toEqual(["c"]);
    // By default only the title is searched.
    expect(ids(filterRows(rows, "all", "north"))).toEqual([]);
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
  const order = (sort: Parameters<typeof sortRows>[1]) =>
    ids(sortRows(rows, sort, (row) => row.year));

  it("sorts by the collection's date, missing dates last, ties newest added first", () => {
    expect(order("date-desc")).toEqual(["b", "e", "d", "a", "c"]);
    expect(order("date-asc")).toEqual(["d", "a", "e", "b", "c"]);
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
    const before = ids(rows);
    sortRows(rows, "title-asc", (row) => row.year);
    expect(ids(rows)).toEqual(before);
  });
});

describe("timestamp", () => {
  it("parses ISO dates and rejects missing or invalid ones", () => {
    expect(timestamp("2026-03-01T00:00:00Z")).toBe(Date.UTC(2026, 2, 1));
    expect(timestamp(null)).toBeNull();
    expect(timestamp("not a date")).toBeNull();
  });
});

describe("sortOptions", () => {
  it("names the collection's date", () => {
    expect(sortOptions("Publish date")[0]).toEqual({
      value: "date-desc",
      label: "Publish date, newest first",
    });
  });
});

describe("guards", () => {
  it("accepts only known tabs and sorts", () => {
    expect(isCollectionTab("home")).toBe(true);
    expect(isCollectionTab("nope")).toBe(false);
    expect(isCollectionSort("title-asc")).toBe(true);
    expect(isCollectionSort("year-desc")).toBe(false);
  });
});
