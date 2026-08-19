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
 * `preservedBlocks` (typically obtained via `getNonParagraphBlocks` on the
 * original document before editing began) are non-paragraph top-level blocks
 * that this editor doesn't render or edit (headings, lists, quotes, etc. are
 * out of scope). They are appended unchanged so write-back never destroys
 * content this editor can't represent. Only paragraph blocks are
 * regenerated from the live Slate value.
 */
export function slateValueToDocument(
  value: Descendant[],
  preservedBlocks: TopLevelBlock[] = []
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

  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [...paragraphBlocks, ...preservedBlocks],
  };
}
