import { expect, test } from "./test";
import { routes } from "./routes";

// Video controls (src/components/VideoControl.astro): every video uses the site's one play /
// pause control, never browser-default controls.
test("every video has the site's control and no native controls", async ({ page }) => {
  let videos = 0;
  for (const route of routes) {
    await page.goto(route.path);
    for (const video of await page.locator("video").all()) {
      videos++;
      expect(await video.evaluate((el: HTMLVideoElement) => el.controls)).toBe(false);
      const media = video.locator("xpath=ancestor::*[@data-slot='media'][1]");
      await expect(media.locator("[data-slot=media-toggle]")).toHaveCount(1);
    }
  }
  test.skip(videos === 0, "no videos in the fixture content");
});

test("the control pauses and resumes an ambient video", async ({ page }) => {
  await page.goto("/");
  const media = page.locator("[data-slot=media][data-playback=ambient]").first();
  test.skip((await media.count()) === 0, "no ambient video on the home page");
  await media.scrollIntoViewIfNeeded();
  const toggle = media.locator("[data-slot=media-toggle]");
  await expect(toggle).toHaveAttribute("aria-label", "Pause video");
  await toggle.click({ force: true });
  await expect(media).toHaveAttribute("data-paused", "");
  await expect(toggle).toHaveAttribute("aria-label", "Play video");
  await toggle.click({ force: true });
  await expect(media).not.toHaveAttribute("data-paused", "");
  await expect(toggle).toHaveAttribute("aria-label", "Pause video");
});
