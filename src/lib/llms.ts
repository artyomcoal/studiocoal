/**
 * /llms.txt (llmstxt.org): a short Markdown guide to the site for AI assistants: who the
 * studio is, answers to common questions, and a described link to every page. Pure
 * function, covered by Vitest; src/pages/llms.txt.ts feeds it from Sanity.
 */

export interface LlmsLink {
  title: string;
  /** Absolute URL. */
  url: string;
  description?: string | null;
}

export interface LlmsInput {
  name: string;
  /** One paragraph about the studio. */
  summary?: string | null;
  faq?: { question?: string | null; answer?: string | null }[] | null;
  /** Link lists in order; empty ones are left out. */
  sections: { title: string; links: LlmsLink[] }[];
}

/** Markdown on one line: llms.txt entries are single list items. */
const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();

export function buildLlmsTxt({ name, summary, faq, sections }: LlmsInput): string {
  const blocks = [`# ${oneLine(name)}`];
  if (summary?.trim()) blocks.push(`> ${oneLine(summary)}`);

  const answers = (faq ?? []).flatMap(({ question, answer }) =>
    question?.trim() && answer?.trim() ? [`- **${oneLine(question)}** ${oneLine(answer)}`] : [],
  );
  if (answers.length) blocks.push(answers.join("\n"));

  for (const section of sections) {
    if (!section.links.length) continue;
    const links = section.links.map(({ title, url, description }) =>
      description?.trim()
        ? `- [${oneLine(title)}](${url}): ${oneLine(description)}`
        : `- [${oneLine(title)}](${url})`,
    );
    blocks.push(`## ${section.title}\n\n${links.join("\n")}`);
  }
  return `${blocks.join("\n\n")}\n`;
}
