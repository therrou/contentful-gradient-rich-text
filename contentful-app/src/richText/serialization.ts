import type { Document, TopLevelBlock, Block, Text as ContentfulText } from '@contentful/rich-text-types';
import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import type { Descendant } from 'slate';
import { GRADIENT_ANIMATED_MARK_TYPE, GRADIENT_PRESETS, HIGHLIGHT_PRESETS } from '../gradientPresets';

// Factory (not a shared constant) — Slate mutates `editor.children` in place,
// so returning the same array/object reference from multiple calls would let
// one editor instance's mutations leak into every other call in the process
// (cross-test leakage, multiple editor mounts sharing state).
const emptyParagraph = (): Descendant[] => [
  { type: 'paragraph', children: [{ text: '' }] } as Descendant,
];

const STANDARD_MARK_TYPES: string[] = [MARKS.BOLD, MARKS.ITALIC, MARKS.UNDERLINE, MARKS.CODE];
const GRADIENT_MARK_TYPES: string[] = GRADIENT_PRESETS.map((p) => p.markType);
const HIGHLIGHT_MARK_TYPES: string[] = HIGHLIGHT_PRESETS.map((p) => p.markType);
const ALL_LEAF_MARK_TYPES: string[] = [
  ...STANDARD_MARK_TYPES,
  ...GRADIENT_MARK_TYPES,
  ...HIGHLIGHT_MARK_TYPES,
  GRADIENT_ANIMATED_MARK_TYPE,
];

// Maps between Contentful's rich text nodeTypes and this editor's Slate
// element `type` strings for every block type this editor can render/edit.
const BLOCK_TO_SLATE: Record<string, string> = {
  [BLOCKS.PARAGRAPH]: 'paragraph',
  [BLOCKS.HEADING_1]: 'heading-1',
  [BLOCKS.HEADING_2]: 'heading-2',
  [BLOCKS.HEADING_3]: 'heading-3',
  [BLOCKS.HEADING_4]: 'heading-4',
  [BLOCKS.HEADING_5]: 'heading-5',
  [BLOCKS.HEADING_6]: 'heading-6',
  [BLOCKS.QUOTE]: 'blockquote',
  [BLOCKS.UL_LIST]: 'unordered-list',
  [BLOCKS.OL_LIST]: 'ordered-list',
  [BLOCKS.LIST_ITEM]: 'list-item',
  [BLOCKS.HR]: 'hr',
};
const SLATE_TO_BLOCK: Record<string, string> = Object.fromEntries(
  Object.entries(BLOCK_TO_SLATE).map(([nodeType, slateType]) => [slateType, nodeType])
);

const SUPPORTED_TOP_LEVEL_NODE_TYPES = new Set<string>(Object.keys(BLOCK_TO_SLATE));

// This editor supports editing paragraphs, headings, blockquotes, lists, and
// horizontal rules, with bold/italic/underline/code/gradient marks (its full
// documented scope). If a field already contains other top-level block types
// (embedded entries/assets, tables, etc.), those blocks are not
// rendered/editable here — but they must not be silently dropped on
// write-back. `getBlockLayout` exposes their positions via a non-`'editable'`
// entry, and `slateValueToDocument` re-emits them unchanged.
export function getNonParagraphBlocks(document: Document | undefined): TopLevelBlock[] {
  if (!document || !document.content) return [];
  return document.content.filter((block) => !SUPPORTED_TOP_LEVEL_NODE_TYPES.has(block.nodeType));
}

/**
 * A per-position record of the original document's top-level block order:
 * either the literal string `'editable'` (a slot this editor renders and
 * regenerates content for) or the original unsupported block itself
 * (preserved unchanged). Passing this to `slateValueToDocument` lets it
 * reconstruct blocks in their original positions instead of appending
 * preserved blocks to the end on every write-back.
 */
export type BlockLayoutEntry = 'editable' | TopLevelBlock;

export function getBlockLayout(document: Document | undefined): BlockLayoutEntry[] {
  if (!document || !document.content) return [];
  return document.content.map((block) =>
    SUPPORTED_TOP_LEVEL_NODE_TYPES.has(block.nodeType) ? 'editable' : block
  );
}

function textNodeToLeaf(textNode: ContentfulText): Record<string, unknown> {
  const leaf: Record<string, unknown> = { text: textNode.value };
  for (const mark of textNode.marks ?? []) {
    if (ALL_LEAF_MARK_TYPES.includes(mark.type)) {
      leaf[mark.type] = true;
    }
  }
  return leaf;
}

