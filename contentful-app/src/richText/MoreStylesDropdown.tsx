import React, { useRef } from 'react';
import { Editor, Transforms, type Range } from 'slate';
import { ReactEditor } from 'slate-react';
import { Menu, IconButton } from '@contentful/f36-components';
import {
  DotsThreeVerticalIcon,
  TextStrikethroughIcon,
  TextSuperscriptIcon,
  TextSubscriptIcon,
  CodeSimpleIcon,
} from '@contentful/f36-icons';

interface MoreStylesDropdownProps {
  editor: Editor;
  isMarkActive: (editor: Editor, mark: string) => boolean;
  toggleMark: (editor: Editor, mark: string) => void;
}

const OPTIONS: { format: string; label: string; icon: React.ReactNode }[] = [
  { format: 'strikethrough', label: 'Strikethrough', icon: <TextStrikethroughIcon /> },
  { format: 'superscript', label: 'Superscript', icon: <TextSuperscriptIcon /> },
  { format: 'subscript', label: 'Subscript', icon: <TextSubscriptIcon /> },
  { format: 'code', label: 'Code', icon: <CodeSimpleIcon /> },
];

export function MoreStylesDropdown({ editor, isMarkActive, toggleMark }: MoreStylesDropdownProps) {
  // Same selection-loss issue as the other dropdown toolbar buttons: opening
  // the portal menu moves focus off the contentEditable and clears
  // editor.selection.
  const savedSelectionRef = useRef<Range | null>(null);

  return (
    <Menu>
      <Menu.Trigger>
        <IconButton
          variant="transparent"
          aria-label="More text styles"
          title="More text styles"
          icon={<DotsThreeVerticalIcon />}
          onMouseDown={() => {
            savedSelectionRef.current = editor.selection;
          }}
        />
      </Menu.Trigger>
      <Menu.List>
        {OPTIONS.map((option) => (
          <Menu.Item
            key={option.format}
            onClick={() => {
              if (savedSelectionRef.current) {
                Transforms.select(editor, savedSelectionRef.current);
              }
              ReactEditor.focus(editor as unknown as ReactEditor);
              toggleMark(editor, option.format);
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {option.icon}
              {option.label}
              {isMarkActive(editor, option.format) ? ' ✓' : ''}
            </span>
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
