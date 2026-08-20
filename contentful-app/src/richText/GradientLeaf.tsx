import React from 'react';
import type { RenderLeafProps } from 'slate-react';
import {
  gradientCss,
  gradientHighlightCss,
  getPresetByMarkType,
  getHighlightPresetByMarkType,
  type GradientMarkType,
  type HighlightMarkType,
} from '../gradientPresets';

interface GradientLeafProps extends RenderLeafProps {
  markType?: GradientMarkType;
  highlightMarkType?: HighlightMarkType;
}

export function GradientLeaf({
  markType,
  highlightMarkType,
  attributes,
  children,
}: GradientLeafProps) {
  // Highlight wins visually when both are present: gradient's transparent
  // text-fill would otherwise be invisible sitting on a highlight
  // background, so it falls back to the highlight's solid, legible text
  // color instead.
  const style = highlightMarkType
    ? gradientHighlightCss(getHighlightPresetByMarkType(highlightMarkType))
    : markType
      ? gradientCss(getPresetByMarkType(markType))
      : undefined;

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
}
