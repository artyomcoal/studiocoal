/** Display formatters. Pure functions, so they're covered by Vitest. */

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Aug 17, 2025" from an ISO date or datetime. UTC, so the build machine's zone doesn't matter. */
export function formatDate(value: string): string {
  return dateFormat.format(new Date(value));
}
