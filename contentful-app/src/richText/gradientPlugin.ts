import React from 'react';
import { Editor } from 'slate';
import { GRADIENT_PRESETS, isGradientMarkType, type GradientMarkType } from '../gradientPresets';
import { GradientLeaf } from './GradientLeaf';

interface GradientPlatePlugin {
  key: GradientMarkType;
  type: GradientMarkType;
  isLeaf: true;
  component: (props: any) => JSX.Element;
}

export function createGradientPlugins(): GradientPlatePlugin[] {
  return GRADIENT_PRESETS.map((preset) => ({
    key: preset.markType,
    type: preset.markType,
    isLeaf: true,
    component: (props: any) => React.createElement(GradientLeaf, { ...props, markType: preset.markType }),
  }));
}

export function toggleGradientMark(editor: Editor, markType: GradientMarkType): void {
  const marks = Editor.marks(editor) ?? {};
  const isActive = marks[markType] === true;

  for (const preset of GRADIENT_PRESETS) {
    if (isGradientMarkType(preset.markType) && marks[preset.markType]) {
      editor.removeMark(preset.markType);
    }
  }

  if (!isActive) {
    editor.addMark(markType, true);
  }
}
