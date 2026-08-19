import React, { useEffect } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { GradientRichTextEditor } from '../richText/GradientRichTextEditor';

const Field = () => {
  const sdk = useSDK<FieldExtensionSDK>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  return <GradientRichTextEditor sdk={sdk} />;
};

export default Field;
