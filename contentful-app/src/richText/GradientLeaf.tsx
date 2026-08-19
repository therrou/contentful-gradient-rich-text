import React from 'react';
import type { RenderLeafProps } from 'slate-react';
import { gradientCss, getPresetByMarkType, type GradientMarkType } from '../gradientPresets';

interface GradientLeafProps extends RenderLeafProps {
  markType: GradientMarkType;
}

export function GradientLeaf({ markType, attributes, children }: GradientLeafProps) {
  const preset = getPresetByMarkType(markType);
  return (
    <span {...attributes} style={gradientCss(preset)}>
      {children}
    </span>
  );
}
