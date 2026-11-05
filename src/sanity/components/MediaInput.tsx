/** @jsxImportSource react */
/**
 * Input for the shared `media` object (Studio only, React): the usual fields, plus a tick
 * under a size warning. When the image (or video poster) doesn't match its slot's ratio,
 * the editor can confirm the crop looks fine; that stores the image's asset id in
 * `aspectChecked`, which silences the warning (schemas/media.ts › mediaAspect) for this image
 * only: replacing the image brings the check back.
 */
import type { ChangeEvent, CSSProperties } from "react";
import { type ObjectInputProps, set, unset } from "sanity";
import { aspectMismatch } from "../../lib/media";
import { mediaCheckImage, slotAspect, type MediaValue } from "../mediaSlots";

export function MediaInput(props: ObjectInputProps) {
  const value = props.value as MediaValue | undefined;
  const aspect = slotAspect(props.path);
  const image = mediaCheckImage(value);
  const ref = image?.asset?._ref;
  const mismatch = aspect && ref ? aspectMismatch(ref, image?.crop, aspect) : null;
  const checked = !!ref && value?.aspectChecked === ref;

  const toggle = (event: ChangeEvent<HTMLInputElement>) =>
    props.onChange(
      event.target.checked && ref ? set(ref, ["aspectChecked"]) : unset(["aspectChecked"]),
    );

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {props.renderDefault(props)}
      {mismatch ? (
        <div style={checked ? done : callout}>
          {checked ? null : <p style={{ margin: 0 }}>{mismatch}</p>}
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
          >
            <input type="checkbox" checked={checked} onChange={toggle} disabled={props.readOnly} />
            {checked
              ? "Size warning dismissed: the crop looks fine for this image."
              : "Looks fine as cropped: stop warning about this image"}
          </label>
        </div>
      ) : null}
    </div>
  );
}

// Studio UI, not the site: colours from the Studio theme's badge variables.
const callout: CSSProperties = {
  display: "grid",
  gap: "0.5rem",
  padding: "0.75rem",
  borderRadius: "0.25rem",
  background: "var(--card-badge-caution-bg-color)",
  color: "var(--card-badge-caution-fg-color)",
  fontSize: "0.8125rem",
  lineHeight: 1.4,
};
const done: CSSProperties = {
  ...callout,
  background: "transparent",
  color: "var(--card-muted-fg-color)",
};
