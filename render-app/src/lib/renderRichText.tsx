import React from 'react';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import type { Document } from '@contentful/rich-text-types';
import { GRADIENT_PRESETS, HIGHLIGHT_PRESETS } from '../gradientPresets';
import GradientText from './GradientText';

const GRADIENT_ANIMATED_MARK_TYPE = 'gradient-animated';

const renderMark: Record<string, (text: React.ReactNode) => React.ReactNode> = Object.fromEntries(
  GRADIENT_PRESETS.map((preset) => [
    preset.markType,
    (text: React.ReactNode) => (
      <span key={preset.markType} className={`gradient-text gradient-text--${preset.markType}`}>
        {text}
      </span>
    ),
  ])
);

// Highlight is independent of the gradient-* marks now — it renders its own
// span with the matching gradient-highlight--<preset> class regardless of
// whether a gradient mark is also present on the same leaf.
for (const preset of HIGHLIGHT_PRESETS) {
  renderMark[preset.markType] = (text: React.ReactNode) => (
    <span
      key={preset.markType}
      className={`gradient-highlight gradient-highlight--${preset.markType}`}
    >
      {text}
    </span>
  );
}

// `documentToReactComponents` composes marks independently: each mark's
// renderer only ever sees the *already-rendered* output of the marks
// processed before it, with no visibility into the leaf's other marks. So
// "animated" can't be a self-contained renderer — the gradient-* mark
// renderer above always runs first (it comes first in the leaf's marks
// array) and wraps the text in its static `.gradient-text--<preset>` span;
// this mark's renderer then runs on the *outside* of that span, unwraps it,
// and re-renders the same content through the animated GradientText
// component using that preset's two colors.
renderMark[GRADIENT_ANIMATED_MARK_TYPE] = (node: React.ReactNode) => {
  if (React.isValidElement(node)) {
    const props = node.props as { className?: string; children?: React.ReactNode };
    const preset = GRADIENT_PRESETS.find((p) =>
      props.className?.includes(`gradient-text--${p.markType}`)
    );
    if (preset) {
      return (
        <GradientText key={`${preset.markType}-animated`} colors={[preset.from, preset.to]}>
          {props.children}
        </GradientText>
      );
    }
  }
  return node;
};

export function renderGradientRichText(document: Document): React.JSX.Element {
  return <>{documentToReactComponents(document, { renderMark })}</>;
}
