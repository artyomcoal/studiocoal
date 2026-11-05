import { defineField, defineType } from "sanity";
import { SERVICES, serviceTitle } from "../../lib/services";

/**
 * One service the studio delivers, e.g. "Brand strategy" or "Design systems". The shared list
 * projects pick their "Services delivered" from (work.deliverables), so names stay consistent.
 * Called `deliverable` in code: "services" already means the three project types
 * (Brand / Website / Product, src/lib/services.ts), which each entry is filed under.
 */
export const deliverable = defineType({
  name: "deliverable",
  title: "Service",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Name",
      type: "string",
      description: "As it should read on project pages, e.g. Brand strategy.",
      validation: (rule) => [
        rule.required(),
        // One entry per name, so projects all pick the same one.
        rule.custom(async (value, context) => {
          if (!value) return true;
          const id = context.document?._id.replace(/^drafts\./, "");
          const duplicates = await context
            .getClient({ apiVersion: "2026-11-01" })
            .fetch<number>(
              `count(*[_type == "deliverable" && lower(title) == lower($title) && !(_id in [$id, "drafts." + $id])])`,
              { title: value.trim(), id },
            );
          return duplicates ? `"${value}" is already in the list.` : true;
        }),
      ],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      description:
        "Two or three sentences on what this service covers. The text inside its accordion on the Services page.",
    }),
    defineField({
      name: "projectTypes",
      title: "Project type",
      description:
        "Which kinds of project it belongs to. Groups the list; pick more than one if it fits.",
      type: "array",
      of: [{ type: "string" }],
      options: { list: SERVICES.map(({ title, value }) => ({ title, value })), layout: "grid" },
    }),
  ],
  orderings: [{ title: "Name, A–Z", name: "titleAsc", by: [{ field: "title", direction: "asc" }] }],
  preview: {
    select: { title: "title", types: "projectTypes" },
    prepare: ({ title, types }) => ({
      title: title || "Untitled service",
      subtitle: ((types as string[] | undefined) ?? []).map(serviceTitle).join(", "),
    }),
  },
});
