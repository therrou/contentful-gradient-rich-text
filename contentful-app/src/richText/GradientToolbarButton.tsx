import React from 'react';
import type { Editor } from 'slate';
import { Menu, IconButton } from '@contentful/f36-components';
import { GRADIENT_PRESETS } from '../gradientPresets';
import { toggleGradientMark } from './gradientPlugin';

interface GradientToolbarButtonProps {
  editor: Editor;
}

export function GradientToolbarButton({ editor }: GradientToolbarButtonProps) {
  return (
    <Menu>
      <Menu.Trigger>
        <IconButton
          variant="transparent"
          aria-label="Gradient text"
          icon={<span aria-hidden>◈</span>}
        />
      </Menu.Trigger>
      <Menu.List>
        {GRADIENT_PRESETS.map((preset) => (
          <Menu.Item
            key={preset.markType}
            onClick={() => toggleGradientMark(editor, preset.markType)}
          >
            {preset.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
