import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest covers src/lib/ helpers only (CLAUDE.md). Components are tested in Playwright.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/lib/**/*.test.ts"],
  },
});
