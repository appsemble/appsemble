import { InputField } from '@appsemble/react-components';
import { type OpenAPIV3 } from 'openapi-types';
import { type ReactElement } from 'react';

import { MarkdownContent } from '../../MarkdownContent/index.js';
import { JSONSchemaLabel } from '../JSONSchemaLabel/index.js';
import { type CommonJSONSchemaEditorProps } from '../types.js';

export function JSONSchemaNumberEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = 0,
}: CommonJSONSchemaEditorProps<number>): ReactElement {
  return (
    <InputField
      disabled={disabled}
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      max={schema.maximum}
      min={schema.minimum}
      name={name}
      onChange={onChange}
      placeholder={(schema as OpenAPIV3.SchemaObject).example}
      required={required}
      step={schema.multipleOf || schema.type === 'integer' ? 1 : undefined}
      type="number"
      value={value}
    />
  );
}