function blockToSlateNode(block: Block | TopLevelBlock): Descendant {
  const slateType = BLOCK_TO_SLATE[block.nodeType];

  if (block.nodeType === BLOCKS.HR) {
    return { type: 'hr', children: [{ text: '' }] } as unknown as Descendant;
  }

  if (block.nodeType === BLOCKS.UL_LIST || block.nodeType === BLOCKS.OL_LIST) {
    const listItems = (block as Block).content as TopLevelBlock[];
    return {
      type: slateType,
      children: listItems.map((item) => blockToSlateNode(item)),
    } as unknown as Descendant;
  }

  if (block.nodeType === BLOCKS.LIST_ITEM) {
    const children = (block as Block).content as TopLevelBlock[];
    return {
      type: 'list-item',
      children: children.map((child) => blockToSlateNode(child)),
    } as unknown as Descendant;
  }

  if (block.nodeType === BLOCKS.QUOTE) {
    const children = (block as Block).content as TopLevelBlock[];
    return {
      type: 'blockquote',
      children: children.map((child) => blockToSlateNode(child)),
    } as unknown as Descendant;
  }

  // paragraph / headings: leaf-bearing blocks
  const textNodes = (block as Block).content as ContentfulText[];
  return {
    type: slateType,
    children: textNodes.map(textNodeToLeaf),
  } as unknown as Descendant;
}

export function documentToSlateValue(document: Document | undefined): Descendant[] {
  if (!document || !document.content || document.content.length === 0) {
    return emptyParagraph();
  }

  const editableBlocks = document.content.filter((block) =>
    SUPPORTED_TOP_LEVEL_NODE_TYPES.has(block.nodeType)
  );

  const nodes = editableBlocks.map(blockToSlateNode);

  return nodes.length > 0 ? nodes : emptyParagraph();
}

function leavesToTextNodes(children: Descendant[]): ContentfulText[] {
  return (children as unknown as Record<string, unknown>[]).map((leaf) => {
    const marks = ALL_LEAF_MARK_TYPES.filter((markType) => leaf[markType] === true).map(
      (type) => ({ type })
    );
    return {
      nodeType: 'text',
      value: String(leaf.text ?? ''),
      marks,
      data: {},
    } as ContentfulText;
  });
}

function slateNodeToBlock(node: any): TopLevelBlock {
  const nodeType = SLATE_TO_BLOCK[node.type] ?? BLOCKS.PARAGRAPH;

  if (node.type === 'hr') {
    return { nodeType: BLOCKS.HR, data: {}, content: [] } as unknown as TopLevelBlock;
  }

  if (node.type === 'unordered-list' || node.type === 'ordered-list') {
    return {
      nodeType,
      data: {},
      content: (node.children ?? []).map((item: any) => slateNodeToBlock(item)),
    } as unknown as TopLevelBlock;
  }

  if (node.type === 'list-item') {
    return {
      nodeType: BLOCKS.LIST_ITEM,
      data: {},
      content: (node.children ?? []).map((child: any) => slateNodeToBlock(child)),
    } as unknown as TopLevelBlock;
  }

  if (node.type === 'blockquote') {
    return {
      nodeType: BLOCKS.QUOTE,
      data: {},
      content: (node.children ?? []).map((child: any) => slateNodeToBlock(child)),
    } as unknown as TopLevelBlock;
  }

  // paragraph / headings
  return {
    nodeType,
    data: {},
    content: leavesToTextNodes(node.children ?? []),
  } as unknown as TopLevelBlock;
}

/**
 * Converts the editor's Slate value back into a Contentful Document.
 *
 * `layout` (typically obtained via `getBlockLayout` on the original document
 * before editing began) records the original top-level block order: an
 * `'editable'` entry marks a slot this editor renders, and any other entry is
 * a preserved unsupported block (embedded entry/asset, table, etc. — out of
 * this editor's scope) to be re-emitted unchanged in its original position.
 *
 * Regenerated top-level nodes (in Slate document order) are filled into
 * `'editable'` slots in order. If the editor produced MORE nodes than there
 * were original slots, the extras are inserted immediately after the last
 * slot's position (or appended at the end if there were no editable slots at
 * all — e.g. the field started out with only unsupported content). If the
 * editor produced FEWER nodes than there were original slots (content
 * deleted), the unfilled slots are simply omitted rather than emitting empty
 * nodes.
 *
 * When `layout` is omitted (e.g. brand-new/empty field), all regenerated
 * nodes are emitted in order with nothing preserved.
 */
export function slateValueToDocument(
  value: Descendant[],
  layout: BlockLayoutEntry[] = []
): Document {
  const regeneratedBlocks = value.map((node) => slateNodeToBlock(node));

  if (layout.length === 0) {
    return { nodeType: BLOCKS.DOCUMENT, data: {}, content: regeneratedBlocks };
  }

  const content: TopLevelBlock[] = [];
  let pointer = 0;
  let lastRegeneratedOutputIndex = -1;

  for (const entry of layout) {
    if (entry === 'editable') {
      if (pointer < regeneratedBlocks.length) {
        content.push(regeneratedBlocks[pointer]);
        pointer += 1;
        lastRegeneratedOutputIndex = content.length - 1;
      }
      // else: fewer regenerated nodes than original slots — skip.
    } else {
      content.push(entry);
    }
  }

  if (pointer < regeneratedBlocks.length) {
    const extras = regeneratedBlocks.slice(pointer);
    if (lastRegeneratedOutputIndex === -1) {
      content.push(...extras);
    } else {
      content.splice(lastRegeneratedOutputIndex + 1, 0, ...extras);
    }
  }

  return { nodeType: BLOCKS.DOCUMENT, data: {}, content };
}
