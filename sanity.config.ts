import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { withSlugRedirect } from "./src/sanity/actions/publishWithRedirect";
import { schemaTypes, singletonTypes } from "./src/sanity/schemas";
import { structure } from "./src/sanity/structure";

// In the browser (embedded Studio) Vite provides import.meta.env. The Sanity CLI (typegen,
// schema extract) runs in Node, where the package scripts load .env into process.env.
const projectId = import.meta.env?.PUBLIC_SANITY_PROJECT_ID ?? process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env?.PUBLIC_SANITY_DATASET ?? process.env.PUBLIC_SANITY_DATASET;

const contextTemplates = new Set(["work-featured"]);
const redirectingTypes = new Set(["work", "journal"]);

export default defineConfig({
  name: "default",
  title: "Studio Coal",
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Singletons can't be created from the "new document" menu.
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
      // Used by the Work table's Featured tab (components/WorkTable.tsx): a project created
      // there starts with Featured on.
      {
        id: "work-featured",
        title: "Featured project",
        schemaType: "work",
        value: { featured: true },
      },
    ],
  },
  document: {
    // The Work templates above only make sense inside their lists, not in the global menu.
    newDocumentOptions: (options, { creationContext }) =>
      creationContext.type === "global"
        ? options.filter(({ templateId }) => !contextTemplates.has(templateId))
        : options,
    actions: (actions, { schemaType }) => {
      // Singletons can't be duplicated or deleted.
      if (singletonTypes.has(schemaType)) {
        return actions.filter(
          ({ action }) => action && ["publish", "discardChanges", "restore"].includes(action),
        );
      }
      // Pages with a URL keep their old URLs as redirects when it changes.
      if (redirectingTypes.has(schemaType)) {
        return actions.map((action) =>
          action.action === "publish" ? withSlugRedirect(action) : action,
        );
      }
      return actions;
    },
  },
});
