/**
 * Whether a form value counts as "nothing entered yet" (the Studio's QuietField hides errors
 * on such fields until they're visited). Objects count as empty while they only carry
 * _type / _key, or only empty values (e.g. an image object with no asset yet).
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.entries(value).every(
      ([key, entry]) => key === "_type" || key === "_key" || isEmptyValue(entry),
    );
  }
  return false;
}
