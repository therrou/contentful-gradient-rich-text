import React, { useMemo, useState, useCallback, useRef } from 'react';
import { createEditor, type Descendant } from 'slate';
import { Slate, Editable, withReact, type RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import type { TopLevelBlock } from '@contentful/rich-text-types';
import { IconButton } from '@contentful/f36-components';
import { isGradientMarkType, type GradientMarkType } from '../gradientPresets';
import { GradientLeaf } from './GradientLeaf';
import { GradientToolbarButton } from './GradientToolbarButton';
import { documentToSlateValue, slateValueToDocument, getNonParagraphBlocks } from './serialization';

interface GradientRichTextEditorProps {
  sdk: FieldExtensionSDK;
}

export function GradientRichTextEditor({ sdk }: GradientRichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() =>
    documentToSlateValue(sdk.field.getValue())
  );
  // Non-paragraph top-level blocks (headings, lists, etc.) from the field's
  // original document. This editor only edits paragraphs, so these are kept
  // as-is and re-appended on every write-back instead of being silently
  // dropped — see serialization.ts's slateValueToDocument doc comment.
  const preservedBlocksRef = useRef<TopLevelBlock[]>(getNonParagraphBlocks(sdk.field.getValue()));

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue);

      // Slate fires onChange for selection-only moves (arrow keys, clicks)
      // too. Skip those — writing back on every cursor move would dirty the
      // entry and generate needless API traffic with no content change.
      const isSelectionOnly = editor.operations.every((op) => op.type === 'set_selection');
      if (isSelectionOnly) return;

      sdk.field
        .setValue(slateValueToDocument(newValue, preservedBlocksRef.current))
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
    if (leafRecord.bold) node = <strong>{node}</strong>;
    if (leafRecord.italic) node = <em>{node}</em>;
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
