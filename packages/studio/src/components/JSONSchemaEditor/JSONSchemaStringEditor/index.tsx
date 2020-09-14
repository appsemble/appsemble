import { InputField, MarkdownContent } from '@appsemble/react-components';
import type { OpenAPIV3 } from 'openapi-types';
import React, { ComponentPropsWithoutRef, ReactElement } from 'react';

import { JSONSchemaLabel } from '../JSONSchemaLabel';
import type { CommonJSONSchemaEditorProps } from '../types';

export function JSONSchemaStringEditor({
  disabled,
  name,
  onChange,
  prefix,
  required,
  schema,
  value = '',
}: CommonJSONSchemaEditorProps<number | string>): ReactElement {
  let type: ComponentPropsWithoutRef<typeof InputField>['type'] = 'text';

  if (schema.type === 'integer' || schema.type === 'number') {
    type = 'number';
  } else if (schema.format === 'email') {
    type = 'email';
  } else if (schema.format === 'password') {
    type = 'password';
  } else if (schema.format === 'date') {
    type = 'date';
  } else if (schema.format === 'date-time') {
    type = 'datetime-local';
  }

  return (
    <InputField
      disabled={disabled}
      help={<MarkdownContent content={schema.description} />}
      label={<JSONSchemaLabel name={name} prefix={prefix} schema={schema} />}
      max={schema.maximum}
      maxLength={schema.maxLength}
      min={schema.minimum}
      minLength={schema.minLength}
      name={name}
      onChange={onChange}
      placeholder={(schema as OpenAPIV3.SchemaObject).example}
      required={required}
      step={schema.multipleOf}
      type={type}
      value={value}
    />
  );
}
