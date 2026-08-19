import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { GradientToolbarButton } from '../richText/GradientToolbarButton';
import * as gradientPlugin from '../richText/gradientPlugin';

describe('GradientToolbarButton', () => {
  it('renders one menu item per preset and applies the mark on click', () => {
    const toggleSpy = vi.spyOn(gradientPlugin, 'toggleGradientMark').mockImplementation(() => {});
    const editor = withReact(createEditor());

    render(<GradientToolbarButton editor={editor} />);

    fireEvent.click(screen.getByLabelText('Gradient text'));
    fireEvent.click(screen.getByText('Ocean'));

    expect(toggleSpy).toHaveBeenCalledWith(editor, 'gradient-ocean');
  });
});
