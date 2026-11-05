/** @jsxImportSource react */
/**
 * Every field in the Studio (sanity.config.ts › form.components.field), Studio only.
 *
 * Validation messages stay hidden on an empty field until the editor has visited it and left,
 * so a new document doesn't open covered in "Required". A field with a value shows its errors
 * straight away. Pressing Publish with errors reveals everything (validationReveal.ts).
 * The document's validation panel always lists every error.
 */
import { useState } from "react";
import { type FieldProps, getPublishedId, useFormValue } from "sanity";
import { isEmptyValue } from "../../lib/empty";
import { useValidationRevealed } from "../validationReveal";

export function QuietField(props: FieldProps) {
  const id = useFormValue(["_id"]) as string | undefined;
  const revealed = useValidationRevealed(getPublishedId(id ?? ""));
  const [visited, setVisited] = useState(false);

  const quiet = !revealed && !visited && props.validation.length > 0 && isEmptyValue(props.value);

  return (
    // display: contents keeps the form layout as is; focus events still bubble through it.
    <div style={{ display: "contents" }} onBlur={() => setVisited(true)}>
      {props.renderDefault(quiet ? { ...props, validation: [] } : props)}
    </div>
  );
}
