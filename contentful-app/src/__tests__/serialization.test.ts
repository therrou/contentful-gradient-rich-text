import { describe, it, expect } from 'vitest';
import { BLOCKS } from '@contentful/rich-text-types';
import type { Document } from '@contentful/rich-text-types';
import { documentToSlateValue, slateValueToDocument } from '../richText/serialization';

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
});
