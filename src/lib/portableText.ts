/**
 * Minimal Portable Text helpers for RichText.astro. Pure functions, so they're covered by
 * Vitest. Handles what the `richText` schema allows: blocks (normal, h2, h3, blockquote),
 * bullet / numbered lists, strong / em decorators and link annotations.
 */

export interface PtSpan {
  _type: "span";
  _key?: string;
  text: string;
  marks?: string[];
}

export interface PtMarkDef {
  _key: string;
  _type: string;
  href?: string;
}

export interface PtBlock {
  _type: "block";
  _key: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: Array<PtSpan | { _type: string; _key?: string }>;
  markDefs?: PtMarkDef[] | null;
}

export interface PtList<T extends PtBlock = PtBlock> {
  _type: "list";
  _key: string;
  listItem: "bullet" | "number";
  items: T[];
}

/** Groups consecutive list-item blocks of the same kind into one list node. */
export function groupLists<T extends { _type: string; _key: string }>(
  blocks: T[],
): Array<T | PtList<T & PtBlock>> {
  const out: Array<T | PtList<T & PtBlock>> = [];
  for (const block of blocks) {
    const item = block as T & PtBlock;
    if (block._type === "block" && item.listItem) {
      const last = out.at(-1) as PtList<T & PtBlock> | undefined;
      if (last?._type === "list" && last.listItem === item.listItem) {
        last.items.push(item);
      } else {
        out.push({
          _type: "list",
          _key: `list-${block._key}`,
          listItem: item.listItem,
          items: [item],
        });
      }
    } else {
      out.push(block);
    }
  }
  return out;
}

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char]!);
}

/** Only http(s), mailto, tel and relative links survive; anything else (javascript:) is dropped. */
export function safeHref(href: string | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return null;
}

const LINK_CLASS =
  "underline underline-offset-2 text-fg-link hover:text-fg-link-hover active:text-fg-link-active";

/**
 * The inline HTML of a block: escaped text, newlines as <br>, decorators and links.
 * Marks are applied innermost-first in the order Sanity stores them.
 */
export function renderSpans(block: PtBlock): string {
  const defs = new Map((block.markDefs ?? []).map((def) => [def._key, def]));
  return (block.children ?? [])
    .map((child) => {
      if (child._type !== "span") return "";
      const span = child as PtSpan;
      let html = escapeHtml(span.text).replace(/\n/g, "<br>");
      for (const mark of span.marks ?? []) {
        if (mark === "strong") html = `<strong>${html}</strong>`;
        else if (mark === "em") html = `<em>${html}</em>`;
        else {
          const href = safeHref(defs.get(mark)?.href);
          if (href) html = `<a href="${escapeHtml(href)}" class="${LINK_CLASS}">${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}

/** The plain text of a block's spans. */
export function blockText(block: PtBlock): string {
  return (block.children ?? [])
    .map((child) => (child._type === "span" ? (child as PtSpan).text : ""))
    .join("");
}

/** Average adult reading speed for screen text, words per minute. */
const WORDS_PER_MINUTE = 220;

/** Minutes to read a body (text blocks only), rounded up, at least 1. */
export function readingMinutes(blocks: ReadonlyArray<{ _type: string }>): number {
  const words = blocks
    .filter((node): node is PtBlock => node._type === "block")
    .map((node) => blockText(node).trim().split(/\s+/).filter(Boolean).length)
    .reduce((sum, count) => sum + count, 0);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export interface PtHeading {
  key: string;
  id: string;
  text: string;
}

/**
 * The body's H2s with unique, URL-safe ids ("start-with-the-job", "-2" for repeats). Used for
 * the heading anchors in RichText and the "On this page" list, so both get the same ids.
 */
export function outline(blocks: ReadonlyArray<{ _type: string; _key: string }>): PtHeading[] {
  const seen = new Map<string, number>();
  return blocks
    .filter((node): node is PtBlock => node._type === "block" && (node as PtBlock).style === "h2")
    .map((node) => ({ key: node._key, text: blockText(node).trim() }))
    .filter((heading) => heading.text)
    .map(({ key, text }) => {
      const base =
        text
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "section";
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      return { key, id: count ? `${base}-${count + 1}` : base, text };
    });
}
