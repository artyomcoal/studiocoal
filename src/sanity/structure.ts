import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { WorkTable } from "./components/WorkTable";
import { JOURNAL_NEEDS_ATTENTION_FILTER } from "./filters";

const apiVersion = "2026-11-01";

/** Newest first: the order the site lists each type in. */
const newestFirst = {
  journal: [{ field: "publishedAt", direction: "desc" }],
} as const;

/** Page has SEO › Hide from search engines on. */
const HIDDEN_FROM_SEARCH = "seo.noIndex == true";

/** A filtered list of one document type. New documents created from it use `template`. */
function filteredList(
  S: StructureBuilder,
  type: keyof typeof newestFirst,
  id: string,
  title: string,
  filter: string,
  params: Record<string, unknown> = {},
  template?: { id: string; params?: Record<string, unknown> },
) {
  return S.listItem()
    .id(id)
    .title(title)
    .schemaType(type)
    .child(
      S.documentList()
        .id(id)
        .title(title)
        .schemaType(type)
        .apiVersion(apiVersion)
        .filter(`_type == $type && (${filter})`)
        .params({ ...params, type })
        .defaultOrdering([...newestFirst[type]])
        .initialValueTemplates(
          template
            ? [S.initialValueTemplateItem(template.id, template.params ?? {})]
            : [S.initialValueTemplateItem(type)],
        ),
    );
}

/**
 * Work: one table with tabs (All, Featured, On home page, Needs attention), search and sort,
 * like a Webflow CMS collection (components/WorkTable.tsx). A row opens the project beside it.
 */
const work = (S: StructureBuilder) =>
  S.listItem()
    .id("work")
    .title("Work")
    .schemaType("work")
    .child(
      S.component(WorkTable)
        .id("work")
        .title("Work")
        .child((documentId) => S.document().documentId(documentId).schemaType("work")),
    );

/** Journal: every post, plus what's featured, what isn't ready yet and what's hidden. */
const journal = (S: StructureBuilder) =>
  S.listItem()
    .id("journal")
    .title("Journal")
    .schemaType("journal")
    .child(
      S.list()
        .id("journal")
        .title("Journal")
        .items([
          filteredList(S, "journal", "journal-all", "All posts", "true"),
          filteredList(S, "journal", "journal-featured", "Featured", "featured == true"),
          filteredList(
            S,
            "journal",
            "journal-needs-attention",
            "Needs attention",
            JOURNAL_NEEDS_ATTENTION_FILTER,
          ),
          S.divider(),
          filteredList(
            S,
            "journal",
            "journal-hidden",
            "Hidden from search engines",
            HIDDEN_FROM_SEARCH,
          ),
        ]),
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      work(S),
      journal(S),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    ]);
