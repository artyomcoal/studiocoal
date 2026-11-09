/**
 * Browser and device icons generated from Site settings › Icon (src/pages/icons/[file].ts).
 * Pure data, shared by the endpoint, BaseLayout's <link> tags and the web manifest.
 */
export const ICONS = [
  // Browser tabs. Google's search results want a multiple of 48.
  { file: "icon-48.png", size: 48, rel: "icon" },
  { file: "icon-192.png", size: 192, rel: "icon" },
  // Web manifest only (Android home screen, splash).
  { file: "icon-512.png", size: 512, rel: null },
  // iOS home screen.
  { file: "apple-touch-icon.png", size: 180, rel: "apple-touch-icon" },
] as const;

export type IconFile = (typeof ICONS)[number]["file"];

/** "/icons/icon-192.png". */
export function iconPath(file: IconFile): string {
  return `/icons/${file}`;
}

/** The web manifest's `icons`: the square PNGs browsers pick an app icon from. */
export function manifestIcons(): { src: string; sizes: string; type: string }[] {
  return ICONS.filter((icon) => icon.rel !== "apple-touch-icon").map((icon) => ({
    src: iconPath(icon.file),
    sizes: `${icon.size}x${icon.size}`,
    type: "image/png",
  }));
}
