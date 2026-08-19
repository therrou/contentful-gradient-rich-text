import React, { useMemo, useState, useCallback, useRef } from 'react';
import { createEditor, type Descendant } from 'slate';
import { Slate, Editable, withReact, type RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { IconButton } from '@contentful/f36-components';
import { isGradientMarkType, type GradientMarkType } from '../gradientPresets';
import { GradientLeaf } from './GradientLeaf';
import { GradientToolbarButton } from './GradientToolbarButton';
import {
  documentToSlateValue,
  slateValueToDocument,
  getBlockLayout,
  type BlockLayoutEntry,
} from './serialization';

interface GradientRichTextEditorProps {
  sdk: FieldExtensionSDK;
}

export function GradientRichTextEditor({ sdk }: GradientRichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() =>
    documentToSlateValue(sdk.field.getValue())
  );

  // Records the original document's top-level block order (which slots were
  // paragraphs vs. non-paragraph blocks this editor doesn't render, e.g.
  // headings/lists). This editor only edits paragraphs, so on write-back the
  // regenerated paragraphs are merged back into their original positions
  // instead of the preserved blocks being appended at the end — see
  // serialization.ts's slateValueToDocument doc comment.
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
    let node = children;
    if (leafRecord.bold) node = <strong>{node}</strong>;
    if (leafRecord.italic) node = <em>{node}</em>;
    if (gradientKey) {
      return (
        <GradientLeaf
          markType={gradientKey as GradientMarkType}
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

  return (
    <Slate editor={editor} initialValue={value} onChange={handleChange}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
        <IconButton
          variant="transparent"
          aria-label="Bold"
          icon={<strong>B</strong>}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            const marks = (editor.marks ?? {}) as Record<string, unknown>;
            const isActive = marks.bold === true;
            if (isActive) editor.removeMark('bold');
            else editor.addMark('bold', true);
          }}
        />
        <IconButton
          variant="transparent"
          aria-label="Italic"
          icon={<em>I</em>}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            const marks = (editor.marks ?? {}) as Record<string, unknown>;
            const isActive = marks.italic === true;
            if (isActive) editor.removeMark('italic');
            else editor.addMark('italic', true);
          }}
        />
        <GradientToolbarButton editor={editor} />
      </div>
      <Editable renderLeaf={renderLeaf} />
    </Slate>
  );
}
