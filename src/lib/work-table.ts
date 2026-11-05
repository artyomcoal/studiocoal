/**
 * Studio › Work table: tabs, search and sorting (src/sanity/components/WorkTable.tsx).
 * Pure functions, covered by Vitest.
 */

export interface WorkTableDoc {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  title?: string | null;
  client?: string | null;
  year?: number | null;
  featured?: boolean | null;
}

export type WorkStatus = "published" | "draft" | "changed";

export type WorkRow<T extends WorkTableDoc> = T & {
  /** Published id (no "drafts." prefix): what the document pane opens. */
  id: string;
  /** published: live as is · draft: never published · changed: live, with unpublished edits. */
  status: WorkStatus;
  /** Shown in the home page's Featured Work section right now (published version). */
  onHome: boolean;
};

export const WORK_TABS = [
  { value: "all", label: "All" },
  { value: "featured", label: "Featured" },
  { value: "home", label: "On home page" },
  { value: "attention", label: "Needs attention" },
] as const;
export type WorkTab = (typeof WORK_TABS)[number]["value"];

export const WORK_SORTS = [
  { value: "year-desc", label: "Project date, newest first" },
  { value: "year-asc", label: "Project date, oldest first" },
  { value: "title-asc", label: "Alphabetical, A–Z" },
  { value: "title-desc", label: "Alphabetical, Z–A" },
  { value: "created-desc", label: "Date added, newest first" },
  { value: "created-asc", label: "Date added, oldest first" },
] as const;
export type WorkSort = (typeof WORK_SORTS)[number]["value"];

const DRAFT_PREFIX = "drafts.";

/** One row per project: the draft when there is one (what editors see), else the published. */
export function mergeVersions<T extends WorkTableDoc>(docs: T[], homeIds: string[]): WorkRow<T>[] {
  const byId = new Map<string, { published?: T; draft?: T }>();
  for (const doc of docs) {
    const isDraft = doc._id.startsWith(DRAFT_PREFIX);
    const id = isDraft ? doc._id.slice(DRAFT_PREFIX.length) : doc._id;
    const entry = byId.get(id) ?? {};
    entry[isDraft ? "draft" : "published"] = doc;
    byId.set(id, entry);
  }
  const home = new Set(homeIds);
  return [...byId].map(([id, { published, draft }]) => ({
    ...(draft ?? published)!,
    id,
    status: published ? (draft ? "changed" : "published") : "draft",
    onHome: home.has(id),
  }));
}

/** Rows in a tab whose name or client contains the search text. */
export function filterRows<T extends WorkTableDoc & { needsAttention?: boolean | null }>(
  rows: WorkRow<T>[],
  tab: WorkTab,
  search = "",
): WorkRow<T>[] {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (tab === "featured" && row.featured !== true) return false;
    if (tab === "home" && !row.onHome) return false;
    if (tab === "attention" && row.needsAttention !== true) return false;
    if (!query) return true;
    return [row.title, row.client].some((text) => text?.toLowerCase().includes(query));
  });
}

const byText = (a?: string | null, b?: string | null) =>
  // Untitled rows go last in either direction.
  !a ? (!b ? 0 : 1) : !b ? -1 : a.localeCompare(b, "en", { sensitivity: "base", numeric: true });

/** Sorted copy. Ties fall back to the newest added first, so the order is stable. */
export function sortRows<T extends WorkTableDoc>(rows: WorkRow<T>[], sort: WorkSort): WorkRow<T>[] {
  const newestAdded = (a: WorkRow<T>, b: WorkRow<T>) => b._createdAt.localeCompare(a._createdAt);
  const compare: Record<WorkSort, (a: WorkRow<T>, b: WorkRow<T>) => number> = {
    // No year sorts last, as on the site.
    "year-desc": (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity),
    "year-asc": (a, b) => (a.year ?? Infinity) - (b.year ?? Infinity),
    "title-asc": (a, b) => byText(a.title, b.title),
    "title-desc": (a, b) =>
      !a.title || !b.title ? byText(a.title, b.title) : byText(b.title, a.title),
    "created-desc": newestAdded,
    "created-asc": (a, b) => a._createdAt.localeCompare(b._createdAt),
  };
  return [...rows].sort((a, b) => compare[sort](a, b) || newestAdded(a, b));
}

export const isWorkTab = (value: unknown): value is WorkTab =>
  WORK_TABS.some((tab) => tab.value === value);
export const isWorkSort = (value: unknown): value is WorkSort =>
  WORK_SORTS.some((sort) => sort.value === value);
