import type { StructureBuilder, StructureResolver } from "sanity/structure";
import { SERVICES } from "../lib/services";
import { WORK_NEEDS_ATTENTION_FILTER } from "./schemas/work";

const apiVersion = "2026-11-01";

/** Any of the project's visuals is a video. */
const USES_VIDEO = [
  `listingMedia.kind == "video"`,
  `heroMedia.kind == "video"`,
  `"video" in archiveMedia[].kind`,
  `"video" in content[].media.kind`,
  `"video" in content[].left.kind`,
  `"video" in content[].right.kind`,
].join(" || ");

/** Newest first, the order the site shows projects in. */
const newestFirst = [
  { field: "year", direction: "desc" },
  { field: "_createdAt", direction: "desc" },
] as const;

/** A filtered list of Work documents. New documents created from it use `template`. */
function workList(
  S: StructureBuilder,
  id: string,
  title: string,
  filter: string,
  params: Record<string, unknown> = {},
  template?: { id: string; params?: Record<string, unknown> },
) {
  return S.listItem()
    .id(id)
    .title(title)
    .schemaType("work")
    .child(
      S.documentList()
        .id(id)
        .title(title)
        .schemaType("work")
        .apiVersion(apiVersion)
        .filter(`_type == "work" && (${filter})`)
        .params(params)
        .defaultOrdering([...newestFirst])
        .initialValueTemplates(
          template
            ? [S.initialValueTemplateItem(template.id, template.params ?? {})]
            : [S.initialValueTemplateItem("work")],
        ),
    );
}

/**
 * Work: the full list plus filtered views for the questions editors ask most often
 * (what's on the home page, what's in each service, what isn't ready yet).
 * Every list can be re-sorted from its menu (the orderings on the work schema).
 */
const work = (S: StructureBuilder) =>
  S.listItem()
    .id("work")
    .title("Work")
    .schemaType("work")
    .child(
      S.list()
        .id("work")
        .title("Work")
        .items([
          workList(S, "work-all", "All projects", "true"),
          workList(
            S,
            "work-featured",
            "Featured on home page",
            "featured == true",
            {},
            {
              id: "work-featured",
            },
          ),
          workList(S, "work-needs-attention", "Needs attention", WORK_NEEDS_ATTENTION_FILTER),
          S.divider(),
          S.listItem()
            .id("work-by-service")
            .title("By project type")
            .child(
              S.list()
                .id("work-by-service")
                .title("By project type")
                .items([
                  ...SERVICES.map(({ title, value }) =>
                    workList(
                      S,
                      `work-service-${value}`,
                      title,
                      "$service in services",
                      { service: value },
                      { id: "work-by-service", params: { service: value } },
                    ),
                  ),
                  S.divider(),
                  workList(
                    S,
                    "work-service-none",
                    "No project type",
                    "count(coalesce(services, [])) == 0",
                  ),
                ]),
            ),
          S.listItem()
            .id("work-by-media")
            .title("By visuals")
            .child(
              S.list()
                .id("work-by-media")
                .title("By visuals")
                .items([
                  workList(S, "work-with-video", "Uses video", USES_VIDEO),
                  workList(S, "work-images-only", "Images only", `!(${USES_VIDEO})`),
                ]),
            ),
        ]),
    );

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      work(S),
      S.documentTypeListItem("journal").title("Journal"),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
    ]);
