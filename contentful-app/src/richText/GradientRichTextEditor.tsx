import React, { useMemo, useState, useCallback, useEffect, useReducer, useRef } from 'react';
import {
  createEditor,
  Editor,
  Element as SlateElement,
  Point,
  Range,
  Transforms,
  type Descendant,
} from 'slate';
import {
  Slate,
  Editable,
  withReact,
  ReactEditor,
  type RenderLeafProps,
  type RenderElementProps,
} from 'slate-react';
import { withHistory } from 'slate-history';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { IconButton, Menu, Tooltip } from '@contentful/f36-components';
import {
  GRADIENT_ANIMATED_MARK_TYPE,
  isGradientMarkType,
  isHighlightMarkType,
  type GradientMarkType,
  type HighlightMarkType,
} from '../gradientPresets';
import { GradientLeaf } from './GradientLeaf';
import { GradientToolbarButton } from './GradientToolbarButton';
import { HighlightToolbarButton } from './HighlightToolbarButton';
import {
  documentToSlateValue,
  slateValueToDocument,
  getBlockLayout,
  type BlockLayoutEntry,
} from './serialization';

interface GradientRichTextEditorProps {
  sdk: FieldExtensionSDK;
}

const LIST_TYPES = ['unordered-list', 'ordered-list'];

function isMarkActive(editor: Editor, mark: string): boolean {
  const marks = (Editor.marks(editor) ?? {}) as Record<string, unknown>;
  return marks[mark] === true;
}

function toggleMark(editor: Editor, mark: string) {
  if (isMarkActive(editor, mark)) editor.removeMark(mark);
  else editor.addMark(mark, true);
}

function isBlockActive(editor: Editor, format: string): boolean {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === format,
  });
  return !!match;
}

function toggleBlock(editor: Editor, format: string) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      LIST_TYPES.includes((n as any).type) &&
      !isList,
    split: true,
  });

  const newType = isActive ? 'paragraph' : isList ? 'list-item' : format;
  Transforms.setNodes(editor, { type: newType } as Partial<SlateElement>);

  if (!isActive && isList) {
    Transforms.wrapNodes(editor, { type: format, children: [] } as unknown as SlateElement);
  }
}

function insertHr(editor: Editor) {
  Transforms.insertNodes(editor, {
    type: 'hr',
    children: [{ text: '' }],
  } as unknown as SlateElement);
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  } as unknown as SlateElement);
}

// f36's IconButton doesn't visually respond to aria-pressed on its own, so
// the "active" state (e.g. Bold is applied at the cursor/selection) had no
// visible indicator. Wrapping it in a span with conditional styling gives
// toolbar buttons a highlighted state, matching what aria-pressed already
// reports to assistive tech.
function ToolbarButtonWrapper({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        backgroundColor: active ? '#e5edff' : 'transparent',
        borderRadius: '4px',
      }}
    >
      {children}
    </span>
  );
}

function BlockButton({
  editor,
  format,
  label,
  tooltip,
}: {
  editor: Editor;
  format: string;
  label: React.ReactNode;
  tooltip: string;
}) {
  const active = isBlockActive(editor, format);
  return (
    <ToolbarButtonWrapper active={active}>
      <Tooltip content={tooltip} placement="top">
        <IconButton
          variant="transparent"
          aria-label={tooltip}
          aria-pressed={active}
          icon={<span>{label}</span>}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleBlock(editor, format);
          }}
        />
      </Tooltip>
    </ToolbarButtonWrapper>
  );
}

function MarkButton({
  editor,
  format,
  label,
  tooltip,
}: {
  editor: Editor;
  format: string;
  label: React.ReactNode;
  tooltip: string;
}) {
  const active = isMarkActive(editor, format);
  return (
    <ToolbarButtonWrapper active={active}>
      <Tooltip content={tooltip} placement="top">
        <IconButton
          variant="transparent"
          aria-label={tooltip}
          aria-pressed={active}
          icon={<span>{label}</span>}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleMark(editor, format);
          }}
        />
      </Tooltip>
    </ToolbarButtonWrapper>
  );
}

