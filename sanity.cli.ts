import { defineCliConfig } from "sanity/cli";

// Reads the same .env as Astro. `pnpm typegen` runs the CLI with `node --env-file-if-exists=.env`;
// in CI the variables come from the environment.
export default defineCliConfig({
  api: {
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.PUBLIC_SANITY_DATASET,
  },
  typegen: {
    path: "./src/**/*.{ts,astro}",
    schema: "./src/sanity/schema.json",
    generates: "./src/sanity/types.ts",
  },
});
