/** @jsxImportSource react */
/**
 * Studio › Work, as a table in the style of a Webflow CMS collection (Studio only, React).
 *
 * - Tabs: All · Featured · On home page (what the home page shows right now) · Needs attention.
 * - Search by name or client, and sort by project date, name or date added.
 * - A row opens the project in the pane next to the table. Rows show the draft when there is
 *   one, with its status: Published, Changed (unpublished edits) or Draft.
 * - Updates live as documents change. The tab and sort are remembered per browser.
 *
 * Styles follow the Studio's light / dark theme through its --card-* CSS variables; the
 * site's design tokens don't exist in the Studio.
 */
import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import { serviceTitle } from "../../lib/services";
import {
  filterRows,
  isWorkSort,
  isWorkTab,
  mergeVersions,
  sortRows,
  WORK_SORTS,
  WORK_TABS,
  type WorkSort,
  type WorkStatus,
  type WorkTab,
} from "../../lib/work-table";
import { HOME_FEATURED_LIMIT } from "../filters";
import { WORK_TABLE_QUERY } from "../queries";
import type { WORK_TABLE_QUERY_RESULT } from "../types";

const API_VERSION = "2026-11-01";
const STORAGE_KEY = "studio:work-table";

function readSaved(): { tab: WorkTab; sort: WorkSort } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    return {
      tab: isWorkTab(saved.tab) ? saved.tab : "all",
      sort: isWorkSort(saved.sort) ? saved.sort : "year-desc",
    };
  } catch {
    return { tab: "all", sort: "year-desc" };
  }
}

