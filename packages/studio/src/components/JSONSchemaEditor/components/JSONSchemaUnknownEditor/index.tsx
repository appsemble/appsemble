import { JSONInput, MarkdownContent } from '@appsemble/react-components';
import React, { ReactElement } from 'react';

import type { CommonJSONSchemaEditorProps } from '../../types';
import { JSONSchemaLabel } from '../JSONSchemaLabel';

export function JSONSchemaUnknownEditor({
  name,
  onChange,
  prefix,
  required,
  schema,
  value = null,
}: CommonJSONSchemaEditorProps<any>): ReactElement {
  return (
    <JSONInput
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    />
  );
}
