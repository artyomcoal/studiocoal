import { test as base } from "@playwright/test";
import { FIXTURE_BUNNY_HOST, fixtureResponse } from "../fixtures/sanity/fixtures";

/**
 * Playwright `test` for every e2e spec. The site is built from the Sanity fixtures
 * (E2E_FIXTURES=1, tests/fixtures/sanity/), whose images and Bunny video live on fixture URLs:
 * serve those from disk so no test reaches Sanity's CDN or Bunny.
 */
export const test = base.extend<{ fixtureMedia: void }>({
  fixtureMedia: [
    async ({ context }, use) => {
      await context.route(/^https:\/\/cdn\.sanity\.io\/images\//, (route) => {
        const fixture = fixtureResponse(route.request().url());
        return fixture ? route.fulfill(fixture) : route.continue();
      });
      await context.route(`https://${FIXTURE_BUNNY_HOST}/**`, (route) => {
        const fixture = fixtureResponse(route.request().url())!;
        return route.fulfill(fixture);
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
