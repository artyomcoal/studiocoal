/** @jsxImportSource react */
/**
 * Small line icons for the Studio's form tabs (Studio only, React). Inline SVG at 1em in the
 * current colour, like Sanity's own icons, so no icon package is needed.
 */
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Overview / General: a document with lines. */
export const OverviewIcon = () => (
  <Icon>
    <path d="M7.5 4.5h7l3 3v13h-10z" />
    <path d="M14.5 4.5v3h3M10 12.5h5M10 15.5h5M10 18.5h3" />
  </Icon>
);

/** Project page / Content: a page layout. */
export const PageIcon = () => (
  <Icon>
    <rect x="5.5" y="5.5" width="14" height="14" rx="1" />
    <path d="M5.5 9.5h14M10.5 9.5v10" />
  </Icon>
);

/** Visuals: a picture. */
export const VisualsIcon = () => (
  <Icon>
    <rect x="5.5" y="6.5" width="14" height="12" rx="1" />
    <circle cx="10" cy="11" r="1.5" />
    <path d="m5.5 16.5 4-3.5 3 2.5 3-3 4 4" />
  </Icon>
);

/** SEO: a magnifying glass. */
export const SeoIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="5" />
    <path d="m14.75 14.75 4.75 4.75" />
  </Icon>
);

/** Header and footer: a page with a top and a bottom bar. */
export const HeaderFooterIcon = () => (
  <Icon>
    <rect x="5.5" y="5.5" width="14" height="14" rx="1" />
    <path d="M5.5 8.5h14M5.5 16.5h14" />
  </Icon>
);

/** Pages: two stacked pages. */
export const PagesIcon = () => (
  <Icon>
    <rect x="7.5" y="7.5" width="11" height="13" rx="1" />
    <path d="M9.5 4.5h9a1 1 0 0 1 1 1v12" />
  </Icon>
);

/** Redirects: an arrow turning to the right. */
export const RedirectIcon = () => (
  <Icon>
    <path d="M6.5 18.5v-5a4 4 0 0 1 4-4h8" />
    <path d="m15.5 6.5 3 3-3 3" />
  </Icon>
);
