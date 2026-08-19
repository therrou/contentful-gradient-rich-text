import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BLOCKS } from '@contentful/rich-text-types';
import { renderGradientRichText } from '../lib/renderRichText';

function docWithMark(markType: string) {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.PARAGRAPH,
        data: {},
        content: [
          {
            nodeType: 'text',
            value: 'Gradient Hello',
            marks: [{ type: markType }],
            data: {},
          },
        ],
      },
    ],
  } as any;
}

describe('renderGradientRichText', () => {
  it('wraps gradient-marked text in a span with the matching class', () => {
    render(renderGradientRichText(docWithMark('gradient-ocean')));
    const span = screen.getByText('Gradient Hello');
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toContain('gradient-text--gradient-ocean');
  });

  it('renders plain text without a gradient span when no gradient mark is present', () => {
    const doc = {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: [{ nodeType: 'text', value: 'Plain text', marks: [], data: {} }],
        },
      ],
    } as any;
    render(renderGradientRichText(doc));
    const node = screen.getByText('Plain text');
    expect(node.className).not.toContain('gradient-text');
  });
});
