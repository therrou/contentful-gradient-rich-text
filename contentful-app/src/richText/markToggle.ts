import { Editor } from 'slate';
import { GRADIENT_PRESETS, isGradientMarkType, type GradientMarkType } from '../gradientPresets';

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
