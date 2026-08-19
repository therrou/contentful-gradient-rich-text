import type { Document, TopLevelBlock, Text as ContentfulText } from '@contentful/rich-text-types';
import { BLOCKS, MARKS } from '@contentful/rich-text-types';
import type { Descendant } from 'slate';
import { GRADIENT_PRESETS } from '../gradientPresets';

const EMPTY_PARAGRAPH: Descendant[] = [{ type: 'paragraph', children: [{ text: '' }] } as Descendant];

const STANDARD_MARK_TYPES: string[] = [MARKS.BOLD, MARKS.ITALIC];
const GRADIENT_MARK_TYPES: string[] = GRADIENT_PRESETS.map((p) => p.markType);
const ALL_LEAF_MARK_TYPES: string[] = [...STANDARD_MARK_TYPES, ...GRADIENT_MARK_TYPES];

export function documentToSlateValue(document: Document | undefined): Descendant[] {
  if (!document || !document.content || document.content.length === 0) {
    return EMPTY_PARAGRAPH;
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

  return paragraphs.length > 0 ? paragraphs : EMPTY_PARAGRAPH;
}

export function slateValueToDocument(value: Descendant[]): Document {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: value.map((node: any) => ({
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
    })) as TopLevelBlock[],
  };
}