const STATUS_LABEL: Record<WorkStatus, string> = {
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

export function WorkTable() {
  const client = useClient({ apiVersion: API_VERSION });
  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter();
  const openId = routerPanesState[groupIndex + 1]?.[0]?.id;

  const [data, setData] = useState<WORK_TABLE_QUERY_RESULT | null>(null);
  const [error, setError] = useState(false);
  const [{ tab, sort }, setView] = useState(readSaved);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tab, sort }));
    } catch {
      /* Storage blocked: the view just isn't remembered. */
    }
  }, [tab, sort]);

  // Load, then reload shortly after any Work document changes.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      client
        .fetch(WORK_TABLE_QUERY, {}, { perspective: "raw" })
        .then((result) => active && (setData(result), setError(false)))
        .catch(() => active && setError(true));
    void load();
    const subscription = client
      .listen('*[_type == "work"]', {}, { events: ["mutation"], includeResult: false })
      .subscribe(() => {
        clearTimeout(timer);
        timer = setTimeout(load, 400);
      });
    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [client]);

  const rows = useMemo(() => (data ? mergeVersions(data.docs, data.home) : []), [data]);
  const visible = useMemo(
    () => sortRows(filterRows(rows, tab, search), sort),
    [rows, tab, search, sort],
  );
  const counts = useMemo(
    () => Object.fromEntries(WORK_TABS.map(({ value }) => [value, filterRows(rows, value).length])),
    [rows],
  );
  const imageUrl = useMemo(() => {
    const builder = createImageUrlBuilder(client);
    return (image: SanityImageSource) =>
      builder.image(image).width(80).height(100).fit("crop").auto("format").url();
  }, [client]);

  // Arrow keys move between tabs, as in a native tab list.
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = WORK_TABS.findIndex(({ value }) => value === tab);
    const next =
      WORK_TABS[
        (index + (event.key === "ArrowRight" ? 1 : -1) + WORK_TABS.length) % WORK_TABS.length
      ]!;
    setView((view) => ({ ...view, tab: next.value }));
    document.getElementById(`work-tab-${next.value}`)?.focus();
  };

  return (
    <div className="wt">
      <style>{CSS}</style>
      <header className="wt-head">
        <div className="wt-title">
          <h2>Work</h2>
          <IntentLink
            className="wt-new"
            intent="create"
            params={
              tab === "featured" ? { type: "work", template: "work-featured" } : { type: "work" }
            }
          >
            + New project
          </IntentLink>
        </div>
        <div className="wt-tabs" role="tablist" aria-label="Show">
          {WORK_TABS.map(({ value, label }) => (
            <button
              key={value}
              id={`work-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={tab === value}
              aria-controls="work-table"
              tabIndex={tab === value ? 0 : -1}
              className="wt-tab"
              onClick={() => setView((view) => ({ ...view, tab: value }))}
              onKeyDown={onTabKey}
            >
              {label}
              <span className="wt-count">
                {value === "home"
                  ? `${counts.home ?? 0}/${HOME_FEATURED_LIMIT}`
                  : (counts[value] ?? 0)}
              </span>
            </button>
          ))}
        </div>
        <div className="wt-tools">
          <input
            type="search"
            className="wt-search"
            placeholder="Search name or client"
            aria-label="Search projects by name or client"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <label className="wt-sort">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) =>
                isWorkSort(event.target.value) &&
                setView((view) => ({ ...view, sort: event.target.value as WorkSort }))
              }
            >
              {WORK_SORTS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {tab === "home" ? (
          <p className="wt-note">
            The {HOME_FEATURED_LIMIT} published projects on the home page: featured ones first, then
            the newest. Publish changes to update it.
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="wt-empty">Couldn't load projects. Check your connection and reload.</p>
      ) : !data ? (
        <p className="wt-empty">Loading projects…</p>
      ) : visible.length === 0 ? (
        <p className="wt-empty">
          {search
            ? `No projects match “${search.trim()}”.`
            : rows.length
              ? "No projects in this view."
              : "No projects yet. Create the first one."}
        </p>
      ) : (
        <div className="wt-scroll">
          <table
            id="work-table"
            className="wt-table"
            role="tabpanel"
            aria-labelledby={`work-tab-${tab}`}
          >
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col" className="wt-optional">
                  Client
                </th>
                <th scope="col" className="wt-year">
                  Year
                </th>
                <th scope="col" className="wt-optional">
                  Project type
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="wt-optional">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} aria-current={row.id === openId ? "true" : undefined}>
                  <td className="wt-name">
                    {row.thumbnail?.asset ? (
                      <img
                        src={imageUrl(row.thumbnail as SanityImageSource)}
                        alt=""
                        width={32}
                        height={40}
                      />
                    ) : (
                      <span className="wt-thumb" aria-hidden="true" />
                    )}
                    <span className="wt-name-text">
                      <ChildLink childId={row.id}>{row.title || "Untitled project"}</ChildLink>
                      <span className="wt-slug">
                        {row.slug ? `/work/${row.slug}` : "No URL yet"}
                      </span>
                    </span>
                  </td>
                  <td className="wt-optional">
                    {row.client ?? <span className="wt-muted">—</span>}
                  </td>
                  <td className="wt-year">{row.year ?? <span className="wt-muted">—</span>}</td>
                  <td className="wt-optional">
                    {row.services?.length ? (
                      row.services.map(serviceTitle).join(", ")
                    ) : (
                      <span className="wt-muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className="wt-badges">
                      <span className={`wt-badge wt-${row.status}`}>
                        {STATUS_LABEL[row.status]}
                      </span>
                      {row.featured ? <span className="wt-badge wt-featured">Featured</span> : null}
                      {row.onHome ? <span className="wt-badge wt-home">Home</span> : null}
                      {row.noIndex ? <span className="wt-badge">Hidden</span> : null}
                      {row.needsAttention ? (
                        <span
                          className="wt-badge wt-attention"
                          title="Missing something the site shows, or an SEO issue"
                        >
                          Needs attention
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="wt-optional wt-muted">
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
.wt { container-type: inline-size; min-height: 100%; padding: 1.25rem 1.25rem 2rem; color: var(--card-fg-color); background: var(--card-bg-color); font-size: 0.8125rem; }
.wt-head { display: grid; gap: 1rem; margin-bottom: 1rem; }
.wt-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.wt-title h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
.wt-new { padding: 0.5rem 0.75rem; border-radius: 0.25rem; background: var(--card-badge-primary-dot-color); color: #fff; font-weight: 600; text-decoration: none; white-space: nowrap; }
.wt-new:hover { filter: brightness(1.1); }
.wt-tabs { display: flex; gap: 0.25rem; overflow-x: auto; border-bottom: 1px solid var(--card-border-color); }
.wt-tab { display: inline-flex; align-items: center; gap: 0.375rem; margin-bottom: -1px; padding: 0.625rem 0.75rem; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--card-muted-fg-color); font: inherit; font-weight: 500; white-space: nowrap; cursor: pointer; }
.wt-tab:hover { color: var(--card-fg-color); }
.wt-tab[aria-selected="true"] { border-bottom-color: var(--card-fg-color); color: var(--card-fg-color); }
.wt-count { padding: 0.0625rem 0.375rem; border-radius: 1rem; background: var(--card-badge-default-bg-color); color: var(--card-badge-default-fg-color); font-size: 0.6875rem; }
.wt-tools { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.wt-search, .wt-sort select { height: 2rem; padding: 0 0.625rem; border: 1px solid var(--card-border-color); border-radius: 0.25rem; background: var(--card-bg-color); color: inherit; font: inherit; }
.wt-search { flex: 1 1 12rem; min-width: 0; }
.wt-sort { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--card-muted-fg-color); }
.wt-note { margin: 0; color: var(--card-muted-fg-color); }
.wt :is(button, input, select, a):focus-visible { outline: 2px solid var(--card-focus-ring-color); outline-offset: 1px; }
.wt-scroll { overflow-x: auto; }
.wt-table { width: 100%; border-collapse: collapse; }
.wt-table th { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--card-border-color); color: var(--card-muted-fg-color); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.04em; text-align: left; text-transform: uppercase; white-space: nowrap; }
.wt-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--card-border-color); vertical-align: middle; }
.wt-table tbody tr { position: relative; }
.wt-table tbody tr:hover { background: var(--card-muted-bg-color); }
.wt-table tbody tr[aria-current="true"] { background: var(--card-badge-primary-bg-color); }
.wt-name { display: flex; align-items: center; gap: 0.75rem; min-width: 10rem; }
.wt-name img, .wt-thumb { flex: none; width: 2rem; height: 2.5rem; border-radius: 0.125rem; object-fit: cover; background: var(--card-muted-bg-color); }
.wt-name-text { display: grid; min-width: 0; }
.wt-name a { overflow: hidden; color: inherit; font-weight: 600; text-decoration: none; text-overflow: ellipsis; white-space: nowrap; }
/* The whole row opens the project. */
.wt-name a::after { content: ""; position: absolute; inset: 0; }
.wt-slug, .wt-muted { color: var(--card-muted-fg-color); }
.wt-slug { overflow: hidden; font-size: 0.75rem; text-overflow: ellipsis; white-space: nowrap; }
.wt-badges { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.wt-badge { padding: 0.125rem 0.375rem; border-radius: 0.25rem; background: var(--card-badge-default-bg-color); color: var(--card-badge-default-fg-color); font-size: 0.6875rem; font-weight: 500; white-space: nowrap; }
.wt-published { background: var(--card-badge-positive-bg-color, var(--card-badge-default-bg-color)); color: var(--card-badge-positive-fg-color); }
.wt-changed, .wt-attention { background: var(--card-badge-caution-bg-color); color: var(--card-badge-caution-fg-color); }
.wt-draft { color: var(--card-muted-fg-color); }
.wt-featured, .wt-home { background: var(--card-badge-primary-bg-color); color: var(--card-badge-primary-fg-color); }
.wt-empty { margin: 3rem 0; color: var(--card-muted-fg-color); text-align: center; }
/* Narrow pane (a project open beside the table): fewer columns, then name and status. */
@container (max-width: 40rem) { .wt-optional { display: none; } }
@container (max-width: 26rem) { .wt-year { display: none; } }
`;
