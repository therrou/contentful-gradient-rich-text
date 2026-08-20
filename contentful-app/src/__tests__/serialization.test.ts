import { describe, it, expect } from 'vitest';
import { BLOCKS } from '@contentful/rich-text-types';
import type { Document } from '@contentful/rich-text-types';
import {
  documentToSlateValue,
  slateValueToDocument,
  getNonParagraphBlocks,
  getBlockLayout,
} from '../richText/serialization';

describe('serialization', () => {
  it('documentToSlateValue(undefined) returns a single empty paragraph', () => {
    expect(documentToSlateValue(undefined)).toEqual([
      { type: 'paragraph', children: [{ text: '' }] },
    ]);
  });

  it('converts a document with one paragraph, one plain text node', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: 'hello', marks: [], data: {} }],
        },
      ],
    };

    expect(documentToSlateValue(doc)).toEqual([
      { type: 'paragraph', children: [{ text: 'hello' }] },
    ]);
  });

  it('converts a text node with a bold mark to a bold: true leaf', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: 'bold text', marks: [{ type: 'bold' }], data: {} }],
        },
      ],
    };

    expect(documentToSlateValue(doc)).toEqual([
      { type: 'paragraph', children: [{ text: 'bold text', bold: true }] },
    ]);
  });

  it('converts a text node with a gradient-ocean mark to a gradient-ocean: true leaf', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [
            { nodeType: 'text', value: 'gradient text', marks: [{ type: 'gradient-ocean' }], data: {} },
          ],
        },
      ],
    };

    expect(documentToSlateValue(doc)).toEqual([
      { type: 'paragraph', children: [{ text: 'gradient text', 'gradient-ocean': true }] },
    ]);
  });

  it('round-trips a document with plain, bold, and gradient-marked text in one paragraph', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [
            { nodeType: 'text', value: 'plain ', marks: [], data: {} },
            { nodeType: 'text', value: 'bold ', marks: [{ type: 'bold' }], data: {} },
            { nodeType: 'text', value: 'gradient', marks: [{ type: 'gradient-berry' }], data: {} },
          ],
        },
      ],
    };

    const roundTripped = slateValueToDocument(documentToSlateValue(doc));
    expect(roundTripped).toEqual(doc);
  });

  it('returns a fresh empty-paragraph array/object on each call (no shared mutable reference)', () => {
    const first = documentToSlateValue(undefined);
    const second = documentToSlateValue(undefined);

    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);

    // Mutate as Slate would (editor.children is mutated in place); the other
    // call's result must be unaffected.
    (first[0] as any).children[0].text = 'mutated';
    expect((second[0] as any).children[0].text).toBe('');
  });

  it('preserves unsupported top-level blocks unchanged through slateValueToDocument', () => {
    const embeddedEntry = {
      nodeType: BLOCKS.EMBEDDED_ENTRY,
      data: { target: { sys: { id: 'entry1', type: 'Link', linkType: 'Entry' } } },
      content: [],
    };
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        embeddedEntry as any,
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: 'editable paragraph', marks: [], data: {} }],
        },
      ],
    };

    // documentToSlateValue only surfaces the paragraph to the editor...
    const slateValue = documentToSlateValue(doc);
    expect(slateValue).toEqual([{ type: 'paragraph', children: [{ text: 'editable paragraph' }] }]);

    // ...but the embedded entry must not be lost on write-back when passed through.
    const nonParagraphBlocks = getNonParagraphBlocks(doc);
    expect(nonParagraphBlocks).toEqual([embeddedEntry]);

    const written = slateValueToDocument(slateValue, nonParagraphBlocks as any);
    expect(written.content).toContainEqual(embeddedEntry);
    expect(written.content).toContainEqual({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{ nodeType: 'text', value: 'editable paragraph', marks: [], data: {} }],
    });
  });

  it('converts headings, blockquotes, lists, and hr to their Slate element types', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.HEADING_1,
          data: {},
          content: [{ nodeType: 'text', value: 'Title', marks: [], data: {} }],
        },
        {
          nodeType: BLOCKS.QUOTE,
          data: {},
          content: [
            {
              nodeType: BLOCKS.PARAGRAPH,
              data: {},
              content: [{ nodeType: 'text', value: 'quoted', marks: [], data: {} }],
            },
          ],
        },
        {
          nodeType: BLOCKS.UL_LIST,
          data: {},
          content: [
            {
              nodeType: BLOCKS.LIST_ITEM,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [{ nodeType: 'text', value: 'item one', marks: [], data: {} }],
                },
              ],
            },
          ],
        },
        { nodeType: BLOCKS.HR, data: {}, content: [] },
      ] as any,
    };

    expect(documentToSlateValue(doc)).toEqual([
      { type: 'heading-1', children: [{ text: 'Title' }] },
      { type: 'blockquote', children: [{ type: 'paragraph', children: [{ text: 'quoted' }] }] },
      {
        type: 'unordered-list',
        children: [
          {
            type: 'list-item',
            children: [{ type: 'paragraph', children: [{ text: 'item one' }] }],
          },
        ],
      },
      { type: 'hr', children: [{ text: '' }] },
    ]);
  });

  it('round-trips headings, blockquotes, lists, and hr through slateValueToDocument', () => {
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.HEADING_2,
          data: {},
          content: [{ nodeType: 'text', value: 'Subtitle', marks: [], data: {} }],
        },
        {
          nodeType: BLOCKS.OL_LIST,
          data: {},
          content: [
            {
              nodeType: BLOCKS.LIST_ITEM,
              data: {},
              content: [
                {
                  nodeType: BLOCKS.PARAGRAPH,
                  data: {},
                  content: [{ nodeType: 'text', value: 'first', marks: [], data: {} }],
                },
              ],
            },
          ],
        },
      ] as any,
    };

    const roundTripped = slateValueToDocument(documentToSlateValue(doc));
    expect(roundTripped).toEqual(doc);
  });

  describe('getBlockLayout / position-preserving write-back', () => {
    const embeddedEntry = {
      nodeType: BLOCKS.EMBEDDED_ENTRY,
      data: { target: { sys: { id: 'entry1', type: 'Link', linkType: 'Entry' } } },
      content: [],
    };
    const paragraph = {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{ nodeType: 'text', value: 'editable paragraph', marks: [], data: {} }],
    };

    it('preserves original order (embedded entry before paragraph), not append-at-end', () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [embeddedEntry as any, paragraph as any],
      };

      const layout = getBlockLayout(doc);
      expect(layout).toEqual([embeddedEntry, 'editable']);

      const slateValue = documentToSlateValue(doc);
      const written = slateValueToDocument(slateValue, layout as any);

      // Order-sensitive: embedded entry must still come BEFORE the paragraph.
      expect(written.content).toEqual([embeddedEntry, paragraph]);
    });

    it('preserves order when the paragraph originally comes first', () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [paragraph as any, embeddedEntry as any],
      };

      const layout = getBlockLayout(doc);
      const slateValue = documentToSlateValue(doc);
      const written = slateValueToDocument(slateValue, layout as any);

      expect(written.content).toEqual([paragraph, embeddedEntry]);
    });

    it('inserts extra regenerated paragraphs right after the last editable slot', () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [paragraph as any, embeddedEntry as any],
      };

      const layout = getBlockLayout(doc);
      const extraParagraph = {
        type: 'paragraph',
        children: [{ text: 'newly added paragraph' }],
      };
      const slateValue = [...documentToSlateValue(doc), extraParagraph] as any;

      const written = slateValueToDocument(slateValue, layout as any);

      expect(written.content).toEqual([
        paragraph,
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: 'newly added paragraph', marks: [], data: {} }],
        },
        embeddedEntry,
      ]);
    });

    it('omits unfilled editable slots when fewer nodes are regenerated', () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [paragraph as any, embeddedEntry as any, paragraph as any],
      };

      const layout = getBlockLayout(doc);
      // Only one paragraph left in the editor (as if the second was deleted).
      const slateValue = [{ type: 'paragraph', children: [{ text: 'editable paragraph' }] }] as any;

      const written = slateValueToDocument(slateValue, layout as any);

      expect(written.content).toEqual([paragraph, embeddedEntry]);
    });
  });
});
