/** @jsxImportSource react */
/**
 * A Studio collection (Work, Journal) as a table in the style of a Webflow CMS collection
 * (Studio only, React). Configured per type in WorkTable.tsx and JournalTable.tsx.
 *
 * - Tabs: All · Featured · On home page (what the home page shows right now) · Needs attention.
 * - Search, and sort by the collection's date, name or date added.
 * - A row opens the document in the pane next to the table. Rows show the draft when there
 *   is one, with its status: Published, Changed (unpublished edits) or Draft.
 * - Updates live as documents change. The tab and sort are remembered per browser.
 *
 * Styles follow the Studio's light / dark theme through its --card-* CSS variables; the
 * site's design tokens don't exist in the Studio.
 */
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { type SanityClient, useClient, useValidationStatus } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import {
  COLLECTION_TABS,
  type CollectionDoc,
  type CollectionRow,
  type CollectionSort,
  type CollectionTab,
  type DocStatus,
  filterRows,
  isCollectionSort,
  isCollectionTab,
  mergeVersions,
  sortOptions,
  sortRows,
} from "../../lib/collection-table";
import { CONTENT_PATHS, type ContentType } from "../../lib/seo";
import { BunnyThumbnail } from "./BunnyThumbnail";

export const API_VERSION = "2026-11-01";

/** What every collection's table query returns per document. */
export interface TableDoc extends CollectionDoc {
  slug?: string | null;
  noIndex?: boolean | null;
  thumbnail?: { asset?: unknown } | null;
  /** Playlist URL of a video thumbnail without a poster: Bunny's thumbnail is shown. */
  thumbnailVideo?: string | null;
}

export interface Column<T extends TableDoc> {
  header: string;
  cell: (row: CollectionRow<T>) => ReactNode;
  /** "wide": hidden once the pane narrows (a document is open beside it); "medium": later. */
  hide?: "wide" | "medium";
}

export interface CollectionTableConfig<T extends TableDoc> {
  type: ContentType;
  title: string;
  /** "project" / "post", for buttons and messages. */
  noun: string;
  load: (client: SanityClient) => Promise<{ docs: T[]; home: string[] }>;
  /** How many documents the home page shows, and how it picks them. */
  homeLimit: number;
  homeRule: string;
  /** The collection's own date, for sorting: "Project date" from `year`, … */
  dateLabel: string;
  dateOf: (row: CollectionRow<T>) => number | null | undefined;
  searchPlaceholder: string;
  searchable: (row: CollectionRow<T>) => (string | null | undefined)[];
  /** Initial value template for new documents from the Featured tab. */
  featuredTemplate: string;
  /** Columns between the name and the status. */
  columns: Column<T>[];
}

const STATUS_LABEL: Record<DocStatus, string> = {
  published: "Published",
  changed: "Changed",
  draft: "Draft",
};

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function updatedAgo(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

/**
 * Runs the Studio's validation for one document (as its form does) and reports the error and
 * warning messages. Renders nothing. Dismissed warnings (e.g. a size warning ticked as fine)
 * are already gone from the validation, so they don't count.
 */
function ValidationProbe({
  id,
  versionId,
  type,
  onIssues,
}: {
  id: string;
  versionId: string;
  type: string;
  onIssues: (id: string, messages: string[]) => void;
}) {
  const { validation, isValidating } = useValidationStatus(versionId, type, false);
  const messages = validation
    .filter((marker) => marker.level === "error" || marker.level === "warning")
    .map((marker) => marker.message);
  const key = messages.join("\n");
  useEffect(() => {
    if (!isValidating) onIssues(id, key ? key.split("\n") : []);
  }, [id, key, isValidating, onIssues]);
  return null;
}

/** An em dash for empty cells. */
export const Empty = () => <span className="ct-muted">—</span>;

function readSaved(key: string): { tab: CollectionTab; sort: CollectionSort } {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
    return {
      tab: isCollectionTab(saved.tab) ? saved.tab : "all",
      sort: isCollectionSort(saved.sort) ? saved.sort : "date-desc",
    };
  } catch {
    return { tab: "all", sort: "date-desc" };
  }
}

