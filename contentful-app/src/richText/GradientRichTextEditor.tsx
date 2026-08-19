import React, { useMemo, useState, useCallback } from 'react';
import { createEditor, type Descendant } from 'slate';
import { Slate, Editable, withReact, type RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import type { FieldExtensionSDK } from '@contentful/app-sdk';
import { IconButton } from '@contentful/f36-components';
import { isGradientMarkType, type GradientMarkType } from '../gradientPresets';
import { GradientLeaf } from './GradientLeaf';
import { GradientToolbarButton } from './GradientToolbarButton';
import { documentToSlateValue, slateValueToDocument } from './serialization';

interface GradientRichTextEditorProps {
  sdk: FieldExtensionSDK;
}

export function GradientRichTextEditor({ sdk }: GradientRichTextEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() =>
    documentToSlateValue(sdk.field.getValue())
  );

  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue);
      sdk.field.setValue(slateValueToDocument(newValue));
    },
    [sdk]
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
