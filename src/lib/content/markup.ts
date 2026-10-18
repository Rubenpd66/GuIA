/**
 * Minimal inline markup for content strings: **bold**, _italic_ and ==highlight==.
 * Answer gaps (three or more underscores) and underscores inside words are plain text.
 */

export type InlineNode = {
  type: "text" | "strong" | "em" | "mark";
  text: string;
};

const TOKEN =
  /\*\*(.+?)\*\*|==(.+?)==|(?<![_\p{L}\p{N}])_(?!_)(.+?)(?<!_)_(?![_\p{L}\p{N}])/gu;

export function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last)
      nodes.push({ type: "text", text: text.slice(last, match.index) });
    const [, strong, mark, em] = match;
    if (strong !== undefined) nodes.push({ type: "strong", text: strong });
    else if (mark !== undefined) nodes.push({ type: "mark", text: mark });
    else if (em !== undefined) nodes.push({ type: "em", text: em });
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push({ type: "text", text: text.slice(last) });
  return nodes;
}

/** Splits a sentence around its answer gaps; one gap gives two parts. */
export function splitGaps(text: string): string[] {
  return text.split(/_{3,}/);
}
