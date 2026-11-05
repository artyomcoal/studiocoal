/**
 * Studio theme: the site's neutral greys instead of Sanity's blue-tinted greys and blue
 * accents, in light and dark (the Studio follows the editor's system setting, as the site).
 *
 * Built with @sanity/ui's buildTheme from Sanity's own palette (@sanity/color), swapping two
 * hues: `gray` (backgrounds, text, borders) and `blue` (the primary accent: selection, focus,
 * primary buttons). Status hues (green, yellow, red) and the rest stay Sanity's.
 */
import { color as sanityPalette } from "@sanity/color";
import { buildTheme } from "@sanity/ui/theme";
import { NEUTRAL } from "../lib/neutral";

/**
 * The site's greys on Sanity's 11 tint keys. The dark end (600–950) maps step for step.
 * The light end is shifted darker: Sanity draws borders and input outlines with tint 200, so
 * it gets #d1d1d1 to stay visible on white, and 450 fills tints 300–500 (300, the site's
 * near-white #ededed, isn't used).
 */
const neutralHue = {
  50: NEUTRAL[100],
  100: NEUTRAL[200],
  200: NEUTRAL[400],
  300: NEUTRAL[450],
  400: NEUTRAL[450],
  500: NEUTRAL[450],
  600: NEUTRAL[500],
  700: NEUTRAL[600],
  800: NEUTRAL[700],
  900: NEUTRAL[800],
  950: NEUTRAL[900],
};

export const studioTheme = buildTheme({
  palette: { ...sanityPalette, gray: neutralHue, blue: neutralHue },
});
