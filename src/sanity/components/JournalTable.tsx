/** @jsxImportSource react */
/** Studio › Journal as a table (CollectionTable.tsx), opened from src/sanity/structure.ts. */
import { timestamp } from "../../lib/collection-table";
import { HOME_JOURNAL_LIMIT } from "../filters";
import { JOURNAL_TABLE_QUERY } from "../queries";
import type { JOURNAL_TABLE_QUERY_RESULT } from "../types";
import { CollectionTable, type CollectionTableConfig, Empty } from "./CollectionTable";

type JournalDoc = JOURNAL_TABLE_QUERY_RESULT["docs"][number];

const publishDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const config: CollectionTableConfig<JournalDoc> = {
  type: "journal",
  title: "Journal",
  noun: "post",
  load: (client) => client.fetch(JOURNAL_TABLE_QUERY, {}, { perspective: "raw" }),
  homeLimit: HOME_JOURNAL_LIMIT,
  homeRule: "featured ones first, then the newest",
  dateLabel: "Publish date",
  dateOf: (row) => timestamp(row.publishedAt),
  searchPlaceholder: "Search title or category",
  searchable: (row) => [row.title, row.category],
  featuredTemplate: "journal-featured",
  columns: [
    { header: "Category", hide: "wide", cell: (row) => row.category ?? <Empty /> },
    {
      header: "Published",
      hide: "medium",
      cell: (row) => {
        const time = timestamp(row.publishedAt);
        return time === null ? (
          <Empty />
        ) : (
          <time dateTime={row.publishedAt ?? undefined}>{publishDate.format(time)}</time>
        );
      },
    },
  ],
};

export const JournalTable = () => <CollectionTable config={config} />;
