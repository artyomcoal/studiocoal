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
