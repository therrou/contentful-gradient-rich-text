import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEditor } from 'slate';
import { withReact } from 'slate-react';
import { HighlightToolbarButton } from '../richText/HighlightToolbarButton';
import * as gradientPlugin from '../richText/markToggle';

describe('HighlightToolbarButton', () => {
  it('renders one menu item per preset and applies the mark on click', () => {
    const toggleSpy = vi.spyOn(gradientPlugin, 'toggleHighlightMark').mockImplementation(() => {});
    const editor = withReact(createEditor());

    render(<HighlightToolbarButton editor={editor} />);

    fireEvent.click(screen.getByLabelText('Highlight text'));
    fireEvent.click(screen.getByText('Ocean'));

    expect(toggleSpy).toHaveBeenCalledWith(editor, 'highlight-ocean');
  });

  it('clears highlight marks when "No highlight" is clicked', () => {
    const clearSpy = vi.spyOn(gradientPlugin, 'clearHighlightMarks').mockImplementation(() => {});
    const editor = withReact(createEditor());

    render(<HighlightToolbarButton editor={editor} />);

    fireEvent.click(screen.getByLabelText('Highlight text'));
    fireEvent.click(screen.getByText('No highlight'));

    expect(clearSpy).toHaveBeenCalledWith(editor);
  });
});
