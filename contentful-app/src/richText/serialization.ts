import type { Document, TopLevelBlock, Text as ContentfulText } from '@contentful/rich-text-types';
import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import type { Descendant } from 'slate';
import { GRADIENT_PRESETS } from '../gradientPresets';

// Factory (not a shared constant) — Slate mutates `editor.children` in place,
// so returning the same array/object reference from multiple calls would let
// one editor instance's mutations leak into every other call in the process
// (cross-test leakage, multiple editor mounts sharing state).
const emptyParagraph = (): Descendant[] => [
  { type: 'paragraph', children: [{ text: '' }] } as Descendant,
];

const STANDARD_MARK_TYPES: string[] = [MARKS.BOLD, MARKS.ITALIC];
const GRADIENT_MARK_TYPES: string[] = GRADIENT_PRESETS.map((p) => p.markType);
const ALL_LEAF_MARK_TYPES: string[] = [...STANDARD_MARK_TYPES, ...GRADIENT_MARK_TYPES];

// This editor only supports editing paragraph blocks with bold/italic/gradient
// marks (its full documented scope). If a field already contains other
// top-level block types (headings, lists, quotes, etc.), those blocks are not
// rendered/editable here — but they must not be silently dropped on write-back.
// `documentToSlateValue` exposes them via `getNonParagraphBlocks`, and callers
// must pass them back into `slateValueToDocument` so they pass through
// untouched instead of being overwritten by the editor's paragraph-only output.
export function getNonParagraphBlocks(document: Document | undefined): TopLevelBlock[] {
  if (!document || !document.content) return [];
  return document.content.filter((block) => block.nodeType !== BLOCKS.PARAGRAPH);
}

/**
 * A per-position record of the original document's top-level block order:
 * either the literal string `'paragraph'` (an editable slot the Slate editor
 * regenerates content for) or the original non-paragraph block itself
 * (preserved unchanged). Passing this to `slateValueToDocument` lets it
 * reconstruct blocks in their original positions instead of appending
 * preserved blocks to the end on every write-back.
 */
export type BlockLayoutEntry = 'paragraph' | TopLevelBlock;

export function getBlockLayout(document: Document | undefined): BlockLayoutEntry[] {
  if (!document || !document.content) return [];
  return document.content.map((block) =>
    block.nodeType === BLOCKS.PARAGRAPH ? 'paragraph' : block
  );
}

export function documentToSlateValue(document: Document | undefined): Descendant[] {
  if (!document || !document.content || document.content.length === 0) {
    return emptyParagraph();
  }

  const paragraphs = document.content
    .filter((block): block is TopLevelBlock => block.nodeType === BLOCKS.PARAGRAPH)
    .map((block) => ({
      type: 'paragraph',
      children: (block.content as ContentfulText[]).map((textNode) => {
        const leaf: Record<string, unknown> = { text: textNode.value };
        for (const mark of textNode.marks ?? []) {
          if (ALL_LEAF_MARK_TYPES.includes(mark.type)) {
            leaf[mark.type] = true;
          }
        }
        return leaf;
      }),
    })) as unknown as Descendant[];

  return paragraphs.length > 0 ? paragraphs : emptyParagraph();
}

/**
 * Converts the editor's Slate value back into a Contentful Document.
 *
 * `layout` (typically obtained via `getBlockLayout` on the original document
 * before editing began) records the original top-level block order: a
 * `'paragraph'` entry marks an editable slot, and any other entry is a
 * preserved non-paragraph block (heading, list, etc. — out of this editor's
 * scope) to be re-emitted unchanged in its original position.
 *
 * Regenerated paragraphs (in Slate document order) are filled into
 * `'paragraph'` slots in order. If the editor produced MORE paragraphs than
 * there were original slots, the extras are inserted immediately after the
 * last paragraph slot's position (or appended at the end if there were no
 * paragraph slots at all — e.g. the field started out with only non-paragraph
 * content). If the editor produced FEWER paragraphs than there were original
 * slots (content deleted), the unfilled slots are simply omitted rather than
 * emitting empty paragraphs.
 *
 * When `layout` is omitted (e.g. brand-new/empty field), all regenerated
 * paragraphs are emitted in order with nothing preserved.
 */
export function slateValueToDocument(
  value: Descendant[],
  layout: BlockLayoutEntry[] = []
): Document {
  const paragraphBlocks = value.map((node: any) => ({
    nodeType: BLOCKS.PARAGRAPH,
    data: {},
    content: (node.children ?? []).map((leaf: Record<string, unknown>) => {
      const marks = ALL_LEAF_MARK_TYPES.filter((markType) => leaf[markType] === true).map(
        (type) => ({ type })
      );
      return {
        nodeType: 'text',
        value: String(leaf.text ?? ''),
        marks,
        data: {},
      };
    }),
  })) as TopLevelBlock[];

  if (layout.length === 0) {
    return { nodeType: BLOCKS.DOCUMENT, data: {}, content: paragraphBlocks };
  }

  const content: TopLevelBlock[] = [];
  let pointer = 0;
  let lastParagraphOutputIndex = -1;

  for (const entry of layout) {
    if (entry === 'paragraph') {
      if (pointer < paragraphBlocks.length) {
        content.push(paragraphBlocks[pointer]);
        pointer += 1;
        lastParagraphOutputIndex = content.length - 1;
      }
      // else: fewer regenerated paragraphs than original slots — skip.
    } else {
      content.push(entry);
    }
  }

  if (pointer < paragraphBlocks.length) {
    const extras = paragraphBlocks.slice(pointer);
    if (lastParagraphOutputIndex === -1) {
      content.push(...extras);
    } else {
      content.splice(lastParagraphOutputIndex + 1, 0, ...extras);
    }
  }

  return { nodeType: BLOCKS.DOCUMENT, data: {}, content };
}
