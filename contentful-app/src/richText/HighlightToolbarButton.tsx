import React, { useRef } from 'react';
import { Editor, Transforms, type Range } from 'slate';
import { ReactEditor } from 'slate-react';
import { Menu, IconButton } from '@contentful/f36-components';
import { HIGHLIGHT_PRESETS } from '../gradientPresets';
import { clearHighlightMarks, toggleHighlightMark } from './markToggle';

interface HighlightToolbarButtonProps {
  editor: Editor;
}

export function HighlightToolbarButton({ editor }: HighlightToolbarButtonProps) {
  // Same selection-loss issue as GradientToolbarButton: opening the portal
  // menu moves focus off the contentEditable and clears editor.selection.
  const savedSelectionRef = useRef<Range | null>(null);

  return (
    <Menu>
      <Menu.Trigger>
        {/* Native title, not Tooltip: Menu.Trigger clones a ref onto its
            single child for popover positioning/focus-restore, and Tooltip
            isn't a forwardRef component, so that ref would silently drop. */}
        <IconButton
          variant="transparent"
          aria-label="Highlight text"
          title="Highlight the selected text with a color background"
          icon={<span aria-hidden>▧</span>}
          onMouseDown={() => {
            savedSelectionRef.current = editor.selection;
          }}
        />
      </Menu.Trigger>
      <Menu.List>
        <Menu.Item
          onClick={() => {
            if (savedSelectionRef.current) {
              Transforms.select(editor, savedSelectionRef.current);
            }
            ReactEditor.focus(editor as unknown as ReactEditor);
            clearHighlightMarks(editor);
          }}
        >
          No highlight
        </Menu.Item>
        {HIGHLIGHT_PRESETS.map((preset) => (
          <Menu.Item
            key={preset.markType}
            onClick={() => {
              if (savedSelectionRef.current) {
                Transforms.select(editor, savedSelectionRef.current);
              }
              ReactEditor.focus(editor as unknown as ReactEditor);
              toggleHighlightMark(editor, preset.markType);
            }}
          >
            {preset.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
