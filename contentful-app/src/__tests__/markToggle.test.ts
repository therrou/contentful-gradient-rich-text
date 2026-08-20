import { describe, it, expect } from 'vitest';
import { createEditor, Editor, Transforms } from 'slate';
import { withReact } from 'slate-react';
import { toggleGradientMark, toggleHighlightMark } from '../richText/markToggle';

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

  it('leaves an applied highlight mark untouched', () => {
    const editor = buildEditorWithSelection();
    toggleHighlightMark(editor, 'highlight-ocean');
    toggleGradientMark(editor, 'gradient-sunset');
    expect(Editor.marks(editor)?.['highlight-ocean']).toBe(true);
    expect(Editor.marks(editor)?.['gradient-sunset']).toBe(true);
  });
});

describe('toggleHighlightMark', () => {
  function buildEditorWithSelection() {
    const editor = withReact(createEditor());
    editor.children = [{ type: 'paragraph', children: [{ text: 'hello' }] }];
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 },
    });
    return editor;
  }

  it('applies the requested highlight mark', () => {
    const editor = buildEditorWithSelection();
    toggleHighlightMark(editor, 'highlight-mint');
    expect(Editor.marks(editor)?.['highlight-mint']).toBe(true);
  });

  it('removes a previously applied highlight mark before applying a new one', () => {
    const editor = buildEditorWithSelection();
    toggleHighlightMark(editor, 'highlight-sunset');
    toggleHighlightMark(editor, 'highlight-berry');
    const marks = Editor.marks(editor) ?? {};
    expect(marks['highlight-sunset']).toBeUndefined();
    expect(marks['highlight-berry']).toBe(true);
  });

  it('toggling the same mark twice removes it', () => {
    const editor = buildEditorWithSelection();
    toggleHighlightMark(editor, 'highlight-ocean');
    toggleHighlightMark(editor, 'highlight-ocean');
    expect(Editor.marks(editor)?.['highlight-ocean']).toBeUndefined();
  });
});
