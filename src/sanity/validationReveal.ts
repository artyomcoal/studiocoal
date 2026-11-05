/**
 * Which documents have all their validation shown (Studio only).
 *
 * Fields keep quiet about errors until they're filled in or visited
 * (components/QuietField.tsx). Pressing Publish on a document with errors reveals all of them
 * (actions/revealOnPublish.ts). Per Studio tab, cleared on reload.
 */
import { useSyncExternalStore } from "react";

const revealed = new Set<string>();
const listeners = new Set<() => void>();

/** Show every validation message on this document (published id, no "drafts." prefix). */
export function revealValidation(documentId: string) {
  if (revealed.has(documentId)) return;
  revealed.add(documentId);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether validation is revealed for this document; re-renders when it changes. */
export function useValidationRevealed(documentId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => revealed.has(documentId),
    () => false,
  );
}
