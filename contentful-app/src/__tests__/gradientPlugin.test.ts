import { describe, it, expect, vi } from 'vitest';
import { createEditor, Editor, Transforms } from 'slate';
import { withReact } from 'slate-react';
import { createGradientPlugins, toggleGradientMark } from '../richText/gradientPlugin';
import { GRADIENT_PRESETS } from '../gradientPresets';

describe('createGradientPlugins', () => {
  it('creates one plugin per preset keyed by markType', () => {
    const plugins = createGradientPlugins();
    expect(plugins.map((p) => p.key)).toEqual(GRADIENT_PRESETS.map((p) => p.markType));
    expect(plugins.every((p) => p.isLeaf)).toBe(true);
  });
});

describe('toggleGradientMark', () => {
  function buildEditorWithSelection() {
    const editor = withReact(createEditor());
    editor.children = [{ type: 'paragraph', children: [{ text: 'hello' }] }];
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    });
    return editor;
  }

  it('applies the requested gradient mark', () => {
    const editor = buildEditorWithSelection();
    toggleGradientMark(editor, 'gradient-ocean');
    expect(Editor.marks(editor)?.['gradient-ocean']).toBe(true);
  });

  it('removes a previously applied gradient mark before applying a new one', () => {
    const editor = buildEditorWithSelection();
    toggleGradientMark(editor, 'gradient-sunset');
    toggleGradientMark(editor, 'gradient-mint');
    const marks = Editor.marks(editor) ?? {};
    expect(marks['gradient-sunset']).toBeUndefined();
    expect(marks['gradient-mint']).toBe(true);
  });

  it('toggling the same mark twice removes it', () => {
    const editor = buildEditorWithSelection();
    toggleGradientMark(editor, 'gradient-berry');
    toggleGradientMark(editor, 'gradient-berry');
    expect(Editor.marks(editor)?.['gradient-berry']).toBeUndefined();
  });
});
