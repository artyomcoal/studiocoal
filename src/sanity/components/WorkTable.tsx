/** @jsxImportSource react */
/** Studio › Work as a table (CollectionTable.tsx), opened from src/sanity/structure.ts. */
import { serviceTitle } from "../../lib/services";
import { HOME_FEATURED_LIMIT } from "../filters";
import { WORK_TABLE_QUERY } from "../queries";
import type { WORK_TABLE_QUERY_RESULT } from "../types";
import { CollectionTable, type CollectionTableConfig, Empty } from "./CollectionTable";

type WorkDoc = WORK_TABLE_QUERY_RESULT["docs"][number];

const config: CollectionTableConfig<WorkDoc> = {
  type: "work",
  title: "Work",
  noun: "project",
  load: (client) => client.fetch(WORK_TABLE_QUERY, {}, { perspective: "raw" }),
  homeLimit: HOME_FEATURED_LIMIT,
  homeRule: "featured ones first, then the newest",
  dateLabel: "Project date",
  dateOf: (row) => row.year,
  searchPlaceholder: "Search name or client",
  searchable: (row) => [row.title, row.client],
  featuredTemplate: "work-featured",
  columns: [
    { header: "Client", hide: "wide", cell: (row) => row.client ?? <Empty /> },
    { header: "Year", hide: "medium", cell: (row) => row.year ?? <Empty /> },
    {
      header: "Project type",
      hide: "wide",
      cell: (row) => (row.services?.length ? row.services.map(serviceTitle).join(", ") : <Empty />),
    },
  ],
};

export const WorkTable = () => <CollectionTable config={config} />;
