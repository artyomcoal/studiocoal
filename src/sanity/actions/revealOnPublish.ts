import type { DocumentActionComponent } from "sanity";
import { useDocumentPane } from "sanity/structure";
import { revealValidation } from "../validationReveal";

const VALIDATION_INSPECTOR = "sanity/structure/validation";

/**
 * Wraps the Publish action. Fields hide errors until visited (components/QuietField.tsx), so
 * with errors left Publish stays clickable instead of greyed out: pressing it shows every
 * error on the form and opens the validation panel listing them, and doesn't publish.
 * Without errors it publishes as usual.
 */
export function withRevealOnPublish(publish: DocumentActionComponent): DocumentActionComponent {
  const RevealOnPublish: DocumentActionComponent = (props) => {
    const description = publish(props);
    // The pane's validation is for the version being edited (the draft), not the published one.
    const { validation, openInspector } = useDocumentPane();
    const hasErrors = validation.some((marker) => marker.level === "error");
    if (!description || !hasErrors || !props.draft) return description;
    return {
      ...description,
      disabled: false,
      title: "Some fields need attention before this can be published",
      onHandle: () => {
        revealValidation(props.id);
        openInspector(VALIDATION_INSPECTOR);
      },
    };
  };
  RevealOnPublish.action = publish.action;
  RevealOnPublish.displayName = "RevealOnPublish";
  return RevealOnPublish;
}
