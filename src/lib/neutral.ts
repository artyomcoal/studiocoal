/**
 * The neutral palette as literal colours, for code that can't read CSS variables (the Studio
 * theme, src/sanity/theme.ts). Copies of --color-neutral-* in src/styles/tokens.css, which
 * stays the source of truth; neutral.test.ts fails if they drift apart.
 */
export const NEUTRAL = {
  50: "#ffffff",
  100: "#f9f9f9",
  200: "#f2f2f2",
  300: "#ededed",
  400: "#d1d1d1",
  450: "#a7a9ad",
  500: "#717276",
  600: "#3b3c3f",
  700: "#2e2f32",
  800: "#1d1e20",
  900: "#0f0f10",
} as const;
