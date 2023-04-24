import { CheckboxField } from '@appsemble/react-components';
import { type ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaBooleanEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = false,
}: CommonJSONSchemaEditorProps<boolean>): ReactElement {
  return (
    <CheckboxField
      disabled={disabled}
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      name={name}
      onChange={onChange}
      required={required}
      title={name.split(/\./g).pop()}
      value={value}
    />
  );
}
