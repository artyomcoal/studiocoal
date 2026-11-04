/** @jsxImportSource react */
/**
 * URL slug input (Studio only, React).
 *
 * - While the document has never been published, the slug follows the title as it's typed,
 *   until an editor changes the slug by hand.
 * - Once published, the slug no longer changes by itself, and a note says that a new URL
 *   redirects from the old one (src/sanity/actions/publishWithRedirect.ts).
 */
import { useEffect, useRef } from "react";
import {
  getPublishedId,
  set,
  unset,
  useEditState,
  useFormValue,
  type SlugInputProps,
} from "sanity";
import { slugify } from "../../lib/seo";

export function AutoSlugInput(props: SlugInputProps) {
  const { value, onChange, readOnly } = props;
  const title = useFormValue(["title"]) as string | undefined;
  const id = useFormValue(["_id"]) as string | undefined;
  const type = useFormValue(["_type"]) as string | undefined;
  const { published } = useEditState(getPublishedId(id ?? ""), type ?? "");
  const isPublished = !!published;

  // The title the current slug was generated from. If the slug still matches it, the editor
  // hasn't customised the slug, so it keeps following the title.
  const previousTitle = useRef(title ?? "");

  useEffect(() => {
    const current = value?.current;
    const before = previousTitle.current;
    previousTitle.current = title ?? "";
    if (readOnly || isPublished || title === undefined || title === before) return;
    if (current && current !== slugify(before)) return; // Edited by hand: leave it.
    const next = slugify(title);
    if (next === current) return;
    onChange(next ? set({ _type: "slug", current: next }) : unset());
  }, [title, value?.current, isPublished, readOnly, onChange]);

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      {props.renderDefault(props)}
      {isPublished && published?.slug !== undefined && (
        <p style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.4, opacity: 0.7 }}>
          This page is live. If you change its URL, the old one will redirect here once you publish
          (see SEO › Old URLs).
        </p>
      )}
    </div>
  );
}
