import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GradientRichTextEditor } from '../richText/GradientRichTextEditor';
import type { FieldExtensionSDK } from '@contentful/app-sdk';

describe('GradientRichTextEditor', () => {
  it('renders without throwing given a minimal mock sdk', () => {
    const mockSdk = {
      field: {
        getValue: () => undefined,
        setValue: () => Promise.resolve(),
      },
    } as unknown as FieldExtensionSDK;

    expect(() => render(<GradientRichTextEditor sdk={mockSdk} />)).not.toThrow();
  });
});
