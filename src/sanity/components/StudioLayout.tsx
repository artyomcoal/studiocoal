/** @jsxImportSource react */
/**
 * Studio layout wrapper (sanity.config.ts › studio.components.layout), Studio only: adds a
 * few form styles Sanity has no option for.
 *
 * - Sections (fieldsets) read as sections: a separator line above each, and a larger heading.
 * - Fields in a two-column section line up on their inputs, even when only one of them has
 *   a description above it (e.g. Client and Year).
 */
import type { LayoutProps } from "sanity";

const CSS = `
/* Section separator and heading. */
fieldset[data-testid^="fieldset-"] {
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--card-border-color);
}
/* No line under the tabs: the first section starts the form. */
[data-ui="Card"]:has([data-testid="field-group-tabs"]) + [data-ui="FormRow"] fieldset[data-testid^="fieldset-"] {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}
/* Section headings: larger than field labels (only the section's own legend, not those of
 * array or checkbox fields inside it). Sanity's Text sets its size by class. */
fieldset[data-testid^="fieldset-"] > [data-ui="Flex"] > [data-ui="fieldHeaderContentBox"] legend [data-ui="Text"] {
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  font-weight: 600 !important;
}
/* Two-column sections: align inputs at the bottom of each row. */
fieldset[data-testid^="fieldset-"] [data-ui="Grid"] {
  align-items: end;
}
`;

export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <style>{CSS}</style>
      {props.renderDefault(props)}
    </>
  );
}
