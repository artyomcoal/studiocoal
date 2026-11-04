// @ts-check
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "dist/",
      ".astro/",
      ".vercel/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "src/sanity/types.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Astro recommended rules + jsx-a11y rules applied to .astro templates.
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-strict"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // CLAUDE.md: no `any` without a comment saying why → keep it visible as a warning-free error.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // CLAUDE.md: no @ts-ignore; @ts-expect-error needs a reason.
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
    },
  },
);
