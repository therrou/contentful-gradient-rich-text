import { describe, it, expect } from 'vitest';
import { BLOCKS } from '@contentful/rich-text-types';
import type { Document } from '@contentful/rich-text-types';
import {
  documentToSlateValue,
  slateValueToDocument,
  getNonParagraphBlocks,
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

  it('preserves non-paragraph top-level blocks unchanged through slateValueToDocument', () => {
    const heading = {
      nodeType: BLOCKS.HEADING_1,
      data: {},
      content: [{ nodeType: 'text', value: 'Existing heading', marks: [], data: {} }],
    };
    const doc: Document = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        heading as any,
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

    // ...but the heading must not be lost on write-back when passed through.
    const nonParagraphBlocks = getNonParagraphBlocks(doc);
    expect(nonParagraphBlocks).toEqual([heading]);

    const written = slateValueToDocument(slateValue, nonParagraphBlocks);
    expect(written.content).toContainEqual(heading);
    expect(written.content).toContainEqual({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [{ nodeType: 'text', value: 'editable paragraph', marks: [], data: {} }],
    });
  });
});
