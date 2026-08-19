import { useEffect, useState } from 'react';
import type { Document } from '@contentful/rich-text-types';
import { getContentfulClient } from './lib/contentfulClient';
import { renderGradientRichText } from './lib/renderRichText';
import './gradients.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; document: Document };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const entryId = import.meta.env.VITE_CONTENTFUL_ENTRY_ID;
    if (!entryId) {
      setState({ status: 'error', message: 'Missing VITE_CONTENTFUL_ENTRY_ID' });
      return;
    }

    Promise.resolve()
      .then(() => getContentfulClient())
      .then((client) => client.getEntry(entryId))
      .then((entry) => {
        const document = (entry.fields as Record<string, unknown>).richTextGradient as
          | Document
          | undefined;
        if (!document) {
          setState({ status: 'error', message: 'Entry has no richTextGradient field value' });
          return;
        }
        setState({ status: 'loaded', document });
      })
      .catch((err: Error) => setState({ status: 'error', message: err.message }));
  }, []);

  if (state.status === 'loading') return <p>Loading…</p>;
  if (state.status === 'error') return <p role="alert">Error: {state.message}</p>;

  return <article>{renderGradientRichText(state.document)}</article>;
}
