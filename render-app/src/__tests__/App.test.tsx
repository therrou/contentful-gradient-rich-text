import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BLOCKS } from '@contentful/rich-text-types';

const getEntryMock = vi.fn();
const getContentfulClientMock = vi.fn(() => ({ getEntry: getEntryMock }));

vi.mock('../lib/contentfulClient', () => ({
  getContentfulClient: () => getContentfulClientMock(),
}));

import App from '../App';

const doc = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        { nodeType: 'text', value: 'Gradient Hello', marks: [{ type: 'gradient-ocean' }], data: {} },
      ],
    },
  ],
};

describe('App', () => {
  const originalEntryId = import.meta.env.VITE_CONTENTFUL_ENTRY_ID;

  beforeEach(() => {
    getEntryMock.mockReset();
    getContentfulClientMock.mockReset();
    getContentfulClientMock.mockImplementation(() => ({ getEntry: getEntryMock }));
    import.meta.env.VITE_CONTENTFUL_ENTRY_ID = 'entry-123';
  });

  afterEach(() => {
    import.meta.env.VITE_CONTENTFUL_ENTRY_ID = originalEntryId;
  });

  it('shows a loading state before the entry resolves', () => {
    getEntryMock.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders the gradient rich text once the entry loads', async () => {
    getEntryMock.mockResolvedValue({ fields: { richTextGradient: doc } });
    render(<App />);
    await waitFor(() => expect(screen.queryByText('Gradient Hello')).toBeTruthy());
    expect(screen.getByText('Gradient Hello').className).toContain('gradient-text--gradient-ocean');
  });

  it('shows an error state when the entry has no richTextGradient field', async () => {
    getEntryMock.mockResolvedValue({ fields: {} });
    render(<App />);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toContain('Entry has no richTextGradient field value');
  });

  it('shows an error state when the fetch rejects', async () => {
    getEntryMock.mockRejectedValue(new Error('network down'));
    render(<App />);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toContain('network down');
  });

  it('shows an error state when VITE_CONTENTFUL_ENTRY_ID is missing', async () => {
    import.meta.env.VITE_CONTENTFUL_ENTRY_ID = '';
    render(<App />);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toContain('Missing VITE_CONTENTFUL_ENTRY_ID');
  });

  it('shows an error state (not a blank page) when getContentfulClient throws synchronously', async () => {
    getContentfulClientMock.mockImplementation(() => {
      throw new Error('Missing VITE_CONTENTFUL_SPACE_ID');
    });
    render(<App />);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toContain('Missing VITE_CONTENTFUL_SPACE_ID');
  });
});