export function CollectionTable<T extends TableDoc>({
  config,
}: {
  config: CollectionTableConfig<T>;
}) {
  const { type, title, noun, homeLimit } = config;
  const storageKey = `studio:${type}-table`;
  const client = useClient({ apiVersion: API_VERSION });
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
  const openId = routerPanesState[groupIndex + 1]?.[0]?.id;

  const [data, setData] = useState<{ docs: T[]; home: string[] } | null>(null);
  const [error, setError] = useState(false);
  const [{ tab, sort }, setView] = useState(() => readSaved(storageKey));
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tab, sort }));
    } catch {
      /* Storage blocked: the view just isn't remembered. */
    }
  }, [storageKey, tab, sort]);

  // Load, then reload shortly after any document of this type changes.
  const { load } = config;
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reload = () =>
      load(client)
        .then((result) => active && (setData(result), setError(false)))
        .catch(() => active && setError(true));
    void reload();
    const subscription = client
      .listen("*[_type == $type]", { type }, { events: ["mutation"], includeResult: false })
      .subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(reload, 400);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [client, load, type]);

  // "Needs attention": the same validation the form shows (errors and warnings not dismissed),
  // reported per document by <ValidationProbe> below.
  const [issues, setIssues] = useState<Map<string, string[]>>(new Map());
  const reportIssues = useCallback((id: string, messages: string[]) => {
    setIssues((current) => {
      const before = current.get(id);
      if (before && before.join("\n") === messages.join("\n")) return current;
      return new Map(current).set(id, messages);
    });
  }, []);
  const merged = useMemo(() => (data ? mergeVersions(data.docs, data.home) : []), [data]);
  const rows = useMemo(
    () => merged.map((row) => ({ ...row, needsAttention: (issues.get(row.id)?.length ?? 0) > 0 })),
    [merged, issues],
  );
  const visible = useMemo(
    () => sortRows(filterRows(rows, tab, search, config.searchable), sort, config.dateOf),
    [rows, tab, search, sort, config],
  );
  const counts = useMemo(
    () =>
      Object.fromEntries(
        COLLECTION_TABS.map(({ value }) => [value, filterRows(rows, value).length]),
      ),
    [rows],
  );
  const imageUrl = useMemo(() => {
    const builder = createImageUrlBuilder(client);
    return (image: SanityImageSource) =>
      builder.image(image).width(80).height(100).fit("crop").auto("format").url();
  }, [client]);

  const selectTab = (value: CollectionTab) => setView((view) => ({ ...view, tab: value }));
  // Arrow keys move between tabs, as in a native tab list.
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = COLLECTION_TABS.findIndex(({ value }) => value === tab);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = COLLECTION_TABS[(index + step + COLLECTION_TABS.length) % COLLECTION_TABS.length]!;
    selectTab(next.value);
    document.getElementById(`${type}-tab-${next.value}`)?.focus();
  };

  return (
    <div className="ct">
      {merged.map((row) => (
        <ValidationProbe
          key={row.id}
          id={row.id}
          // Validate the version the row shows: the draft when there is one.
          versionId={row.status === "published" ? row.id : `drafts.${row.id}`}
          type={type}
          onIssues={reportIssues}
        />
      ))}
      <style>{CSS}</style>
      <header className="ct-head">
        <div className="ct-title">
          <h2>{title}</h2>
          <IntentLink
            className="ct-new"
            intent="create"
            params={tab === "featured" ? { type, template: config.featuredTemplate } : { type }}
          >
            + New {noun}
          </IntentLink>
        </div>
        <div className="ct-tabs" role="tablist" aria-label="Show">
          {COLLECTION_TABS.map(({ value, label }) => (
            <button
              key={value}
              id={`${type}-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls={`${type}-table`}
              tabIndex={tab === value ? 0 : -1}
              className="ct-tab"
              onClick={() => selectTab(value)}
              onKeyDown={onTabKey}
            >
              {label}
              <span className="ct-count">
                {value === "home" ? `${counts.home ?? 0}/${homeLimit}` : (counts[value] ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <div className="ct-tools">
          <input
            type="search"
            className="ct-search"
            placeholder={config.searchPlaceholder}
            aria-label={config.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="ct-sort">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) => {
                const value = event.target.value;
                if (isCollectionSort(value)) setView((view) => ({ ...view, sort: value }));
              }}
            >
              {sortOptions(config.dateLabel).map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {tab === "home" ? (
          <p className="ct-note">
            The {homeLimit} published {noun}s on the home page: {config.homeRule}. Publish changes
            to update it.
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="ct-empty">Couldn't load {noun}s. Check your connection and reload.</p>
      ) : !data ? (
        <p className="ct-empty">Loading {noun}s…</p>
      ) : visible.length === 0 ? (
        <p className="ct-empty">
          {search
            ? `No ${noun}s match “${search.trim()}”.`
            : rows.length
              ? `No ${noun}s in this view.`
              : `No ${noun}s yet. Create the first one.`}
        </p>
      ) : (
        <div className="ct-scroll">
          <table
            id={`${type}-table`}
            className="ct-table"
            role="tabpanel"
            aria-labelledby={`${type}-tab-${tab}`}
          >
            <thead>
              <tr>
                <th scope="col">Name</th>
                {config.columns.map((column) => (
                  <th
                    key={column.header}
                    scope="col"
                    className={column.hide ? `ct-hide-${column.hide}` : undefined}
                  >
                    {column.header}
                  </th>
                ))}
                <th scope="col">Status</th>
                <th scope="col" className="ct-hide-wide">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} aria-current={row.id === openId ? "true" : undefined}>
                  <td className="ct-name">
                    {row.thumbnail?.asset ? (
                      <img
                        src={imageUrl(row.thumbnail as SanityImageSource)}
                        alt=""
                        width={32}
                        height={40}
                      />
                    ) : (
                      <span className="ct-thumb" aria-hidden="true">
                        {row.thumbnailVideo ? (
                          <BunnyThumbnail playlistUrl={row.thumbnailVideo} />
                        ) : null}
                      </span>
                    )}
                    <span className="ct-name-text">
                      <ChildLink childId={row.id}>{row.title || `Untitled ${noun}`}</ChildLink>
                      <span className="ct-slug">
                        {row.slug ? `${CONTENT_PATHS[type]}/${row.slug}` : "No URL yet"}
                      </span>
                    </span>
                  </td>
                  {config.columns.map((column) => (
                    <td
                      key={column.header}
                      className={column.hide ? `ct-hide-${column.hide}` : undefined}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                  <td>
                    <span className="ct-badges">
                      <span className={`ct-badge ct-${row.status}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                      {row.featured ? <span className="ct-badge ct-featured">Featured</span> : null}
                      {row.onHome ? <span className="ct-badge ct-home">Home</span> : null}
                      {row.noIndex ? <span className="ct-badge">Hidden</span> : null}
                      {row.needsAttention ? (
                        <span
                          className="ct-badge ct-attention"
                          title={(issues.get(row.id) ?? []).join("\n")}
                        >
                          Needs attention
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="ct-hide-wide ct-muted">
                    <time
                      dateTime={row._updatedAt}
                      title={new Date(row._updatedAt).toLocaleString("en-GB")}
                    >
                      {updatedAgo(row._updatedAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const CSS = `
.ct { container-type: inline-size; min-height: 100%; padding: 1.25rem 1.25rem 2rem; color: var(--card-fg-color); background: var(--card-bg-color); font-size: 0.8125rem; }
.ct-head { display: grid; gap: 1rem; margin-bottom: 1rem; }
.ct-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.ct-title h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
/* Inverted (text colour as background): high contrast in light and dark, any accent hue. */
.ct-new { padding: 0.5rem 0.75rem; border-radius: 0.25rem; background: var(--card-fg-color); color: var(--card-bg-color); font-weight: 600; text-decoration: none; white-space: nowrap; }
.ct-new:hover { opacity: 0.85; }
.ct-tabs { display: flex; gap: 0.25rem; overflow-x: auto; border-bottom: 1px solid var(--card-border-color); }
.ct-tab { display: inline-flex; align-items: center; gap: 0.375rem; margin-bottom: -1px; padding: 0.625rem 0.75rem; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--card-muted-fg-color); font: inherit; font-weight: 500; white-space: nowrap; cursor: pointer; }
.ct-tab:hover { color: var(--card-fg-color); }
.ct-tab[aria-selected="true"] { border-bottom-color: var(--card-fg-color); color: var(--card-fg-color); }
.ct-count { padding: 0.0625rem 0.375rem; border-radius: 1rem; background: var(--card-badge-default-bg-color); color: var(--card-badge-default-fg-color); font-size: 0.6875rem; }
.ct-tools { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ct-search, .ct-sort select { height: 2rem; padding: 0 0.625rem; border: 1px solid var(--card-border-color); border-radius: 0.25rem; background: var(--card-bg-color); color: inherit; font: inherit; }
.ct-search { flex: 1 1 12rem; min-width: 0; }
.ct-sort { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--card-muted-fg-color); }
.ct-note { margin: 0; color: var(--card-muted-fg-color); }
.ct :is(button, input, select, a):focus-visible { outline: 2px solid var(--card-focus-ring-color); outline-offset: 1px; }
.ct-scroll { overflow-x: auto; }
.ct-table { width: 100%; border-collapse: collapse; }
.ct-table th { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--card-border-color); color: var(--card-muted-fg-color); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.04em; text-align: left; text-transform: uppercase; white-space: nowrap; }
.ct-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--card-border-color); vertical-align: middle; }
.ct-table tbody tr { position: relative; }
.ct-table tbody tr:hover { background: var(--card-muted-bg-color); }
.ct-table tbody tr[aria-current="true"] { background: var(--card-badge-primary-bg-color); }
.ct-name { display: flex; align-items: center; gap: 0.75rem; min-width: 10rem; }
.ct-name > img, .ct-thumb { flex: none; overflow: hidden; width: 2rem; height: 2.5rem; border-radius: 0.125rem; object-fit: cover; background: var(--card-muted-bg-color); }
.ct-name-text { display: grid; min-width: 0; }
.ct-name a { overflow: hidden; color: inherit; font-weight: 600; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
/* The whole row opens the document. */
.ct-name a::after { content: ""; position: absolute; inset: 0; }
.ct-slug, .ct-muted { color: var(--card-muted-fg-color); }
.ct-slug { overflow: hidden; font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
.ct-badges { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.ct-badge { padding: 0.125rem 0.375rem; border-radius: 0.25rem; background: var(--card-badge-default-bg-color); color: var(--card-badge-default-fg-color); font-size: 0.6875rem; font-weight: 500; white-space: nowrap; }
.ct-published { background: var(--card-badge-positive-bg-color, var(--card-badge-default-bg-color)); color: var(--card-badge-positive-fg-color); }
.ct-changed, .ct-attention { background: var(--card-badge-caution-bg-color); color: var(--card-badge-caution-fg-color); }
.ct-draft { color: var(--card-muted-fg-color); }
.ct-featured, .ct-home { background: var(--card-badge-primary-bg-color); color: var(--card-badge-primary-fg-color); }
.ct-empty { margin: 3rem 0; color: var(--card-muted-fg-color); text-align: center; }
/* Narrower pane (a document open beside the table): fewer columns, then name and status. */
@container (max-width: 40rem) { .ct-hide-wide { display: none; } }
@container (max-width: 26rem) { .ct-hide-medium { display: none; } }
`;
