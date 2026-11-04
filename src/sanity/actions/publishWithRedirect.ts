import { type DocumentActionComponent, useDocumentOperation } from "sanity";

interface SlugDocument {
  slug?: { current?: string };
  previousSlugs?: string[];
}

/**
 * Wraps the Publish action. When a published page is published again under a new URL, the
 * old slug is added to `previousSlugs` first, so the old URL redirects to the new one
 * (src/lib/redirects.ts). Publishing an old slug again takes it off the list.
 */
export function withSlugRedirect(publish: DocumentActionComponent): DocumentActionComponent {
  const PublishWithRedirect: DocumentActionComponent = (props) => {
    const { patch } = useDocumentOperation(props.id, props.type);
    const description = publish(props);
    if (!description) return description;
    return {
      ...description,
      onHandle: () => {
        const published = props.published as SlugDocument | null;
        const draft = props.draft as SlugDocument | null;
        const oldSlug = published?.slug?.current;
        const newSlug = draft?.slug?.current;
        if (oldSlug && newSlug && oldSlug !== newSlug) {
          const previous = draft?.previousSlugs ?? published?.previousSlugs ?? [];
          const next = [...new Set([...previous, oldSlug])].filter((slug) => slug !== newSlug);
          patch.execute([{ set: { previousSlugs: next } }]);
        }
        description.onHandle?.();
      },
    };
  };
  PublishWithRedirect.action = publish.action;
  PublishWithRedirect.displayName = "PublishWithRedirect";
  return PublishWithRedirect;
}