const HEADING_OPTIONS: { format: string; label: string }[] = [
  { format: 'paragraph', label: 'Paragraph' },
  { format: 'heading-1', label: 'Heading 1' },
  { format: 'heading-2', label: 'Heading 2' },
  { format: 'heading-3', label: 'Heading 3' },
  { format: 'heading-4', label: 'Heading 4' },
  { format: 'heading-5', label: 'Heading 5' },
  { format: 'heading-6', label: 'Heading 6' },
];

function currentHeadingLabel(editor: Editor): string {
  const active = HEADING_OPTIONS.find((option) => isBlockActive(editor, option.format));
  return active?.label ?? 'Paragraph';
}

function HeadingDropdown({ editor }: { editor: Editor }) {
  // Opening the dropdown (a portal-rendered menu) moves focus away from the
  // contentEditable, which collapses/clears editor.selection — capture it up
  // front so the block-type change still applies to the right range.
  const savedSelectionRef = useRef<Range | null>(null);

  return (
    <Menu>
      <Menu.Trigger>
        {/* A Tooltip here would need Menu.Trigger to clone a ref onto it for
            popover positioning/focus-restore, but Tooltip isn't a forwardRef
            component — the ref silently drops. A native title attribute
            gives the same hover description without that breakage. */}
        <IconButton
          variant="transparent"
          aria-label="Text style"
          title="Text style — paragraph or heading level"
          icon={<span>{currentHeadingLabel(editor)} ▾</span>}
          onMouseDown={() => {
            savedSelectionRef.current = editor.selection;
          }}
        />
      </Menu.Trigger>
      <Menu.List>
        {HEADING_OPTIONS.map((option) => (
          <Menu.Item
            key={option.format}
            onClick={() => {
              if (savedSelectionRef.current) {
                Transforms.select(editor, savedSelectionRef.current);
              }
              ReactEditor.focus(editor as unknown as ReactEditor);
              Transforms.setNodes(editor, { type: option.format } as Partial<SlateElement>, {
                match: (n) =>
                  !Editor.isEditor(n) &&
                  SlateElement.isElement(n) &&
                  !LIST_TYPES.includes((n as any).type) &&
                  (n as any).type !== 'list-item',
              });
            }}
          >
            {option.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}

export function GradientRichTextEditor({ sdk }: GradientRichTextEditorProps) {
  const editor = useMemo(() => {
    const base = withHistory(withReact(createEditor()));
    const { isVoid, deleteBackward, normalizeNode } = base;

    base.isVoid = (element) => (element as any).type === 'hr' || isVoid(element);

    // Slate has no built-in notion of "list item" semantics: by default,
    // Backspace at the start of a list item just merges it into whatever
    // precedes it *inside* the list, so there was no way to back out of a
    // bullet/numbered list once you were in one.
    base.deleteBackward = (unit) => {
      const { selection } = base;
      if (selection && Range.isCollapsed(selection)) {
        const [listItemMatch] = Editor.nodes(base, {
          match: (n) =>
            !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'list-item',
        });

        if (listItemMatch) {
          const [, listItemPath] = listItemMatch;
          const start = Editor.start(base, listItemPath);
          if (Point.equals(selection.anchor, start)) {
            Transforms.setNodes(base, { type: 'paragraph' } as Partial<SlateElement>, {
              match: (n) =>
                !Editor.isEditor(n) && SlateElement.isElement(n) && (n as any).type === 'list-item',
            });
            Transforms.unwrapNodes(base, {
              match: (n) =>
                !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes((n as any).type),
              split: true,
            });
            return;
          }
        }
      }
      deleteBackward(unit);
    };

    // Deleting a list item's only content (or selecting-all and deleting)
    // can leave behind an empty <ul>/<ol> or <li> that Slate's default
    // normalization doesn't know to clean up, since list semantics aren't
    // part of its base schema — without this, "select all, delete" appeared
    // to do nothing because the leftover empty wrapper nodes stuck around.
    base.normalizeNode = (entry) => {
      const [node, path] = entry;

      // Slate's own normalizeNode explicitly skips this case for the editor
      // root (`element !== editor` guard in its source) — nested elements
      // get an auto-inserted empty text child when empty, but the root
      // doesn't. Removing the document's last list/list-item below (or any
      // other path that empties the root) would otherwise leave
      // editor.children === [], which crashes on the next point/range
      // lookup ("no end text node").
      if (path.length === 0 && (node as any).children?.length === 0) {
        Transforms.insertNodes(
          base,
          { type: 'paragraph', children: [{ text: '' }] } as unknown as SlateElement,
          { at: [0] }
        );
        return;
      }

      if (SlateElement.isElement(node)) {
        const type = (node as any).type;
        if ((LIST_TYPES.includes(type) || type === 'list-item') && node.children.length === 0) {
          Transforms.removeNodes(base, { at: path });
          return;
        }
      }

      normalizeNode(entry);
    };

    return base;
  }, []);
  const [value, setValue] = useState<Descendant[]>(() =>
    documentToSlateValue(sdk.field.getValue())
  );

  // The toolbar's active-state highlighting reads editor.selection directly
  // on every render, so it only updates when this component re-renders.
  // Arrow-key navigation always produces a Slate operation (so onChange/
  // setValue re-renders us), but a plain click that lands the browser's
  // native selection in the same place Slate already thinks it is can skip
  // that — this forces a render on every click so the toolbar stays in
  // sync with wherever the cursor/selection actually is.
  const [, forceToolbarRefresh] = useReducer((count: number) => count + 1, 0);

  // `<Slate>` assigns `editor.children = initialValue` directly and never
  // normalizes it (confirmed in slate-react's source — the first-mount
  // effect is a plain assignment, no Editor.normalize call). A field saved
  // earlier while list deletion was still broken can contain a malformed
  // document (e.g. an empty list-item Contentful happily stored), and
  // without this, the very first keystroke crashes trying to compute a
  // start/end point against that invalid tree before our normalizeNode
  // override ever runs. Forcing normalization right after mount also
  // self-heals the stored field value on next save.
  useEffect(() => {
    Editor.normalize(editor, { force: true });
    setValue(editor.children);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmptyDocument =
    value.length === 1 &&
    (value[0] as any).type === 'paragraph' &&
    (value[0] as any).children.length === 1 &&
    (value[0] as any).children[0].text === '';

  // Records the original document's top-level block order (which slots this
  // editor renders/edits vs. blocks outside its scope, e.g. embedded
  // entries/assets or tables). On write-back the regenerated blocks are
  // merged back into their original positions instead of the preserved
  // blocks being appended at the end — see serialization.ts's
  // slateValueToDocument doc comment.
  const layoutRef = useRef<BlockLayoutEntry[]>(getBlockLayout(sdk.field.getValue()));

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue);

      // Slate fires onChange for selection-only moves (arrow keys, clicks)
      // too. Skip those — writing back on every cursor move would dirty the
      // entry and generate needless API traffic with no content change.
      const isSelectionOnly = editor.operations.every((op) => op.type === 'set_selection');
      if (isSelectionOnly) return;

      sdk.field
        .setValue(slateValueToDocument(newValue, layoutRef.current))
        .catch((error: unknown) => {
          // eslint-disable-next-line no-console
          console.error('GradientRichTextEditor: failed to save field value', error);
        });
    },
    [sdk, editor]
  );

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf, text } = props;
    const leafRecord = leaf as unknown as Record<string, unknown>;
    const gradientKey = Object.keys(leafRecord).find((key) => isGradientMarkType(key));
    const highlightKey = Object.keys(leafRecord).find((key) => isHighlightMarkType(key));
    let node = children;
    if (leafRecord.bold) node = <strong>{node}</strong>;
    if (leafRecord.italic) node = <em>{node}</em>;
    if (leafRecord.underline) node = <u>{node}</u>;
    if (leafRecord.code) node = <code>{node}</code>;
    if (gradientKey || highlightKey) {
      return (
        <GradientLeaf
          markType={gradientKey as GradientMarkType | undefined}
          highlightMarkType={highlightKey as HighlightMarkType | undefined}
          attributes={attributes}
          leaf={leaf}
          text={text}
        >
          {node}
        </GradientLeaf>
      );
    }
    return <span {...attributes}>{node}</span>;
  }, []);

  const renderElement = useCallback((props: RenderElementProps) => {
    const { attributes, children, element } = props;
    const type = (element as any).type;
    // Contentful's field editor CSS doesn't style raw h1-h6 tags, so without
    // explicit spacing headings rendered flush against neighboring blocks
    // with a cramped line-height.
    const headingStyle = { lineHeight: 1.3, marginTop: '0.6em', marginBottom: '0.3em' };
    switch (type) {
      case 'heading-1':
        return (
          <h1 {...attributes} style={headingStyle}>
            {children}
          </h1>
        );
      case 'heading-2':
        return (
          <h2 {...attributes} style={headingStyle}>
            {children}
          </h2>
        );
      case 'heading-3':
        return (
          <h3 {...attributes} style={headingStyle}>
            {children}
          </h3>
        );
      case 'heading-4':
        return (
          <h4 {...attributes} style={headingStyle}>
            {children}
          </h4>
        );
      case 'heading-5':
        return (
          <h5 {...attributes} style={headingStyle}>
            {children}
          </h5>
        );
      case 'heading-6':
        return (
          <h6 {...attributes} style={headingStyle}>
            {children}
          </h6>
        );
      case 'blockquote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'unordered-list':
        return <ul {...attributes}>{children}</ul>;
      case 'ordered-list':
        return <ol {...attributes}>{children}</ol>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'hr':
        return (
          <div {...attributes} contentEditable={false}>
            <hr />
            {children}
          </div>
        );
      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  return (
    <Slate editor={editor} initialValue={value} onChange={handleChange}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '8px',
          borderBottom: '1px solid #e5e5e5',
          paddingBottom: '8px',
        }}
      >
        <HeadingDropdown editor={editor} />
        <MarkButton editor={editor} format="bold" label={<strong>B</strong>} tooltip="Bold" />
        <MarkButton editor={editor} format="italic" label={<em>I</em>} tooltip="Italic" />
        <MarkButton editor={editor} format="underline" label={<u>U</u>} tooltip="Underline" />
        <MarkButton
          editor={editor}
          format="code"
          label={<code>{'</>'}</code>}
          tooltip="Inline code"
        />
        <GradientToolbarButton editor={editor} />
        <MarkButton
          editor={editor}
          format={GRADIENT_ANIMATED_MARK_TYPE}
          label={<span aria-hidden>✨</span>}
          tooltip="Animate the selected gradient text"
        />
        <HighlightToolbarButton editor={editor} />
        <BlockButton
          editor={editor}
          format="blockquote"
          label={<span aria-hidden>“ ”</span>}
          tooltip="Blockquote"
        />
        <BlockButton
          editor={editor}
          format="unordered-list"
          label={<span aria-hidden>•—</span>}
          tooltip="Bulleted list"
        />
        <BlockButton
          editor={editor}
          format="ordered-list"
          label={<span aria-hidden>1.—</span>}
          tooltip="Numbered list"
        />
        <Tooltip content="Insert horizontal rule" placement="top">
          <IconButton
            variant="transparent"
            aria-label="Insert horizontal rule"
            icon={<span aria-hidden>—</span>}
            onMouseDown={(e: React.MouseEvent) => {
              e.preventDefault();
              insertHr(editor);
            }}
          />
        </Tooltip>
      </div>
      {/* Slate-react's own `placeholder` prop drives a decoration built from
          Editor.end(editor, []), which throws once the document contains a
          void element (our `hr`) or more than one block — "Cannot get the
          end point in the node at path [] because it has no end text node."
          A plain CSS overlay avoids touching Slate's point/path machinery
          entirely. */}
      <div style={{ position: 'relative' }}>
        {isEmptyDocument && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              color: '#a9a9a9',
              pointerEvents: 'none',
            }}
          >
            Start typing…
          </span>
        )}
        <Editable
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          onClick={forceToolbarRefresh}
          style={{
            minHeight: '320px',
            padding: '12px',
            border: '1px solid #d3dce0',
            borderRadius: '6px',
            // A gradient-marked leaf sets color: transparent, but that's a
            // *text* color, not the caret color — without this override the
            // caret adopted the ambient text color and stayed genuinely
            // invisible while typing inside (or right after) gradient text.
            caretColor: '#1a56db',
          }}
        />
      </div>
    </Slate>
  );
}
