import { defineConfig, devices } from "@playwright/test";

// Uncommon port, and never reuse a server: another local project may be on the Astro defaults.
const PORT = 4391;

// CLAUDE.md: smoke + visual + axe at 375 / 768 / 1440, in light and dark.
const viewports = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
] as const;
const schemes = ["light", "dark"] as const;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  // Screenshots differ per OS (font rendering), so baselines are stored per platform.
  // Only linux baselines are committed (CI); generate them with the "Update visual snapshots" workflow.
  snapshotPathTemplate: "tests/e2e/__screenshots__/{platform}/{projectName}/{arg}{ext}",
  // Locally, missing baselines are written on first run; CI never writes them.
  updateSnapshots: process.env.CI ? "none" : "missing",
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: viewports.flatMap((viewport) =>
    schemes.map((colorScheme) => ({
      name: `${viewport.name}-${colorScheme}`,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme,
      },
    })),
  ),
  // Test the production build, not the dev server (/styleguide is dev-only and not tested here).
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --ignore-lock`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
