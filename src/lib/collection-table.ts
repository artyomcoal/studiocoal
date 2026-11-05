/**
 * Studio collection tables (Work, Journal): tabs, search and sorting for
 * src/sanity/components/CollectionTable.tsx. Pure functions, covered by Vitest.
 */

export interface CollectionDoc {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title?: string | null;
  featured?: boolean | null;
  needsAttention?: boolean | null;
}

export type DocStatus = "published" | "draft" | "changed";

export type CollectionRow<T extends CollectionDoc> = T & {
  /** Published id (no "drafts." prefix): what the document pane opens. */
  id: string;
  /** published: live as is · draft: never published · changed: live, with unpublished edits. */
  status: DocStatus;
  /** Shown on the home page right now (published version). */
  onHome: boolean;
  /** When the live version was last published (its `_updatedAt`), or null if never. */
  lastPublishedAt: string | null;
  /** When the document was first created (the earlier `_createdAt` of the two versions). */
  createdAt: string;
  /** When any version was last edited (the later `_updatedAt` of the two versions). */
  lastEditedAt: string;
};

export const COLLECTION_TABS = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "home", label: "On home page" },
  { value: "attention", label: "Needs attention" },
] as const;
export type CollectionTab = (typeof COLLECTION_TABS)[number]["value"];

/** "date" is each collection's own date: a project's year, a post's publish date. */
export const COLLECTION_SORTS = [
  "date-desc",
  "date-asc",
  "title-asc",
  "title-desc",
  "created-desc",
  "created-asc",
] as const;
export type CollectionSort = (typeof COLLECTION_SORTS)[number];

/** Sort menu labels; `date` names the collection's date ("Project date", "Publish date"). */
export function sortOptions(date: string): { value: CollectionSort; label: string }[] {
  return [
    { value: "date-desc", label: `${date}, newest first` },
    { value: "date-asc", label: `${date}, oldest first` },
    { value: "title-asc", label: "Alphabetical, A–Z" },
    { value: "title-desc", label: "Alphabetical, Z–A" },
    { value: "created-desc", label: "Date added, newest first" },
    { value: "created-asc", label: "Date added, oldest first" },
  ];
}

const DRAFT_PREFIX = "drafts.";

/** One row per document: the draft when there is one (what editors see), else the published. */
export function mergeVersions<T extends CollectionDoc>(
  docs: T[],
  homeIds: string[],
): CollectionRow<T>[] {
  const byId = new Map<string, { published?: T; draft?: T }>();
  for (const doc of docs) {
    const isDraft = doc._id.startsWith(DRAFT_PREFIX);
    const id = isDraft ? doc._id.slice(DRAFT_PREFIX.length) : doc._id;
    const entry = byId.get(id) ?? {};
    entry[isDraft ? "draft" : "published"] = doc;
    byId.set(id, entry);
  }
  const home = new Set(homeIds);
  const earliest = (a: string, b?: string) => (b && b < a ? b : a);
  const latest = (a: string, b?: string) => (b && b > a ? b : a);
  return [...byId].map(([id, { published, draft }]) => {
    const shown = (draft ?? published)!;
    return {
      ...shown,
      id,
      status: published ? (draft ? "changed" : "published") : "draft",
      onHome: home.has(id),
      lastPublishedAt: published?._updatedAt ?? null,
      createdAt: earliest(shown._createdAt, published?._createdAt),
      lastEditedAt: latest(shown._updatedAt, published?._updatedAt),
    };
  });
}

/** Rows in a tab where any of `searchable(row)` contains the search text. */
export function filterRows<T extends CollectionDoc>(
  rows: CollectionRow<T>[],
  tab: CollectionTab,
  search = "",
  searchable: (row: CollectionRow<T>) => (string | null | undefined)[] = (row) => [row.title],
): CollectionRow<T>[] {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (tab === "featured" && row.featured !== true) return false;
    if (tab === "home" && !row.onHome) return false;
    if (tab === "attention" && row.needsAttention !== true) return false;
    if (!query) return true;
    return searchable(row).some((text) => text?.toLowerCase().includes(query));
  });
}

const byText = (a?: string | null, b?: string | null) =>
  // Untitled rows go last in either direction.
  !a ? (!b ? 0 : 1) : !b ? -1 : a.localeCompare(b, "en", { sensitivity: "base", numeric: true });

/**
 * Sorted copy. `dateOf` gives the collection's date as a number (a year, a timestamp), or
 * null; rows without one go last. Ties fall back to the newest added first.
 */
export function sortRows<T extends CollectionDoc>(
  rows: CollectionRow<T>[],
  sort: CollectionSort,
  dateOf: (row: CollectionRow<T>) => number | null | undefined,
): CollectionRow<T>[] {
  const newestAdded = (a: CollectionRow<T>, b: CollectionRow<T>) =>
    b._createdAt.localeCompare(a._createdAt);
  const compare: Record<CollectionSort, (a: CollectionRow<T>, b: CollectionRow<T>) => number> = {
    "date-desc": (a, b) => (dateOf(b) ?? -Infinity) - (dateOf(a) ?? -Infinity),
    "date-asc": (a, b) => (dateOf(a) ?? Infinity) - (dateOf(b) ?? Infinity),
    "title-asc": (a, b) => byText(a.title, b.title),
    "title-desc": (a, b) =>
      !a.title || !b.title ? byText(a.title, b.title) : byText(b.title, a.title),
    "created-desc": newestAdded,
    "created-asc": (a, b) => a._createdAt.localeCompare(b._createdAt),
  };
  return [...rows].sort((a, b) => compare[sort](a, b) || newestAdded(a, b));
}

/** "2026-03-01T…" → timestamp, for sorting by a datetime field. */
export const timestamp = (iso?: string | null): number | null =>
  iso && !Number.isNaN(Date.parse(iso)) ? Date.parse(iso) : null;

export const isCollectionTab = (value: unknown): value is CollectionTab =>
  COLLECTION_TABS.some((tab) => tab.value === value);
export const isCollectionSort = (value: unknown): value is CollectionSort =>
  COLLECTION_SORTS.includes(value as CollectionSort);
