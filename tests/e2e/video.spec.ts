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

test("when autoplay is refused, the control shows Play and a tap starts the video", async ({
  page,
}) => {
  // iOS Low Power Mode and data saver reject play() without a user gesture. Stubbed: every
  // play() is refused until the control is clicked.
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let gesture = false;
    document.addEventListener(
      "click",
      (event) => {
        if ((event.target as Element).closest("[data-slot=media-toggle]")) gesture = true;
      },
      true,
    );
    HTMLMediaElement.prototype.play = function () {
      if (!gesture) return Promise.reject(new DOMException("autoplay refused", "NotAllowedError"));
      return play.call(this);
    };
  });
  await page.goto("/");
  const media = page.locator("[data-slot=media][data-playback=ambient]").first();
  test.skip((await media.count()) === 0, "no ambient video on the home page");
  await media.scrollIntoViewIfNeeded();
  const toggle = media.locator("[data-slot=media-toggle]");
  await expect(media).toHaveAttribute("data-paused", "");
  await expect(toggle).toHaveAttribute("aria-label", "Play video");
  await expect(toggle).toHaveCSS("opacity", "1");
  await toggle.click({ force: true });
  await expect(media).not.toHaveAttribute("data-paused", "");
  await expect(toggle).toHaveAttribute("aria-label", "Pause video");
});
