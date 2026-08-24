import React, { useEffect, useRef, useState } from 'react';
import { Editor, Element as SlateElement, Range, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { IconButton, Popover, TextInput, Button, Flex } from '@contentful/f36-components';
import { LinkSimpleIcon } from '@contentful/f36-icons';

interface HyperlinkButtonProps {
  editor: Editor;
}

function findActiveLink(editor: Editor) {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'link',
  });
  return match;
}

function insertOrUpdateLink(editor: Editor, url: string, selection: Range) {
  Transforms.select(editor, selection);

  const [activeLink] = findActiveLink(editor);
  if (activeLink) {
    Transforms.setNodes(
      editor,
      { url } as Partial<SlateElement>,
      { match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'link' }
    );
    return;
  }

  const link = {
    type: 'link',
    url,
    children: Range.isCollapsed(selection) ? [{ text: url }] : [],
  } as unknown as SlateElement;

  if (Range.isCollapsed(selection)) {
    Transforms.insertNodes(editor, link);
  } else {
    Transforms.wrapNodes(editor, link, { split: true });
    Transforms.collapse(editor, { edge: 'end' });
  }
}

function removeLink(editor: Editor) {
  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'link',
  });
}

export function HyperlinkButton({ editor }: HyperlinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const savedSelectionRef = useRef<Range | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeLinkEntry = editor.selection ? findActiveLink(editor) : undefined;
  const isActive = !!activeLinkEntry;

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const openPopover = () => {
    savedSelectionRef.current = editor.selection;
    const [linkNode] = activeLinkEntry ?? [];
    setUrl((linkNode as any)?.url ?? '');
    setIsOpen(true);
  };

  const applyLink = () => {
    const selection = savedSelectionRef.current;
    if (selection && url.trim()) {
      insertOrUpdateLink(editor, url.trim(), selection);
    }
    setIsOpen(false);
    ReactEditor.focus(editor as unknown as ReactEditor);
  };

  const handleRemove = () => {
    if (savedSelectionRef.current) {
      Transforms.select(editor, savedSelectionRef.current);
    }
    removeLink(editor);
    setIsOpen(false);
    ReactEditor.focus(editor as unknown as ReactEditor);
  };

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-start">
      <Popover.Trigger>
        <IconButton
          variant="transparent"
          aria-label="Hyperlink"
          aria-pressed={isActive}
          title="Insert or edit a hyperlink"
          icon={<LinkSimpleIcon />}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            openPopover();
          }}
        />
      </Popover.Trigger>
      <Popover.Content>
        <Flex padding="spacingS" gap="spacingXs" alignItems="center">
          <TextInput
            ref={inputRef}
            aria-label="URL"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') {
                setIsOpen(false);
              }
            }}
          />
          <Button size="small" variant="primary" onClick={applyLink}>
            Apply
          </Button>
          {isActive && (
            <Button size="small" variant="negative" onClick={handleRemove}>
              Remove
            </Button>
          )}
        </Flex>
      </Popover.Content>
    </Popover>
  );
}
