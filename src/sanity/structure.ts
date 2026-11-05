import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { JournalTable } from "./components/JournalTable";
import { WorkTable } from "./components/WorkTable";

/**
 * A collection as one table with tabs (All, Featured, On home page, Needs attention),
 * search and sort, like a Webflow CMS collection (components/CollectionTable.tsx).
 * A row opens the document in the pane beside it.
 */
const collection = (
  S: StructureBuilder,
  type: "work" | "journal",
  title: string,
  Table: () => React.JSX.Element,
) =>
  S.listItem()
    .id(type)
    .title(title)
    .schemaType(type)
    .child(
      S.component(Table)
        .id(type)
        .title(title)
        .child((documentId) => S.document().documentId(documentId).schemaType(type)),
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      collection(S, "work", "Work", WorkTable),
      collection(S, "journal", "Journal", JournalTable),
      S.divider(),
      // The shared list projects pick "Services delivered" from.
      S.documentTypeListItem("deliverable")
        .title("Services")
        .child(
          S.documentTypeList("deliverable")
            .title("Services")
            .apiVersion("2026-11-01")
            .defaultOrdering([{ field: "title", direction: "asc" }]),
        ),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    ]);
