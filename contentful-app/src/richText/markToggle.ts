import { Editor } from 'slate';
import {
  GRADIENT_ANIMATED_MARK_TYPE,
  GRADIENT_PRESETS,
  HIGHLIGHT_PRESETS,
  isGradientMarkType,
  isHighlightMarkType,
  type GradientMarkType,
  type HighlightMarkType,
} from '../gradientPresets';

export function clearGradientMarks(editor: Editor): void {
  const marks = Editor.marks(editor) ?? {};
  for (const preset of GRADIENT_PRESETS) {
    if (isGradientMarkType(preset.markType) && marks[preset.markType]) {
      editor.removeMark(preset.markType);
    }
  }
  // Animated only means something alongside a gradient — clearing the
  // gradient without also clearing it would leave a dangling mark that
  // re-activates the next time any gradient is picked. Highlight is
  // independent of gradient now, so it's left untouched here.
  if (marks[GRADIENT_ANIMATED_MARK_TYPE]) {
    editor.removeMark(GRADIENT_ANIMATED_MARK_TYPE);
  }
}

export function toggleGradientMark(editor: Editor, markType: GradientMarkType): void {
  const marks = Editor.marks(editor) ?? {};
  const isActive = marks[markType] === true;

  clearGradientMarks(editor);

  if (!isActive) {
    editor.addMark(markType, true);
  }
}

export function toggleAnimatedMark(editor: Editor): void {
  const marks = Editor.marks(editor) ?? {};
  if (marks[GRADIENT_ANIMATED_MARK_TYPE]) {
    editor.removeMark(GRADIENT_ANIMATED_MARK_TYPE);
  } else {
    editor.addMark(GRADIENT_ANIMATED_MARK_TYPE, true);
  }
}

export function clearHighlightMarks(editor: Editor): void {
  const marks = Editor.marks(editor) ?? {};
  for (const preset of HIGHLIGHT_PRESETS) {
    if (isHighlightMarkType(preset.markType) && marks[preset.markType]) {
      editor.removeMark(preset.markType);
    }
  }
}

export function toggleHighlightMark(editor: Editor, markType: HighlightMarkType): void {
  const marks = Editor.marks(editor) ?? {};
  const isActive = marks[markType] === true;

  clearHighlightMarks(editor);

  if (!isActive) {
    editor.addMark(markType, true);
  }
}
