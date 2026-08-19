import React from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import type { Document } from '@contentful/rich-text-types';
import { GRADIENT_PRESETS } from '../gradientPresets';

const renderMark = Object.fromEntries(
  GRADIENT_PRESETS.map((preset) => [
    preset.markType,
    (text: React.ReactNode) => (
      <span key={preset.markType} className={`gradient-text gradient-text--${preset.markType}`}>
        {text}
      </span>
    ),
  ])
);

export function renderGradientRichText(document: Document): JSX.Element {
  return <>{documentToReactComponents(document, { renderMark })}</>;
}
