import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge doesn't know our custom type utilities (typography.css). Without this,
 * `text-label` and `text-fg-primary` look like two text colors and one gets dropped.
 * Keep this list in sync with the @utility names in src/styles/typography.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "headline-xxl",
            "headline-xl",
            "headline-lg",
            "headline-md",
            "headline-sm",
            "headline-xs",
            "body-lg",
            "body-md",
            "body-sm",
            "body-xs",
            "label",
            "caption-md",
            "caption-sm",
            "eyebrow",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
