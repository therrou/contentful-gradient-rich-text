import React from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GradientRichTextEditor } from '../richText/GradientRichTextEditor';

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();
  return <GradientRichTextEditor sdk={sdk} />;
};

export default Field;
