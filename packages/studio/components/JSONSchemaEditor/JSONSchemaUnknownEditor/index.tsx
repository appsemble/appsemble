import { JSONField } from '@appsemble/react-components';
import { type ReactNode } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaUnknownEditor({
  error,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = null,
}: CommonJSONSchemaEditorProps<any>): ReactNode {
  return (
    <JSONField
      error={error}
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      value={value}
    />
  );
}
