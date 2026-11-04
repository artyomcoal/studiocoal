// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// bejamas:astro-fonts:start
/** @type {NonNullable<import("astro").AstroUserConfig["fonts"]>} */
const BEJAMAS_ASTRO_FONTS = [
  {
    provider: fontProviders.google(),
    name: "Geist Mono",
    cssVariable: "--font-geist-mono",
    weights: [500],
    subsets: ["latin"],
    fallbacks: ["ui-monospace", "monospace"],
  },
];
// bejamas:astro-fonts:end

// https://astro.build/config
export default defineConfig({
  fonts: BEJAMAS_ASTRO_FONTS,
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
});
